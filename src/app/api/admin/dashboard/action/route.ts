import { NextRequest, NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { runOnDocumentStatusChanged } from "@/lib/automation";

const VALID_PHYSICAL_STATUSES = [
  "Present In Session",
  "Present Unmoderated Caucus",
  "Lavatory Break",
  "Medical Break",
  "Missing",
  "Absent with Reason",
  "Absent without Reason",
];

async function assertDelegateInCommittee(delegateUserId: string, committee_id: string) {
  const { data } = await supabaseAdmin
    .from("committee_assignments")
    .select("user_id")
    .eq("committee_id", committee_id)
    .eq("user_id", delegateUserId)
    .maybeSingle();
  return Boolean(data?.user_id);
}

export async function POST(request: NextRequest) {
  const { context, error, status } = await getAdminContext();
  if (!context) {
    return NextResponse.json({ error }, { status: status || 500 });
  }

  const { adminUserId, committee_id } = context;
  const body = await request.json();
  const action = body?.action;

  try {
    if (action === "update_delegate_status") {
      const user_id = body?.user_id as string;
      const physical_status = body?.physical_status as string;
      if (!user_id || !physical_status) {
        return NextResponse.json({ error: "Missing status fields" }, { status: 400 });
      }
      if (!VALID_PHYSICAL_STATUSES.includes(physical_status)) {
        return NextResponse.json({ error: "Invalid physical status" }, { status: 400 });
      }
      const inCommittee = await assertDelegateInCommittee(user_id, committee_id);
      if (!inCommittee) {
        return NextResponse.json({ error: "Forbidden: delegate not in assigned committee" }, { status: 403 });
      }

      const { error: upsertError } = await supabaseAdmin
        .from("delegate_presence_statuses")
        .upsert({
          user_id: user_id,
          committee_id: committee_id,
          current_status: physical_status,
          last_changed_at: new Date().toISOString(),
          last_changed_by: adminUserId,
        }, { onConflict: 'committee_id,user_id' });

      if (upsertError) {
        console.error("Upsert status error:", upsertError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }
      
      const { error: historyError } = await supabaseAdmin
        .from("delegate_presence_history")
        .insert({
          user_id: user_id,
          committee_id: committee_id,
          status: physical_status,
          changed_by: adminUserId,
        });

      if (historyError) console.warn("Failed to log history:", historyError);

      if (["Lavatory Break", "Medical Break", "Missing"].includes(physical_status)) {
        const { data: securityUsers } = await supabaseAdmin.from("users").select("id").eq("role", "SECURITY");
        if (securityUsers?.length) {
          await supabaseAdmin.from("notifications").insert(
            securityUsers.map((u) => ({
              user_id: u.id,
              title: "Delegate status alert",
              message: `Delegate marked as ${physical_status}.`,
              type: "WARNING",
              link: "/dashboard/security",
            }))
          );
        }
      }

      try {
        await supabaseAdmin.from("audit_logs").insert({
          actor_id: adminUserId,
          action: "UPDATE_DELEGATE_STATUS",
          target_type: "DELEGATE_STATUS",
          target_id: user_id,
          metadata: {
            committee_id: committee_id,
            status: physical_status,
          }
        });
      } catch { /* ignore */ }

      return NextResponse.json({ ok: true, success: true });
    }

    if (action === "get_delegate_status_history") {
      const user_id = body?.user_id as string;
      if (!user_id) {
        return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
      }
      const inCommittee = await assertDelegateInCommittee(user_id, committee_id);
      if (!inCommittee) {
        return NextResponse.json({ error: "Forbidden: delegate not in assigned committee" }, { status: 403 });
      }
      const { data } = await supabaseAdmin
        .from("delegate_presence_history")
        .select("id, status, changed_at, note, changed_by")
        .eq("committee_id", committee_id)
        .eq("user_id", user_id)
        .order("changed_at", { ascending: false });
      return NextResponse.json({ history: data || [] });
    }

    if (action === "correct_attendance") {
      const record_id = body?.record_id as string;
      const status = body?.status as string;
      const reason = body?.reason as string;
      if (!record_id || !status || !reason) {
        return NextResponse.json({ error: "Missing attendance correction fields" }, { status: 400 });
      }
      const { data: record } = await supabaseAdmin
        .from("attendance_records")
        .select("id, committee_id, user_id")
        .eq("id", record_id)
        .maybeSingle();
      if (!record || record.committee_id !== committee_id) {
        return NextResponse.json({ error: "Forbidden: attendance record not in assigned committee" }, { status: 403 });
      }
      await supabaseAdmin
        .from("attendance_records")
        .update({
          status: status,
          corrected_by: adminUserId,
          correction_note: reason,
          corrected_at: new Date().toISOString(),
        })
        .eq("id", record_id);
      try {
        await supabaseAdmin.from("audit_logs").insert({
          actor_id: adminUserId,
          action: "ADMIN_CORRECTED_ATTENDANCE",
          target_type: "ATTENDANCE_RECORD",
          target_id: record_id,
          metadata: {
            committee_id: committee_id,
            status: status,
            reason,
          }
        });
      } catch { /* ignore */ }
      return NextResponse.json({ success: true });
    }

    if (action === "review_document") {
      const document_id = body?.document_id as string;
      const status = body?.status as string;
      const feedback = (body?.feedback as string) || null;
      if (!document_id || !status) {
        return NextResponse.json({ error: "Missing document review fields" }, { status: 400 });
      }
      if (["REVISION_REQUESTED", "REJECTED"].includes(status) && !String(feedback || "").trim()) {
        return NextResponse.json({ error: "Feedback is required for this outcome" }, { status: 400 });
      }
      const { data: doc } = await supabaseAdmin
        .from("documents")
        .select("id, committee_id, user_id")
        .eq("id", document_id)
        .maybeSingle();
      if (!doc || doc.committee_id !== committee_id) {
        return NextResponse.json({ error: "Forbidden: document not in assigned committee" }, { status: 403 });
      }
      await supabaseAdmin
        .from("documents")
        .update({
          status: status,
          feedback,
          reviewed_by_id: adminUserId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", document_id);

      void runOnDocumentStatusChanged(document_id, doc.user_id, status, feedback, adminUserId);
      
      try {
        await supabaseAdmin.from("audit_logs").insert({
          actor_id: adminUserId,
          action: "REVIEW_DOCUMENT",
          target_type: "DOCUMENT",
          target_id: document_id,
          metadata: {
            committee_id: committee_id,
            status: status,
            feedback: feedback,
          }
        });
      } catch { /* ignore */ }

      return NextResponse.json({ success: true });
    }

    if (action === "assign_document_to_chair") {
      const document_id = body?.document_id as string;
      const note = (body?.note as string) || null;
      if (!document_id) {
        return NextResponse.json({ error: "Missing document_id" }, { status: 400 });
      }
      const { data: doc } = await supabaseAdmin
        .from("documents")
        .select("id, committee_id")
        .eq("id", document_id)
        .maybeSingle();
      if (!doc || doc.committee_id !== committee_id) {
        return NextResponse.json({ error: "Forbidden: document not in assigned committee" }, { status: 403 });
      }
      await supabaseAdmin.from("committee_admin_tasks").insert({
        committee_id: committee_id,
        title: `Document Flagged: ${doc.id}`,
        description: note,
        created_by: adminUserId,
        assigned_admin_id: adminUserId,
        status: "TODO",
        priority: "MEDIUM",
      });
      return NextResponse.json({ success: true });
    }

    if (action === "create_announcement") {
      const title = (body?.title as string) || "";
      const messageBody = (body?.body as string) || "";
      if (!title.trim() || !messageBody.trim()) {
        return NextResponse.json({ error: "Title and body are required" }, { status: 400 });
      }

      const { data: created } = await supabaseAdmin
        .from("announcements")
        .insert({
          committee_id: committee_id,
          title: title.trim(),
          body: messageBody.trim(),
          author_id: adminUserId,
          is_pinned: false,
          target_roles: [],
          is_active: true,
        })
        .select("*")
        .single();

      const { data: delegateRows } = await supabaseAdmin
        .from("committee_assignments")
        .select("user_id, users(role, status)")
        .eq("committee_id", committee_id);
      const recipients = (delegateRows || [])
        .filter((r: any) => r?.users?.role === "DELEGATE" && r?.users?.status === "APPROVED")
        .map((r: any) => r.user_id);
      if (recipients.length) {
        await supabaseAdmin.from("notifications").insert(
          recipients.map((uid: string) => ({
            user_id: uid,
            title: title.trim(),
            message: messageBody.trim(),
            type: "INFO",
            link: "/messages",
          })),
        );
      }

      try {
        await supabaseAdmin.from("audit_logs").insert({
          actor_id: adminUserId,
          action: "CREATE_ANNOUNCEMENT",
          target_type: "ANNOUNCEMENT",
          target_id: created?.id,
          metadata: {
            committee_id: committee_id,
            title: title.trim(),
          }
        });
      } catch { /* ignore */ }

      return NextResponse.json({ success: true, announcement: created });
    }

    if (action === "create_resource") {
      const title = (body?.title as string) || "";
      const description = (body?.description as string) || "";
      const file_url = (body?.file_url as string) || "";
      if (!title.trim() || !file_url.trim()) {
        return NextResponse.json({ error: "Title and file URL are required" }, { status: 400 });
      }
      await supabaseAdmin.from("committee_resources").insert({
        committee_id: committee_id,
        title: title.trim(),
        description: description.trim() || null,
        file_url: file_url.trim(),
        uploaded_by: adminUserId,
      });
      try {
        await supabaseAdmin.from("audit_logs").insert({
          actor_id: adminUserId,
          action: "CREATE_RESOURCE",
          target_type: "COMMITTEE_RESOURCE",
          metadata: {
            committee_id: committee_id,
            title: title.trim(),
          }
        });
      } catch { /* ignore */ }
      return NextResponse.json({ success: true });
    }

    if (action === "archive_resource") {
      const resource_id = body?.resource_id as string;
      const archived = !!body?.archived;
      if (!resource_id) {
        return NextResponse.json({ error: "Missing resource_id" }, { status: 400 });
      }
      const { data: resource } = await supabaseAdmin
        .from("committee_resources")
        .select("id, committee_id")
        .eq("id", resource_id)
        .maybeSingle();
      if (!resource || resource.committee_id !== committee_id) {
        return NextResponse.json({ error: "Forbidden: resource not in assigned committee" }, { status: 403 });
      } 
      await supabaseAdmin.from("committee_resources").update({ archived, updated_at: new Date().toISOString() }).eq("id", resource_id);
      return NextResponse.json({ success: true });
    }

    if (action === "save_shared_note" || action === "update_shared_note") {
      const note_text = (body?.note_text as string) || (body?.note as string) || "";
      const { data: chairRows } = await supabaseAdmin
        .from("committee_assignments")
        .select("user_id, users(role)")
        .eq("committee_id", committee_id);
      const chairUserId = (chairRows || []).find((r: any) => r?.users?.role === "CHAIR")?.user_id ?? null;
      await supabaseAdmin.from("admin_chair_notes").upsert({
        committee_id: committee_id,
        admin_user_id: adminUserId,
        chair_user_id: chairUserId,
        note_text: note_text,
        updated_at: new Date().toISOString(),
      });
      try {
        await supabaseAdmin.from("audit_logs").insert({
          actor_id: adminUserId,
          action: "UPDATE_SHARED_NOTE",
          target_type: "COMMITTEE",
          target_id: committee_id,
          metadata: {
            committee_id: committee_id,
            note_preview: note_text.substring(0, 50),
          }
        });
      } catch { /* ignore */ }
      return NextResponse.json({ success: true });
    }

    if (action === "save_vote_record") {
      const motion_type = (body?.motion_type as string) || "";
      const outcome = (body?.outcome as string) || "";
      const votes_for = Number(body?.votes_for || 0);
      const votes_against = Number(body?.votes_against || 0);
      const abstentions = Number(body?.abstentions || 0);
      const recorded_votes = Array.isArray(body?.recorded_votes) ? body.recorded_votes : [];
      if (!motion_type || !outcome) {
        return NextResponse.json({ error: "Missing vote fields" }, { status: 400 });
      }
      await supabaseAdmin.from("committee_vote_records").insert({
        committee_id: committee_id,
        motion_type: motion_type,
        outcome,
        votes_for: votes_for,
        votes_against: votes_against,
        abstentions,
        recorded_votes: recorded_votes,
        recorded_by: adminUserId,
      });
      try {
        await supabaseAdmin.from("audit_logs").insert({
          actor_id: adminUserId,
          action: "SAVE_VOTE_RECORD",
          target_type: "VOTE_RECORD",
          metadata: {
            committee_id: committee_id,
            motion_type,
            outcome,
            result: `${votes_for}/${votes_against}/${abstentions}`
          }
        });
      } catch { /* ignore */ }
      return NextResponse.json({ success: true });
    }

    if (action === "quick_message_committee") {
      const title = (body?.title as string) || "";
      const message = (body?.message as string) || "";
      if (!title.trim() || !message.trim()) {
        return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
      }
      const { data: delegateRows } = await supabaseAdmin
        .from("committee_assignments")
        .select("user_id, users(role, status)")
        .eq("committee_id", committee_id);
      const recipients = (delegateRows || [])
        .filter((r: any) => r?.users?.status === "APPROVED")
        .map((r: any) => r.user_id);
      if (recipients.length === 0) {
        return NextResponse.json({ error: "No approved users in this committee" }, { status: 400 });
      }
      await supabaseAdmin.from("notifications").insert(
        recipients.map((uid: string) => ({
          user_id: uid,
          title: title.trim(),
          message: message.trim(),
          type: "INFO" as const,
          link: "/dashboard",
        }))
      );
      try {
        await supabaseAdmin.from("audit_logs").insert({
          actor_id: adminUserId,
          action: "QUICK_MESSAGE_COMMITTEE",
          target_type: "COMMITTEE",
          target_id: committee_id,
          metadata: { title: title.trim(), recipient_count: recipients.length },
        });
      } catch { /* ignore */ }
      return NextResponse.json({ success: true, sentCount: recipients.length });
    }

    if (action === "update_admin_task_status") {
      const task_id = body?.task_id as string;
      const status = body?.status as string;
      if (!task_id || !status) {
        return NextResponse.json({ error: "Missing task fields" }, { status: 400 });
      }
      const { data: task } = await supabaseAdmin
        .from("committee_admin_tasks")
        .select("id, committee_id")
        .eq("id", task_id)
        .maybeSingle();
      if (!task || task.committee_id !== committee_id) {
        return NextResponse.json({ error: "Forbidden: task not in assigned committee" }, { status: 403 });
      }
      await supabaseAdmin
        .from("committee_admin_tasks")
        .update({ status: status, updated_at: new Date().toISOString(), assigned_admin_id: adminUserId })
        .eq("id", task_id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
