import { NextRequest, NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

const VALID_PHYSICAL_STATUSES = [
  "Present In Session",
  "Present Unmoderated Caucus",
  "Lavatory Break",
  "Medical Break",
  "Missing",
  "Absent with Reason",
  "Absent without Reason",
];

async function assertDelegateInCommittee(delegateUserId: string, committeeId: string) {
  const { data } = await supabaseAdmin
    .from("committee_assignments")
    .select("user_id")
    .eq("committee_id", committeeId)
    .eq("user_id", delegateUserId)
    .maybeSingle();
  return Boolean(data?.user_id);
}

export async function POST(request: NextRequest) {
  const { context, error, status } = await getAdminContext();
  if (!context) {
    return NextResponse.json({ error }, { status: status || 500 });
  }

  const { adminUserId, committeeId } = context;
  const body = await request.json();
  const action = body?.action;

  try {
    if (action === "update_delegate_status") {
      const delegateUserId = body?.delegateUserId as string;
      const physicalStatus = body?.physicalStatus as string;
      const note = (body?.note as string) || null;

      if (!delegateUserId || !VALID_PHYSICAL_STATUSES.includes(physicalStatus)) {
        return NextResponse.json({ error: "Invalid status payload" }, { status: 400 });
      }

      const inCommittee = await assertDelegateInCommittee(delegateUserId, committeeId);
      if (!inCommittee) {
        return NextResponse.json({ error: "Forbidden: delegate not in assigned committee" }, { status: 403 });
      }

      await supabaseAdmin.from("delegate_presence_statuses").upsert({
        committee_id: committeeId,
        user_id: delegateUserId,
        current_status: physicalStatus,
        last_changed_by: adminUserId,
        last_changed_at: new Date().toISOString(),
        note,
      });

      await supabaseAdmin.from("delegate_presence_history").insert({
        committee_id: committeeId,
        user_id: delegateUserId,
        status: physicalStatus,
        changed_by: adminUserId,
        note,
      });

      await supabaseAdmin.from("audit_logs").insert({
        actor_id: adminUserId,
        action: "ADMIN_UPDATED_DELEGATE_PHYSICAL_STATUS",
        target_type: "USER",
        target_id: delegateUserId,
        metadata: {
          committee_id: committeeId,
          physical_status: physicalStatus,
          note,
        },
      });

      if (physicalStatus === "Lavatory Break" || physicalStatus === "Missing") {
        const { data: chairRows } = await supabaseAdmin
          .from("committee_assignments")
          .select("user_id, users(role)")
          .eq("committee_id", committeeId);
        const { data: ebRows } = await supabaseAdmin
          .from("users")
          .select("id")
          .in("role", ["EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"]);

        const chairRecipients = (chairRows || [])
          .filter((r: any) => r?.users?.role === "CHAIR")
          .map((r: any) => r.user_id);
        const ebRecipients = (ebRows || []).map((r: any) => r.id);
        const recipients = [...new Set([...chairRecipients, ...ebRecipients])];

        if (recipients.length) {
          await supabaseAdmin.from("notifications").insert(
            recipients.map((uid: string) => ({
              user_id: uid,
              title: "Delegate status alert",
              message: `Delegate marked as ${physicalStatus}.`,
              type: "WARNING",
              link: "/dashboard/admin",
            })),
          );
        }
      }

      return NextResponse.json({ success: true });
    }

    if (action === "get_delegate_status_history") {
      const delegateUserId = body?.delegateUserId as string;
      if (!delegateUserId) {
        return NextResponse.json({ error: "Missing delegateUserId" }, { status: 400 });
      }
      const inCommittee = await assertDelegateInCommittee(delegateUserId, committeeId);
      if (!inCommittee) {
        return NextResponse.json({ error: "Forbidden: delegate not in assigned committee" }, { status: 403 });
      }
      const { data } = await supabaseAdmin
        .from("delegate_presence_history")
        .select("id, status, changed_at, note, changed_by")
        .eq("committee_id", committeeId)
        .eq("user_id", delegateUserId)
        .order("changed_at", { ascending: false });
      return NextResponse.json({ history: data || [] });
    }

    if (action === "correct_attendance") {
      const recordId = body?.recordId as string;
      const newStatus = body?.status as string;
      const reason = body?.reason as string;
      if (!recordId || !newStatus || !reason) {
        return NextResponse.json({ error: "Missing attendance correction fields" }, { status: 400 });
      }
      const { data: record } = await supabaseAdmin
        .from("attendance_records")
        .select("id, committee_id, user_id")
        .eq("id", recordId)
        .maybeSingle();
      if (!record || record.committee_id !== committeeId) {
        return NextResponse.json({ error: "Forbidden: attendance record not in assigned committee" }, { status: 403 });
      }
      await supabaseAdmin
        .from("attendance_records")
        .update({
          status: newStatus,
          corrected_by: adminUserId,
          correction_note: reason,
          corrected_at: new Date().toISOString(),
        })
        .eq("id", recordId);
      await supabaseAdmin.from("audit_logs").insert({
        actor_id: adminUserId,
        action: "ADMIN_CORRECTED_ATTENDANCE",
        target_type: "ATTENDANCE_RECORD",
        target_id: recordId,
        metadata: {
          committee_id: committeeId,
          status: newStatus,
          reason,
        },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "review_document") {
      const documentId = body?.documentId as string;
      const statusValue = body?.status as string;
      const feedback = (body?.feedback as string) || null;
      if (!documentId || !statusValue) {
        return NextResponse.json({ error: "Missing document review fields" }, { status: 400 });
      }
      const { data: doc } = await supabaseAdmin
        .from("documents")
        .select("id, committee_id, user_id")
        .eq("id", documentId)
        .maybeSingle();
      if (!doc || doc.committee_id !== committeeId) {
        return NextResponse.json({ error: "Forbidden: document not in assigned committee" }, { status: 403 });
      }
      await supabaseAdmin
        .from("documents")
        .update({
          status: statusValue,
          feedback,
          reviewed_by_id: adminUserId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", documentId);

      await supabaseAdmin.from("notifications").insert({
        user_id: doc.user_id,
        title: "Document status updated",
        message: `Your document review status is now ${statusValue}.`,
        type: statusValue === "APPROVED" ? "SUCCESS" : "INFO",
        link: "/documents",
      });
      return NextResponse.json({ success: true });
    }

    if (action === "assign_document_to_chair") {
      const documentId = body?.documentId as string;
      const note = (body?.note as string) || null;
      if (!documentId) {
        return NextResponse.json({ error: "Missing documentId" }, { status: 400 });
      }
      const { data: doc } = await supabaseAdmin
        .from("documents")
        .select("id, committee_id")
        .eq("id", documentId)
        .maybeSingle();
      if (!doc || doc.committee_id !== committeeId) {
        return NextResponse.json({ error: "Forbidden: document not in assigned committee" }, { status: 403 });
      }
      await supabaseAdmin.from("document_chair_flags").insert({
        document_id: documentId,
        committee_id: committeeId,
        flagged_by: adminUserId,
        note,
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
        .from("committee_announcements")
        .insert({
          committee_id: committeeId,
          title: title.trim(),
          body: messageBody.trim(),
          sent_by: adminUserId,
        })
        .select("*")
        .single();

      const { data: delegateRows } = await supabaseAdmin
        .from("committee_assignments")
        .select("user_id, users(role, status)")
        .eq("committee_id", committeeId);
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

      return NextResponse.json({ success: true, announcement: created });
    }

    if (action === "create_resource") {
      const title = (body?.title as string) || "";
      const description = (body?.description as string) || "";
      const fileUrl = (body?.fileUrl as string) || "";
      if (!title.trim() || !fileUrl.trim()) {
        return NextResponse.json({ error: "Title and file URL are required" }, { status: 400 });
      }
      await supabaseAdmin.from("committee_resources").insert({
        committee_id: committeeId,
        title: title.trim(),
        description: description.trim() || null,
        file_url: fileUrl.trim(),
        uploaded_by: adminUserId,
      });
      return NextResponse.json({ success: true });
    }

    if (action === "archive_resource") {
      const resourceId = body?.resourceId as string;
      const archived = Boolean(body?.archived);
      if (!resourceId) {
        return NextResponse.json({ error: "Missing resourceId" }, { status: 400 });
      }
      const { data: resource } = await supabaseAdmin
        .from("committee_resources")
        .select("id, committee_id")
        .eq("id", resourceId)
        .maybeSingle();
      if (!resource || resource.committee_id !== committeeId) {
        return NextResponse.json({ error: "Forbidden: resource not in assigned committee" }, { status: 403 });
      }
      await supabaseAdmin.from("committee_resources").update({ archived, updated_at: new Date().toISOString() }).eq("id", resourceId);
      return NextResponse.json({ success: true });
    }

    if (action === "save_shared_note") {
      const noteText = (body?.noteText as string) || "";
      const { data: chairRows } = await supabaseAdmin
        .from("committee_assignments")
        .select("user_id, users(role)")
        .eq("committee_id", committeeId);
      const chairUserId = (chairRows || []).find((r: any) => r?.users?.role === "CHAIR")?.user_id ?? null;
      await supabaseAdmin.from("admin_chair_notes").upsert({
        committee_id: committeeId,
        admin_user_id: adminUserId,
        chair_user_id: chairUserId,
        note_text: noteText,
        updated_at: new Date().toISOString(),
      });
      return NextResponse.json({ success: true });
    }

    if (action === "save_vote_record") {
      const motionType = (body?.motionType as string) || "";
      const outcome = (body?.outcome as string) || "";
      const votesFor = Number(body?.votesFor || 0);
      const votesAgainst = Number(body?.votesAgainst || 0);
      const abstentions = Number(body?.abstentions || 0);
      const recordedVotes = Array.isArray(body?.recordedVotes) ? body.recordedVotes : [];
      if (!motionType || !outcome) {
        return NextResponse.json({ error: "Missing vote fields" }, { status: 400 });
      }
      await supabaseAdmin.from("committee_vote_records").insert({
        committee_id: committeeId,
        motion_type: motionType,
        outcome,
        votes_for: votesFor,
        votes_against: votesAgainst,
        abstentions,
        recorded_votes: recordedVotes,
        recorded_by: adminUserId,
      });
      return NextResponse.json({ success: true });
    }

    if (action === "update_admin_task_status") {
      const taskId = body?.taskId as string;
      const statusValue = body?.status as string;
      if (!taskId || !statusValue) {
        return NextResponse.json({ error: "Missing task fields" }, { status: 400 });
      }
      const { data: task } = await supabaseAdmin
        .from("committee_admin_tasks")
        .select("id, committee_id")
        .eq("id", taskId)
        .maybeSingle();
      if (!task || task.committee_id !== committeeId) {
        return NextResponse.json({ error: "Forbidden: task not in assigned committee" }, { status: 403 });
      }
      await supabaseAdmin
        .from("committee_admin_tasks")
        .update({ status: statusValue, updated_at: new Date().toISOString(), assigned_admin_id: adminUserId })
        .eq("id", taskId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
