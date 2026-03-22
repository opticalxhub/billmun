import { NextResponse } from "next/server";
import { getRequestUserContext } from "@/lib/auth-context";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const { context, error, status } = await getRequestUserContext();
  if (!context) return NextResponse.json({ error }, { status: status || 500 });

  const { data: memberships, error: membershipError } = await supabaseAdmin
    .from("channel_members")
    .select("channel_id, last_read_at")
    .eq("user_id", context.userId);
  if (membershipError) return NextResponse.json({ error: membershipError.message }, { status: 500 });

  const channels = memberships || [];
  const channelIds = channels.map((row: any) => row.channel_id);
  if (!channelIds.length) return NextResponse.json({ channels: [], direct_messages: [] });

  const { data: channelRows, error: channelError } = await supabaseAdmin
    .from("channels")
    .select("id, name, type, is_read_only, committee_id, bloc_id, created_at")
    .in("id", channelIds);
  if (channelError) return NextResponse.json({ error: channelError.message }, { status: 500 });

  const { data: latestMessages, error: latestError } = await supabaseAdmin
    .from("messages")
    .select("id, channel_id, content, created_at, sender_id")
    .in("channel_id", channelIds)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);
  if (latestError) return NextResponse.json({ error: latestError.message }, { status: 500 });

  const groupedLatest = new Map<string, any>();
  for (const message of latestMessages || []) {
    if (!groupedLatest.has(message.channel_id)) groupedLatest.set(message.channel_id, message);
  }

  const unreadCountByChannel: Record<string, number> = {};
  for (const row of channels as any[]) {
    const lastRead = row.last_read_at ? new Date(row.last_read_at) : new Date(0);
    const count = (latestMessages || []).filter(
      (m: any) => m.channel_id === row.channel_id && new Date(m.created_at).getTime() > lastRead.getTime(),
    ).length;
    unreadCountByChannel[row.channel_id] = count;
  }

  const normalized = (channels as any[]).map((row) => ({
    ...(channelRows || []).find((ch: any) => ch.id === row.channel_id),
    channel_id: row.channel_id,
    last_read_at: row.last_read_at,
    latest_message: groupedLatest.get(row.channel_id) || null,
    unread_count: unreadCountByChannel[row.channel_id] || 0,
  })).filter((row: any) => row.id);

  const dmChannels = normalized.filter((c: any) => c.type === "DM");
  if (dmChannels.length) {
    const dmIds = dmChannels.map((c: any) => c.id);
    const { data: dmMembers } = await supabaseAdmin
      .from("channel_members")
      .select("channel_id, user_id, users:user_id(full_name)")
      .in("channel_id", dmIds);
    for (const channel of dmChannels as any[]) {
      const other = (dmMembers || []).find((m: any) => m.channel_id === channel.id && m.user_id !== context.userId);
      const otherUser = Array.isArray(other?.users) ? other.users[0] : other?.users;
      channel.display_name = otherUser?.full_name || "Direct Message";
    }
  }

  const sectioned = {
    channels: normalized.filter((c: any) => c.type !== "DM"),
    direct_messages: normalized.filter((c: any) => c.type === "DM"),
  };

  return NextResponse.json(sectioned);
}
