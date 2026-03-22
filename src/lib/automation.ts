/**
 * Server-side automation hooks for BILLMUN. Each public runner is wrapped in try/catch;
 * failures are logged to audit_logs and never throw to callers.
 */
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendApprovalEmail, sendRejectionEmail } from "@/lib/email";

const EB_ROLES = ["EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"] as const;

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export async function logAutomationFailure(
  action: string,
  error: unknown,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: null,
      action: "AUTOMATION_FAILURE",
      target_type: "SYSTEM",
      target_id: "00000000-0000-0000-0000-000000000001",
      metadata: {
        original_action: action,
        message: errMessage(error),
        ...metadata,
      },
    });
  } catch {
    /* ignore */
  }
}

async function safeRun<T>(action: string, fn: () => Promise<T>): Promise<T | undefined> {
  try {
    return await fn();
  } catch (e) {
    await logAutomationFailure(action, e);
    return undefined;
  }
}

function dashboardLinkForRole(role: string): string {
  if (["EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"].includes(role)) return "/eb/dash";
  if (role === "ADMIN") return "/dashboard/admin";
  if (role === "CHAIR" || role === "CO_CHAIR") return "/dashboard/chair";
  if (role === "SECURITY") return "/dashboard/security";
  if (role === "MEDIA" || role === "PRESS") return "/dashboard/press";
  return "/dashboard/delegate";
}

function departmentChannelNameForRole(role: string): string | null {
  if (role === "CHAIR" || role === "CO_CHAIR") return "Chairs";
  if (role === "ADMIN") return "Admin Team";
  if (role === "MEDIA" || role === "PRESS") return "Media Team";
  if (role === "SECURITY") return "Security Team";
  return null;
}

async function getChannelIdByNameAndType(
  name: string,
  type: string,
): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("channels")
    .select("id")
    .eq("name", name)
    .eq("type", type)
    .maybeSingle();
  return data?.id ?? null;
}

async function getCommitteeChannelId(committeeId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("channels")
    .select("id")
    .eq("type", "COMMITTEE")
    .eq("committee_id", committeeId)
    .maybeSingle();
  return data?.id ?? null;
}

async function ensureDepartmentChannel(name: string): Promise<string | null> {
  const existing = await getChannelIdByNameAndType(name, "DEPARTMENT");
  if (existing) return existing;
  const { data, error } = await supabaseAdmin
    .from("channels")
    .insert({ name, type: "DEPARTMENT", is_read_only: false })
    .select("id")
    .single();
  if (error) return null;
  return data.id as string;
}

async function addChannelMember(channelId: string, userId: string): Promise<void> {
  const now = new Date().toISOString();
  await supabaseAdmin.from("channel_members").upsert(
    {
      channel_id: channelId,
      user_id: userId,
      role: "MEMBER",
      last_read_at: now,
    },
    { onConflict: "channel_id,user_id" },
  );
}

async function removeChannelMember(channelId: string, userId: string): Promise<void> {
  await supabaseAdmin.from("channel_members").delete().eq("channel_id", channelId).eq("user_id", userId);
}

async function allChannelIds(): Promise<string[]> {
  const { data } = await supabaseAdmin.from("channels").select("id");
  return (data || []).map((r) => r.id as string);
}

async function resolveCommitteeIdFromPreferred(preferred: string | null | undefined): Promise<string | null> {
  if (!preferred?.trim()) return null;
  const p = preferred.trim();
  const pUpper = p.toUpperCase();
  const { data: committees } = await supabaseAdmin.from("committees").select("id, name, abbreviation");
  const c = committees?.find((x) => {
    const abbr = (x.abbreviation as string | null | undefined)?.toUpperCase();
    return (
      x.name === p ||
      (abbr && abbr === pUpper) ||
      (abbr && pUpper.includes(abbr)) ||
      p.includes(x.name) ||
      x.name.includes(p)
    );
  });
  return c?.id ?? null;
}

export async function getNextBadgeNumber(): Promise<string> {
  const { data: rows } = await supabaseAdmin
    .from("security_badges")
    .select("badge_number")
    .like("badge_number", "BILLMUN-2026-%");
  let max = 0;
  for (const r of rows || []) {
    const m = /^BILLMUN-2026-(\d+)$/.exec(r.badge_number as string);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  const next = max + 1;
  return `BILLMUN-2026-${String(next).padStart(4, "0")}`;
}

/** After status set to APPROVED */
export async function runOnUserApproved(userId: string, actorId: string): Promise<void> {
  await safeRun("runOnUserApproved", async () => {
    const { data: user } = await supabaseAdmin
      .from("users")
      .select(
        "id, email, full_name, role, preferred_committee, allocated_country, status",
      )
      .eq("id", userId)
      .single();
    if (!user || user.status !== "APPROVED") return;

    const committeeId =
      (await resolveCommitteeIdFromPreferred(user.preferred_committee)) ||
      (
        await supabaseAdmin
          .from("committee_assignments")
          .select("committee_id")
          .eq("user_id", userId)
          .maybeSingle()
      ).data?.committee_id ||
      null;

    if (user.preferred_committee && committeeId) {
      const { data: existing } = await supabaseAdmin
        .from("committee_assignments")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      if (!existing) {
        await supabaseAdmin.from("committee_assignments").insert({
          user_id: userId,
          committee_id: committeeId,
          country: user.allocated_country || "",
          assigned_by_id: actorId,
        });
        await runOnCommitteeAssigned(userId, committeeId, actorId);
      }
    }

    if (user.role === "CHAIR" || user.role === "CO_CHAIR") {
      const cid =
        committeeId ||
        (
          await supabaseAdmin
            .from("committee_assignments")
            .select("committee_id")
            .eq("user_id", userId)
            .maybeSingle()
        ).data?.committee_id;
      if (cid) {
        await supabaseAdmin.from("committees").update({ chair_id: userId }).eq("id", cid);
      }
    }

    const chName = departmentChannelNameForRole(user.role);
    if (chName) {
      const chId = await ensureDepartmentChannel(chName);
      if (chId) await addChannelMember(chId, userId);
    }

    if (user.role === "ADMIN" && committeeId) {
      const cc = await getCommitteeChannelId(committeeId);
      if (cc) await addChannelMember(cc, userId);
    }

    if (EB_ROLES.includes(user.role as (typeof EB_ROLES)[number])) {
      for (const id of await allChannelIds()) {
        await addChannelMember(id, userId);
      }
    }

    const { data: existingBadge } = await supabaseAdmin
      .from("security_badges")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!existingBadge) {
      const badgeNumber = await getNextBadgeNumber();
      await supabaseAdmin.from("security_badges").insert({
        user_id: userId,
        badge_number: badgeNumber,
        badge_status: "ACTIVE",
      });
    }

    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      title: "Account Approved",
      message: "Your BILLMUN registration has been approved.",
      type: "SUCCESS",
      link: dashboardLinkForRole(user.role),
    });

    try {
      await sendApprovalEmail(user.email, user.full_name);
    } catch (e) {
      await logAutomationFailure("sendApprovalEmail", e, { userId });
    }

    const { data: asg } = await supabaseAdmin
      .from("committee_assignments")
      .select("committee_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (asg?.committee_id) {
      await runOnCommitteeAssigned(userId, asg.committee_id as string, actorId);
    }
  });
}

export async function runOnUserRejected(
  userId: string,
  email: string,
  fullName: string,
  reason?: string,
): Promise<void> {
  await safeRun("runOnUserRejected", async () => {
    try {
      await sendRejectionEmail(email, fullName, reason);
    } catch (e) {
      await logAutomationFailure("sendRejectionEmail", e, { userId });
    }
    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      title: "Registration Update",
      message: reason
        ? `Your registration was not approved. ${reason}`
        : "Your registration was not approved.",
      type: "ERROR",
    });
  });
}

export async function runOnUserSuspended(userId: string, reason?: string): Promise<void> {
  await safeRun("runOnUserSuspended", async () => {
    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      title: "Account Suspended",
      message: reason || "Your account has been suspended. Contact support if you believe this is an error.",
      type: "WARNING",
    });
  });
}

export async function runOnRoleChange(
  userId: string,
  oldRole: string,
  newRole: string,
  actorId: string,
): Promise<void> {
  await safeRun("runOnRoleChange", async () => {
    const oldCh = departmentChannelNameForRole(oldRole);
    if (oldCh) {
      const id = await getChannelIdByNameAndType(oldCh, "DEPARTMENT");
      if (id) await removeChannelMember(id, userId);
    }

    if (EB_ROLES.includes(oldRole as (typeof EB_ROLES)[number])) {
      for (const cid of await allChannelIds()) {
        await removeChannelMember(cid, userId);
      }
    }

    if (oldRole === "CHAIR" || oldRole === "CO_CHAIR") {
      await supabaseAdmin.from("committees").update({ chair_id: null }).eq("chair_id", userId);
    }

    const newCh = departmentChannelNameForRole(newRole);
    if (newCh) {
      const id = await ensureDepartmentChannel(newCh);
      if (id) await addChannelMember(id, userId);
    }

    if (EB_ROLES.includes(newRole as (typeof EB_ROLES)[number])) {
      for (const id of await allChannelIds()) {
        await addChannelMember(id, userId);
      }
    }

    if (newRole === "CHAIR" || newRole === "CO_CHAIR") {
      const { data: row } = await supabaseAdmin
        .from("committee_assignments")
        .select("committee_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (row?.committee_id) {
        await supabaseAdmin.from("committees").update({ chair_id: userId }).eq("id", row.committee_id);
      }
    }

    void actorId;
  });
}

export async function runOnCommitteeAssigned(
  userId: string,
  committeeId: string,
  actorId: string,
): Promise<void> {
  await safeRun("runOnCommitteeAssigned", async () => {
    const cc = await getCommitteeChannelId(committeeId);
    if (cc) await addChannelMember(cc, userId);

    const { data: pres } = await supabaseAdmin
      .from("delegate_presence_statuses")
      .select("id")
      .eq("committee_id", committeeId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!pres) {
      await supabaseAdmin.from("delegate_presence_statuses").insert({
        committee_id: committeeId,
        user_id: userId,
        current_status: "Present In Session",
        last_changed_by: actorId,
        last_changed_at: new Date().toISOString(),
      });
    }

    const { data: sess } = await supabaseAdmin
      .from("committee_sessions")
      .select("id")
      .eq("committee_id", committeeId)
      .limit(1)
      .maybeSingle();
    if (!sess) {
      await supabaseAdmin.from("committee_sessions").insert({
        committee_id: committeeId,
        status: "ADJOURNED",
        caucus_type: "NONE",
        updated_by_id: actorId,
      });
    }
  });
}

export async function runOnCommitteeAssignmentRemoved(
  userId: string,
  committeeId: string,
): Promise<void> {
  await safeRun("runOnCommitteeAssignmentRemoved", async () => {
    const cc = await getCommitteeChannelId(committeeId);
    if (cc) await removeChannelMember(cc, userId);
  });
}

export async function runOnDocumentUploaded(
  documentId: string,
  committeeId: string | null,
  ownerUserId: string,
  actorId: string | null,
): Promise<void> {
  await safeRun("runOnDocumentUploaded", async () => {
    await supabaseAdmin.from("document_status_history").insert({
      document_id: documentId,
      status: "PENDING",
      changed_by_id: actorId || ownerUserId,
      note: null,
    });

    if (!committeeId) return;

    const { data: committee } = await supabaseAdmin
      .from("committees")
      .select("chair_id")
      .eq("id", committeeId)
      .maybeSingle();
    const targets = new Set<string>();
    if (committee?.chair_id && committee.chair_id !== ownerUserId) {
      targets.add(committee.chair_id as string);
    }

    const { data: assigns } = await supabaseAdmin
      .from("committee_assignments")
      .select("user_id")
      .eq("committee_id", committeeId);
    const assignUserIds = [...new Set((assigns || []).map((a) => a.user_id as string))];
    if (assignUserIds.length) {
      const { data: adminUsers } = await supabaseAdmin
        .from("users")
        .select("id")
        .in("id", assignUserIds)
        .eq("role", "ADMIN");
      for (const u of adminUsers || []) targets.add(u.id as string);
    }

    const title = "New document submitted";
    const message = "A delegate submitted a document for your committee.";
    for (const uid of targets) {
      await supabaseAdmin.from("notifications").insert({
        user_id: uid,
        title,
        message,
        type: "INFO",
        link: "/dashboard/chair",
      });
    }
  });
}

export async function runOnDocumentStatusChanged(
  documentId: string,
  userId: string,
  newStatus: string,
  feedback: string | null,
  changedById: string,
): Promise<void> {
  await safeRun("runOnDocumentStatusChanged", async () => {
    await supabaseAdmin.from("document_status_history").insert({
      document_id: documentId,
      status: newStatus,
      changed_by_id: changedById,
      note: feedback || null,
    });
    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      title: `Document ${newStatus}`,
      message: feedback
        ? `Your document status is ${newStatus}. Feedback: ${feedback}`
        : `Your document status is ${newStatus}.`,
      type: newStatus === "APPROVED" ? "SUCCESS" : "WARNING",
      link: "/dashboard/delegate",
    });
  });
}

export async function runOnSecurityIncidentHighOrCritical(
  incidentType: string,
  location: string,
  severity: string,
  description: string,
): Promise<void> {
  await safeRun("runOnSecurityIncidentHighOrCritical", async () => {
    const { data: ebRows } = await supabaseAdmin
      .from("users")
      .select("id")
      .in("role", [...EB_ROLES]);
    if (ebRows?.length) {
      await supabaseAdmin.from("notifications").insert(
        ebRows.map((row: { id: string }) => ({
          user_id: row.id,
          title: `Security incident (${severity})`,
          message: `${incidentType} at ${location}: ${description}`,
          type: "WARNING",
        })),
      );
    }

    const secChannelId = await getChannelIdByNameAndType("Security Team", "DEPARTMENT");
    if (secChannelId) {
      const { data: sys } = await supabaseAdmin
        .from("users")
        .select("id")
        .in("role", [...EB_ROLES])
        .limit(1)
        .maybeSingle();
      const sender = sys?.id;
      if (sender) {
        await supabaseAdmin.from("messages").insert({
          channel_id: secChannelId,
          sender_id: sender,
          content: `[${severity}] ${incidentType} @ ${location}\n${description}`,
          type: "TEXT",
          is_announcement: false,
          is_pinned: false,
        });
      }
    }
  });
}

export async function runOnAnnouncementCreated(
  announcementId: string,
  title: string,
  body: string,
  targetRoles: string[] | null,
  committeeId: string | null,
): Promise<void> {
  await safeRun("runOnAnnouncementCreated", async () => {
    let q = supabaseAdmin.from("users").select("id").eq("status", "APPROVED");
    if (targetRoles && targetRoles.length > 0) {
      q = q.in("role", targetRoles);
    }
    if (committeeId) {
      const { data: members } = await supabaseAdmin
        .from("committee_assignments")
        .select("user_id")
        .eq("committee_id", committeeId);
      const ids = [...new Set((members || []).map((m) => m.user_id as string))];
      if (!ids.length) return;
      await supabaseAdmin.from("notifications").insert(
        ids.map((user_id) => ({
          user_id,
          title: `Announcement: ${title}`,
          message: body.slice(0, 500),
          type: "INFO",
          link: "/dashboard/delegate",
        })),
      );
      void announcementId;
      return;
    }
    const { data: users } = await q;
    if (!users?.length) return;
    await supabaseAdmin.from("notifications").insert(
      users.map((u: { id: string }) => ({
        user_id: u.id,
        title: `Announcement: ${title}`,
        message: body.slice(0, 500),
        type: "INFO",
        link: "/dashboard/delegate",
      })),
    );
    void announcementId;
  });
}

export async function runOnCommitteeCreated(committeeId: string, actorId: string): Promise<void> {
  await safeRun("runOnCommitteeCreated", async () => {
    await supabaseAdmin.from("committee_sessions").insert({
      committee_id: committeeId,
      status: "ADJOURNED",
      caucus_type: "NONE",
      updated_by_id: actorId,
    });
    const { data: committee } = await supabaseAdmin
      .from("committees")
      .select("name, abbreviation")
      .eq("id", committeeId)
      .single();
    const name = committee?.abbreviation || committee?.name || "Committee";
    await supabaseAdmin.from("channels").insert({
      name,
      type: "COMMITTEE",
      committee_id: committeeId,
      is_read_only: false,
    });
  });
}

export async function runOnBlocCreated(blocId: string, creatorId: string): Promise<void> {
  await safeRun("runOnBlocCreated", async () => {
    const { data: bloc } = await supabaseAdmin.from("blocs").select("name").eq("id", blocId).single();
    const { data: ch, error } = await supabaseAdmin
      .from("channels")
      .insert({
        name: `Bloc: ${bloc?.name || blocId}`,
        type: "BLOC",
        bloc_id: blocId,
        is_read_only: false,
      })
      .select("id")
      .single();
    if (!error && ch?.id) {
      await addChannelMember(ch.id as string, creatorId);
    }
  });
}

export async function runOnBlocJoin(blocId: string, userId: string): Promise<void> {
  await safeRun("runOnBlocJoin", async () => {
    const { data: channel } = await supabaseAdmin
      .from("channels")
      .select("id")
      .eq("type", "BLOC")
      .eq("bloc_id", blocId)
      .maybeSingle();
    if (channel?.id) await addChannelMember(channel.id as string, userId);
  });
}

export async function runOnBlocLeave(blocId: string, userId: string): Promise<void> {
  await safeRun("runOnBlocLeave", async () => {
    const { data: channel } = await supabaseAdmin
      .from("channels")
      .select("id")
      .eq("type", "BLOC")
      .eq("bloc_id", blocId)
      .maybeSingle();
    if (channel?.id) await removeChannelMember(channel.id as string, userId);
  });
}

export async function runOnBlocDeleted(blocId: string): Promise<void> {
  await safeRun("runOnBlocDeleted", async () => {
    await supabaseAdmin.from("channels").delete().eq("bloc_id", blocId).eq("type", "BLOC");
  });
}

export async function runOnRollCallCompleted(
  rollCallId: string,
  committeeId: string,
  sessionId: string | null,
): Promise<void> {
  await safeRun("runOnRollCallCompleted", async () => {
    const { data: record } = await supabaseAdmin
      .from("roll_call_records")
      .select("id, committee_id, session_id")
      .eq("id", rollCallId)
      .single();
    if (!record) return;

    const { data: entries } = await supabaseAdmin
      .from("roll_call_entries")
      .select("delegate_id, assignment_id, status")
      .eq("roll_call_id", rollCallId);

    const { data: assignments } = await supabaseAdmin
      .from("committee_assignments")
      .select("id, user_id")
      .eq("committee_id", committeeId);

    const presentStatuses = new Set(["PRESENT", "PRESENT_AND_VOTING", "YES"]);
    let present = 0;
    for (const e of entries || []) {
      if (presentStatuses.has(String(e.status).toUpperCase())) present++;
    }
    const total = (assignments || []).length;
    const quorumEstablished = total > 0 ? present >= Math.ceil(total / 2) : false;

    await supabaseAdmin
      .from("roll_call_records")
      .update({ quorum_established: quorumEstablished, completed_at: new Date().toISOString() })
      .eq("id", rollCallId);

    const sessionStart = new Date().toISOString();
    for (const a of assignments || []) {
      const entry = (entries || []).find((en) => en.delegate_id === a.user_id);
      const st = entry?.status ? String(entry.status).toUpperCase() : "ABSENT";
      const mapped =
        st === "PRESENT" || st === "PRESENT_AND_VOTING" || st === "YES"
          ? "PRESENT"
          : st === "ABSENT" || st === "NO"
            ? "ABSENT"
            : "LATE";
      await supabaseAdmin.from("attendance_records").insert({
        committee_id: committeeId,
        user_id: a.user_id,
        session_start: sessionStart,
        session_end: null,
        status: mapped,
      });
    }
    void sessionId;
  });
}

export async function runOnCommitteeSessionAdjourned(committeeId: string): Promise<void> {
  await safeRun("runOnCommitteeSessionAdjourned", async () => {
    await supabaseAdmin
      .from("speakers_list")
      .update({ status: "COMPLETED", completed_at: new Date().toISOString() })
      .eq("committee_id", committeeId)
      .eq("status", "QUEUED");
  });
}
