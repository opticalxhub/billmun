import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getEBContext } from "@/lib/eb-auth";

export async function POST(req: NextRequest) {
  try {
    const { context, error: authError, status: authStatus } = await getEBContext();
    if (!context) return NextResponse.json({ error: authError }, { status: authStatus || 401 });

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { action, docId, feedback } = body;
    const ebUserId = context.ebUserId;

    if (!action || !docId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const { data: doc } = await supabaseAdmin.from("documents").select("*, users(id, email)").eq("id", docId).single();
    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    const statusMap: Record<string, string> = {
      "approve": "APPROVED",
      "revise": "REVISION_REQUESTED",
      "reject": "REJECTED"
    };

    const newStatus = statusMap[action];
    if (!newStatus) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    if (["revise", "reject"].includes(action) && !feedback?.trim()) {
      return NextResponse.json({ error: "Feedback is required for this action." }, { status: 400 });
    }

    await supabaseAdmin.from("documents").update({
      status: newStatus,
      feedback: feedback || doc.feedback,
      reviewed_at: new Date().toISOString(),
      reviewed_by_id: ebUserId
    }).eq("id", docId);

    // Timeline entry
    try {
      await supabaseAdmin.from("document_status_history").insert({
        document_id: docId,
        status: newStatus,
        changed_by: ebUserId,
        feedback: feedback || null
      });
    } catch { /* ignore */ }

    // Notification
    await supabaseAdmin.from("notifications").insert({
      user_id: doc.user_id,
      title: `Document ${newStatus}`,
      message: `Your document "${doc.title}" was marked as ${newStatus}. ${feedback ? `Feedback: ${feedback}` : ""}`,
      type: newStatus === "APPROVED" ? "SUCCESS" : "WARNING",
      link: "/dashboard/delegate"
    });

    await supabaseAdmin.from("audit_logs").insert({
      actor_id: ebUserId,
      action: `Marked document ${docId} as ${newStatus}`,
      target_type: "DOCUMENT",
      target_id: docId
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
