import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const { context, error, status } = await getAdminContext();
  if (!context) {
    return NextResponse.json({ error }, { status: status || 500 });
  }

  const { adminUserId, committee_id, committeeName } = context;

  if (!committee_id) {
    return NextResponse.json({
      admin: { id: adminUserId, name: null },
      committee: { id: null, name: null },
      error: "No committee assignment found. Please contact the Executive Board to be assigned to a committee.",
      noAssignment: true
    });
  }

  const [{ data: chairAssignments }, { data: sessionRow }, { data: delegates }, { data: statuses }, { data: documentsQueue }, { data: reviewedDocs }, { data: announcements }, { data: resources }, { data: attendance }, { data: voteRecords }, { data: chairNotes }, { data: committeeChannel }, { data: adminTasks }] =
    await Promise.all([
      supabaseAdmin
        .from("committee_assignments")
        .select("user_id, users(id, full_name, role)")
        .eq("committee_id", committee_id),
      supabaseAdmin
        .from("committee_sessions")
        .select("*")
        .eq("committee_id", committee_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin
        .from("committee_assignments")
        .select("user_id, country, users(id, full_name, email, phone_number, role, status)")
        .eq("committee_id", committee_id),
      supabaseAdmin
        .from("delegate_presence_statuses")
        .select("*")
        .eq("committee_id", committee_id),
      supabaseAdmin
        .from("documents")
        .select("id, user_id, title, type, status, uploaded_at, users(full_name)")
        .eq("committee_id", committee_id)
        .in("status", ["PENDING", "NEEDS_REVISION"])
        .order("uploaded_at", { ascending: true })
        .limit(50),
      supabaseAdmin
        .from("documents")
        .select("id, user_id, title, type, status, uploaded_at, reviewed_at, users(full_name)")
        .eq("committee_id", committee_id)
        .in("status", ["APPROVED", "REJECTED"])
        .order("reviewed_at", { ascending: false })
        .limit(50),
      supabaseAdmin
        .from("announcements")
        .select("*")
        .eq("committee_id", committee_id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabaseAdmin
        .from("committee_resources")
        .select("*")
        .eq("committee_id", committee_id)
        .order("updated_at", { ascending: false })
        .limit(50),
      supabaseAdmin
        .from("attendance_records")
        .select("*")
        .eq("committee_id", committee_id)
        .order("session_start", { ascending: false })
        .limit(50),
      supabaseAdmin
        .from("committee_vote_records")
        .select("*")
        .eq("committee_id", committee_id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabaseAdmin
        .from("admin_chair_notes")
        .select("*")
        .eq("committee_id", committee_id)
        .maybeSingle(),
      supabaseAdmin
        .from("channels")
        .select("id")
        .eq("type", "COMMITTEE")
        .eq("committee_id", committee_id)
        .maybeSingle(),
      supabaseAdmin
        .from("committee_admin_tasks")
        .select("*, creator:created_by(full_name), admin:assigned_admin_id(full_name)")
        .eq("committee_id", committee_id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  const chairUserRaw = (chairAssignments || []).find(
    (r: any) => ["CHAIR", "CO_CHAIR", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"].includes(r?.users?.role),
  )?.users;
  const chairUser = Array.isArray(chairUserRaw) ? chairUserRaw[0] : chairUserRaw;

  const delegateRows = (delegates || [])
    .filter((d: any) => d?.users?.role === "DELEGATE" && d?.users?.status === "APPROVED")
    .map((d: any) => {
      const statusRow = (statuses || []).find((s: any) => s.user_id === d.user_id);
      return {
        user_id: d.user_id,
        full_name: d.users?.full_name || "Unknown",
        email: d.users?.email || null,
        phone_number: d.users?.phone_number || null,
        country: d.country || null,
        physical_status: statusRow?.current_status || "Present In Session",
        status_changed_at: statusRow?.last_changed_at || null,
        status_changed_by: statusRow?.last_changed_by || null,
      };
    });

  const now = Date.now();
  const alerts = delegateRows.filter((d: any) => {
    const isFlagged = d.physical_status === "Lavatory Break" || d.physical_status === "Missing";
    if (!isFlagged || !d.status_changed_at) return false;
    return now - new Date(d.status_changed_at).getTime() > 15 * 60 * 1000;
  });

  const statusSummary = delegateRows.reduce((acc: Record<string, number>, row: any) => {
    acc[row.physical_status] = (acc[row.physical_status] || 0) + 1;
    return acc;
  }, {});

  const presentCount = delegateRows.filter((d: any) =>
    d.physical_status === "Present In Session" || d.physical_status === "Present Unmoderated Caucus",
  ).length;

  let unreadCommitteeMessages = 0;
  if (committeeChannel?.id) {
    const { data: memberRow } = await supabaseAdmin
      .from("channel_members")
      .select("last_read_at")
      .eq("channel_id", committeeChannel.id)
      .eq("user_id", adminUserId)
      .maybeSingle();
    const lastReadAt = memberRow?.last_read_at || new Date(0).toISOString();
    const { count } = await supabaseAdmin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("channel_id", committeeChannel.id)
      .gt("created_at", lastReadAt)
      .is("deleted_at", null);
    unreadCommitteeMessages = count || 0;
  }

  return NextResponse.json({
    committee: {
      id: committee_id,
      name: committeeName,
    },
    chair: chairUser
      ? {
          id: chairUser.id,
          full_name: chairUser.full_name,
        }
      : null,
    communication: {
      committee_channel_id: committeeChannel?.id ?? null,
      admin_user_id: adminUserId,
      chair_user_id: chairUser?.id ?? null,
      shared_note: chairNotes?.note_text ?? "",
      shared_note_updated_at: chairNotes?.updated_at ?? null,
    },
    overview: {
      session_status: sessionRow?.status || "Adjourned",
      current_topic: sessionRow?.current_topic || null,
      present_count: presentCount,
      total_delegates: delegateRows.length,
      pending_document_reviews: (documentsQueue || []).length,
      delegate_status_alerts: alerts.length,
      unread_committee_messages: unreadCommitteeMessages,
    },
    delegates: delegateRows,
    status_summary: statusSummary,
    alerts,
    attendance: attendance || [],
    documents_queue: documentsQueue || [],
    reviewed_documents: reviewedDocs || [],
    announcements: announcements || [],
    resources: resources || [],
    votes: voteRecords || [],
    admin_tasks: adminTasks || [],
  });
}
