import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendApprovalEmail, sendRejectionEmail } from "@/lib/email";
import { getEBContext } from "@/lib/eb-auth";

export async function POST(req: NextRequest) {
  try {
    const { context, error, status } = await getEBContext();
    if (!context) return NextResponse.json({ error }, { status: status || 401 });

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { action, userId } = body;
    const ebUserId = context.ebUserId;

    if (!action || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: targetUser } = await supabaseAdmin.from("users").select("*").eq("id", userId).single();
    if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const logAudit = async (desc: string) => {
      await supabaseAdmin.from("audit_logs").insert({
        actor_id: ebUserId,
        action: desc,
        target_type: "USER",
        target_id: userId,
      });
    };

    if (action === "approve") {
      await supabaseAdmin.from("users").update({ status: "APPROVED", approved_at: new Date().toISOString(), approved_by_id: ebUserId }).eq("id", userId);
      try { await (supabaseAdmin as any).auth.admin.updateUserById(userId, { email_confirm: true }); } catch { /* ignore */ }
      await supabaseAdmin.from("notifications").insert({ user_id: userId, title: "Application Approved", message: "Your BILLMUN registration has been approved.", type: "SUCCESS" });
      await logAudit(`Approved user ${targetUser.email}`);
      try { await sendApprovalEmail(targetUser.email, targetUser.full_name); } catch { /* ignore */ }
      return NextResponse.json({ ok: true });
    }

    if (action === "reject") {
      const { reason } = body;
      await supabaseAdmin.from("users").update({ status: "REJECTED" }).eq("id", userId);
      await logAudit(`Rejected user ${targetUser.email}`);
      try { await sendRejectionEmail(targetUser.email, targetUser.full_name, reason); } catch { /* ignore */ }
      return NextResponse.json({ ok: true });
    }

    if (action === "suspend") {
      const { reason } = body;
      await supabaseAdmin.from("users").update({ status: "SUSPENDED" }).eq("id", userId);
      await logAudit(`Suspended user ${targetUser.email} for: ${reason}`);
      return NextResponse.json({ ok: true });
    }

    if (action === "reinstate") {
      await supabaseAdmin.from("users").update({ status: "APPROVED" }).eq("id", userId);
      await logAudit(`Reinstated user ${targetUser.email}`);
      return NextResponse.json({ ok: true });
    }

    if (action === "change_role") {
      const { role } = body;
      await supabaseAdmin.from("users").update({ role }).eq("id", userId);
      await logAudit(`Changed user ${targetUser.email} role to ${role}`);
      return NextResponse.json({ ok: true });
    }

    if (action === "assign_committee") {
      const { committeeId, country, seatNumber } = body;
      const { data: existing } = await supabaseAdmin.from("committee_assignments").select("id").eq("user_id", userId).maybeSingle();
      if (existing) {
        await supabaseAdmin.from("committee_assignments").update({ committee_id: committeeId, country, seat_number: seatNumber }).eq("id", existing.id);
      } else {
        await supabaseAdmin.from("committee_assignments").insert({ user_id: userId, committee_id: committeeId, country, seat_number: seatNumber, assigned_by_id: ebUserId });
      }
      await logAudit(`Assigned user ${targetUser.email} to committee ${committeeId}`);
      return NextResponse.json({ ok: true });
    }

    if (action === "remove_assignment") {
      await supabaseAdmin.from("committee_assignments").delete().eq("user_id", userId);
      await logAudit(`Removed committee assignment for user ${targetUser.email}`);
      return NextResponse.json({ ok: true });
    }

    if (action === "add_note") {
      const { content } = body;
      await supabaseAdmin.from("user_notes").insert({ user_id: userId, content, author_id: ebUserId });
      await logAudit(`Added internal note to user ${targetUser.email}`);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
