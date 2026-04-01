import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getEBContext } from "@/lib/eb-auth";

export const dynamic = "force-dynamic";

// GET: Fetch all contact submissions
export async function GET(_req: NextRequest) {
  try {
    const { context, error, status } = await getEBContext();
    if (!context) return NextResponse.json({ error }, { status: status || 401 });

    const { data, error: qErr } = await supabaseAdmin
      .from("contact_submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (qErr) throw qErr;

    return NextResponse.json({ submissions: data || [] });
  } catch (err: any) {
    console.error("[eb/contact-submissions GET] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Update submission status
export async function POST(req: NextRequest) {
  try {
    const { context, error: authErr, status: authStatus } = await getEBContext();
    if (!context) return NextResponse.json({ error: authErr }, { status: authStatus || 401 });

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "id and status are required" }, { status: 400 });
    }

    const validStatuses = ["PENDING", "READ", "REPLIED", "ARCHIVED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }, { status: 400 });
    }

    const { error: updateErr } = await supabaseAdmin
      .from("contact_submissions")
      .update({ status })
      .eq("id", id);

    if (updateErr) throw updateErr;

    // Log the action
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.ebUserId,
      action: "UPDATE_CONTACT_STATUS",
      target_type: "contact_submission",
      target_id: id,
      metadata: { new_status: status },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[eb/contact-submissions POST] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
