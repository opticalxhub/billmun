import { NextRequest, NextResponse } from "next/server";
import { getRequestUserContext } from "@/lib/auth-context";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const { context, error, status } = await getRequestUserContext();
  if (!context) return NextResponse.json({ error }, { status: status || 500 });

  const channel_id = req.nextUrl.searchParams.get("channel_id");
  if (!channel_id) return NextResponse.json({ error: "Missing channel_id" }, { status: 400 });

  const { data: membership } = await supabaseAdmin
    .from("channel_members")
    .select("id")
    .eq("channel_id", channel_id)
    .eq("user_id", context.userId)
    .maybeSingle();
  if (!membership?.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const before = req.nextUrl.searchParams.get("before");
  const limitParam = parseInt(req.nextUrl.searchParams.get("limit") || "50");
  const limit = Math.min(limitParam, 50);

  let query = supabaseAdmin
    .from("messages")
    .select("id, channel_id, sender_id, content, type, created_at, reply_to_id, is_pinned")
    .eq("channel_id", channel_id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data: messages } = await query;
  const sortedMessages = (messages || []).reverse();

  const ids = sortedMessages.map((m: any) => m.id);
  const [reactionsRes, attachmentsRes] = await Promise.all([
    ids.length
      ? supabaseAdmin.from("message_reactions").select("id, message_id, user_id, emoji").in("message_id", ids)
      : Promise.resolve({ data: [] as any[] }),
    ids.length
      ? supabaseAdmin.from("message_attachments").select("id, message_id, file_url, file_name, file_size, mime_type").in("message_id", ids)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  await supabaseAdmin
    .from("channel_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("channel_id", channel_id)
    .eq("user_id", context.userId);

  return NextResponse.json({
    messages: sortedMessages,
    reactions: reactionsRes.data || [],
    attachments: attachmentsRes.data || [],
  });
}
