import { NextRequest, NextResponse } from "next/server";
import { getRequestUserContext } from "@/lib/auth-context";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
  const { context, error, status } = await getRequestUserContext();
  if (!context) return NextResponse.json({ error }, { status: status || 500 });

  const body = await req.json();
  const channelId = body?.channel_id as string;
  if (!channelId) return NextResponse.json({ error: "Missing channel_id" }, { status: 400 });

  await supabaseAdmin
    .from("channel_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("channel_id", channelId)
    .eq("user_id", context.userId);

  return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[messages/read]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
