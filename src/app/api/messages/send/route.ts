import { NextRequest, NextResponse } from "next/server";
import { getRequestUserContext } from "@/lib/auth-context";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
  const { context, error, status } = await getRequestUserContext();
  if (!context) return NextResponse.json({ error }, { status: status || 500 });

  const body = await req.json();
  const channelId = body?.channel_id as string;
  const content = (body?.content as string) || "";
  const type = (body?.type as string) || "TEXT";
  const replyToId = (body?.reply_to_id as string) || null;
  const attachments = Array.isArray(body?.attachments) ? body.attachments : [];

  if (!channelId || !content.trim()) {
    return NextResponse.json({ error: "Missing channel_id or content" }, { status: 400 });
  }

  const { data: membership } = await supabaseAdmin
    .from("channel_members")
    .select("id")
    .eq("channel_id", channelId)
    .eq("user_id", context.userId)
    .maybeSingle();
  if (!membership?.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: channel } = await supabaseAdmin
    .from("channels")
    .select("id, is_read_only, type")
    .eq("id", channelId)
    .maybeSingle();
  if (!channel?.id) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

  if (
    channel.is_read_only &&
    !["EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"].includes(context.role)
  ) {
    return NextResponse.json({ error: "Read only channel" }, { status: 403 });
  }

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("messages")
    .insert({
      channel_id: channelId,
      sender_id: context.userId,
      content: content.trim(),
      type,
      reply_to_id: replyToId,
      created_at: new Date().toISOString(),
    })
    .select("id, channel_id, sender_id, content, type, created_at, reply_to_id")
    .single();
  if (insertError || !inserted?.id) {
    return NextResponse.json({ error: insertError?.message || "Failed to send" }, { status: 500 });
  }

  if (attachments.length) {
    await supabaseAdmin.from("message_attachments").insert(
      attachments.map((item: any) => ({
        message_id: inserted.id,
        file_url: item.file_url,
        file_name: item.file_name || "Attachment",
        file_size: Number(item.file_size || 0),
        mime_type: item.mime_type || "application/octet-stream",
      })),
    );
  }

  // Real-time notifications for DMs
  if (channel.type === "DM") {
    const { data: members } = await supabaseAdmin
      .from("channel_members")
      .select("user_id")
      .eq("channel_id", channelId)
      .neq("user_id", context.userId);

    if (members?.length) {
      const { data: sender } = await supabaseAdmin
        .from("users")
        .select("full_name")
        .eq("id", context.userId)
        .single();

      const notifs = members.map(m => ({
        user_id: m.user_id,
        title: `New DM from ${sender?.full_name || 'User'}`,
        message: content.length > 60 ? content.substring(0, 57) + "..." : content,
        type: "INFO",
        link: `/messages?channel=${channelId}`
      }));
      await supabaseAdmin.from("notifications").insert(notifs);
    }
  }

  return NextResponse.json({ message: inserted });
  } catch (err: any) {
    console.error('[messages/send]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
