import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getRequestUserContext } from "@/lib/auth-context";

async function ensureChannel(name: string, type: string, committeeId?: string | null, isReadOnly = false) {
  const { data: existing } = await supabaseAdmin
    .from("channels")
    .select("id")
    .eq("name", name)
    .eq("type", type)
    .maybeSingle();
  if (existing?.id) return existing.id;
  const { data, error } = await supabaseAdmin
    .from("channels")
    .insert({ name, type, committee_id: committeeId || null, is_read_only: isReadOnly })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

async function upsertMembers(channel_id: string, userIds: string[]) {
  if (!userIds.length) return;
  const payload = userIds.map((user_id) => ({ channel_id, user_id }));
  await supabaseAdmin.from("channel_members").upsert(payload, { onConflict: "channel_id,user_id" });
}

export async function POST() {
  try {
  const { context, error: authErr, status: authStatus } = await getRequestUserContext();
  if (!context) return NextResponse.json({ error: authErr }, { status: authStatus || 500 });
  if (!["EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"].includes(context.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: committees } = await supabaseAdmin
    .from("committees")
    .select("id, name, abbreviation, chair_id")
    .eq("is_active", true);

  const { data: users } = await supabaseAdmin
    .from("users")
    .select("id, role, status")
    .eq("status", "APPROVED");

  const approvedUsers = users || [];
  const ebIds = approvedUsers.filter((u) => ["EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"].includes(u.role)).map((u) => u.id);

  for (const committee of committees || []) {
    const chanName = committee.abbreviation || committee.name;
    const channelId = await ensureChannel(chanName, "COMMITTEE", committee.id, false);
    const { data: assignments } = await supabaseAdmin
      .from("committee_assignments")
      .select("user_id")
      .eq("committee_id", committee.id);
    const memberIds = new Set<string>([
      ...(assignments || []).map((a) => a.user_id),
      ...(committee.chair_id ? [committee.chair_id] : []),
      ...ebIds,
    ]);
    await upsertMembers(channelId, Array.from(memberIds));
  }

  const departmentChannels: Array<{ name: string; role: string; readOnly?: boolean }> = [
    { name: "Chairs", role: "CHAIR" },
    { name: "Co-Chairs", role: "CO_CHAIR" },
  ];
  for (const ch of departmentChannels) {
    const channelId = await ensureChannel(ch.name, "DEPARTMENT", null, false);
    const ids = approvedUsers.filter((u) => u.role === ch.role || ebIds.includes(u.id)).map((u) => u.id);
    await upsertMembers(channelId, ids);
  }

  const ebChannelId = await ensureChannel("Executive Board", "DEPARTMENT", null, false);
  await upsertMembers(ebChannelId, ebIds);

  const allChannelId = await ensureChannel("All Conference", "BROADCAST", null, true);
  await upsertMembers(allChannelId, approvedUsers.map((u) => u.id));

  return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[setup/channels]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
