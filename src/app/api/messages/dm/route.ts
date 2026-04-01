import { NextRequest, NextResponse } from "next/server";
import { getRequestUserContext } from "@/lib/auth-context";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  try {
    const { context, error, status } = await getRequestUserContext();
    if (!context) return NextResponse.json({ error }, { status: status || 500 });

    const q = (req.nextUrl.searchParams.get("q") || "").trim();
    if (!q) return NextResponse.json({ users: [] });

    // Escape LIKE wildcard characters to prevent pattern injection
    const safeQ = q.replace(/[%_\\]/g, (ch) => `\\${ch}`);

    const { data } = await supabaseAdmin
      .from("users")
      .select("id, full_name, role")
      .eq("status", "APPROVED")
      .neq("id", context.userId)
      .ilike("full_name", `%${safeQ}%`)
      .limit(15);
    return NextResponse.json({ users: data || [] });
  } catch (err: any) {
    console.error('[messages/dm GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
  const { context, error, status } = await getRequestUserContext();
  if (!context) return NextResponse.json({ error }, { status: status || 500 });

  const body = await req.json();
  const otherUserId = body?.other_user_id as string;
  if (!otherUserId) return NextResponse.json({ error: "Missing other_user_id" }, { status: 400 });

  const { data: myMemberships } = await supabaseAdmin
    .from("channel_members")
    .select("channel_id, channels:channel_id(id, type)")
    .eq("user_id", context.userId);

  const dmChannelIds = (myMemberships || []).filter((row: any) => row.channels?.type === "DM").map((row: any) => row.channel_id);
  if (dmChannelIds.length) {
    const { data: otherMemberships } = await supabaseAdmin
      .from("channel_members")
      .select("channel_id, user_id")
      .in("channel_id", dmChannelIds)
      .eq("user_id", otherUserId);
    if ((otherMemberships || []).length) {
      return NextResponse.json({ channel_id: otherMemberships![0].channel_id });
    }
  }

  const { data: channel, error: channelError } = await supabaseAdmin
    .from("channels")
    .insert({ name: "DM", type: "DM" })
    .select("id")
    .single();
  if (channelError || !channel?.id) return NextResponse.json({ error: channelError?.message || "Failed to create DM" }, { status: 500 });

  await supabaseAdmin.from("channel_members").insert([
    { channel_id: channel.id, user_id: context.userId },
    { channel_id: channel.id, user_id: otherUserId },
  ]);

  return NextResponse.json({ channel_id: channel.id });
  } catch (err: any) {
    console.error('[messages/dm POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
