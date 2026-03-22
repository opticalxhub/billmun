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
    const { action, user_id } = body;
    const ebUserId = context.ebUserId;

    if (!action || !user_id) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const { data: targetUser, error: uErr } = await supabaseAdmin.from("users").select("*").eq("id", user_id).single();
    if (uErr || !targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const logAudit = async (desc: string) => {
      try {
        await supabaseAdmin.from("audit_logs").insert({
          actor_id: ebUserId,
          action: desc,
          target_type: "USER",
          target_id: user_id,
        });
      } catch (err) {
        console.error("Audit logging failed:", err);
      }
    };

    if (action === "approve") {
      await supabaseAdmin.from("users").update({ status: "APPROVED", approved_at: new Date().toISOString(), approved_by_id: ebUserId }).eq("id", user_id);
      try { await (supabaseAdmin as any).auth.admin.updateUserById(user_id, { email_confirm: true }); } catch { /* ignore */ }
      
      // Auto-assign delegate to their preferred committee and country upon approval if they don't have one
      if (targetUser.role === 'DELEGATE' && targetUser.preferred_committee) {
        const { data: committees } = await supabaseAdmin.from('committees').select('id, name');
        const committee = committees?.find(c => c.name === targetUser.preferred_committee || targetUser.preferred_committee.includes(c.name) || c.name.includes(targetUser.preferred_committee));
        if (committee) {
          const { data: existingAssignment } = await supabaseAdmin.from('committee_assignments').select('id').eq('user_id', user_id).maybeSingle();
          if (!existingAssignment) {
            await supabaseAdmin.from('committee_assignments').insert({
              user_id: user_id,
              committee_id: committee.id,
              country: targetUser.allocated_country,
              assigned_by_id: ebUserId
            });
          }
        }
      }

      await supabaseAdmin.from("notifications").insert({ user_id: user_id, title: "Application Approved", message: "Your BILLMUN registration has been approved.", type: "SUCCESS" });
      await logAudit(`Approved user ${targetUser.email}`);
      try { await sendApprovalEmail(targetUser.email, targetUser.full_name); } catch { /* ignore */ }
      return NextResponse.json({ ok: true });
    }

    if (action === "reject") {
      const { reason } = body;
      await supabaseAdmin.from("users").update({ status: "REJECTED", rejected_at: new Date().toISOString(), rejected_by_id: ebUserId }).eq("id", user_id);
      await logAudit(`Rejected user ${targetUser.email}`);
      try { await sendRejectionEmail(targetUser.email, targetUser.full_name, reason); } catch { /* ignore */ }
      return NextResponse.json({ ok: true });
    }

    if (action === "suspend") {
      const { reason } = body;
      await supabaseAdmin.from("users").update({ status: "SUSPENDED", suspended_at: new Date().toISOString(), suspended_by_id: ebUserId }).eq("id", user_id);
      await logAudit(`Suspended user ${targetUser.email} for: ${reason}`);
      return NextResponse.json({ ok: true });
    }

    if (action === "reinstate") {
      await supabaseAdmin.from("users").update({ status: "APPROVED", reinstated_at: new Date().toISOString(), reinstated_by_id: ebUserId }).eq("id", user_id);
      await logAudit(`Reinstated user ${targetUser.email}`);
      return NextResponse.json({ ok: true });
    }

    if (action === "change_role") {
      const { role } = body;
      await supabaseAdmin.from("users").update({ role }).eq("id", user_id);
      await logAudit(`Changed user ${targetUser.email} role to ${role}`);
      return NextResponse.json({ ok: true });
    }

    if (action === "assign_committee") {
      const { committee_id, country, seat_number } = body;
      const { data: existing } = await supabaseAdmin.from("committee_assignments").select("id").eq("user_id", user_id).maybeSingle();
      if (existing) {
        await supabaseAdmin.from("committee_assignments").update({ committee_id: committee_id, country, seat_number: seat_number }).eq("id", existing.id);
      } else {
        await supabaseAdmin.from("committee_assignments").insert({ user_id: user_id, committee_id: committee_id, country, seat_number: seat_number, assigned_by_id: ebUserId });
      }
      await logAudit(`Assigned user ${targetUser.email} to committee ${committee_id}`);
      return NextResponse.json({ ok: true });
    }

    if (action === "remove_assignment") {
      await supabaseAdmin.from("committee_assignments").delete().eq("user_id", user_id);
      await logAudit(`Removed committee assignment for user ${targetUser.email}`);
      return NextResponse.json({ ok: true });
    }

    if (action === "add_note") {
      const { content } = body;
      await supabaseAdmin.from("user_notes").insert({ user_id: user_id, content, author_id: ebUserId });
      await logAudit(`Added internal note to user ${targetUser.email}`);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
