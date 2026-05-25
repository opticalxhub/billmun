import { NextRequest, NextResponse } from "next/server";
import { getRequestUserContext } from "@/lib/auth-context";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { jsonPrivateNoStore } from "@/lib/http";
import { reportError } from "@/lib/logger";
import { messageSendSchema } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const { context, error, status } = await getRequestUserContext();
    if (!context) return jsonPrivateNoStore({ error }, { status: status || 500 });

    const parsedBody = messageSendSchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return jsonPrivateNoStore({ error: "Invalid message payload" }, { status: 400 });
    }

    const { channel_id: channelId, content, type, reply_to_id: replyToId, attachments } = parsedBody.data;
    const safeContent = content || "";

    const { data: membership } = await supabaseAdmin
      .from("channel_members")
      .select("id")
      .eq("channel_id", channelId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!membership?.id) return jsonPrivateNoStore({ error: "Forbidden" }, { status: 403 });

    const { data: channel } = await supabaseAdmin
      .from("channels")
      .select("id, is_read_only, type")
      .eq("id", channelId)
      .maybeSingle();
    if (!channel?.id) return jsonPrivateNoStore({ error: "Channel not found" }, { status: 404 });

    if (
      channel.is_read_only &&
      !["EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"].includes(context.role)
    ) {
      return jsonPrivateNoStore({ error: "Read only channel" }, { status: 403 });
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("messages")
      .insert({
        channel_id: channelId,
        sender_id: context.userId,
          content: safeContent,
        type,
        reply_to_id: replyToId,
        created_at: new Date().toISOString(),
      })
      .select("id, channel_id, sender_id, content, type, created_at, reply_to_id")
      .single();
    if (insertError || !inserted?.id) {
      return jsonPrivateNoStore({ error: insertError?.message || "Failed to send" }, { status: 500 });
    }

    if (attachments.length) {
      await supabaseAdmin.from("message_attachments").insert(
        attachments.map((attachment) => ({
          message_id: inserted.id,
          file_url: attachment.file_url,
          file_name: attachment.file_name || "Attachment",
          file_size: Number(attachment.file_size || 0),
          mime_type: attachment.mime_type || "application/octet-stream",
        })),
      );
    }

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
          .maybeSingle();

        const notifs = members.map((member) => ({
          user_id: member.user_id,
          title: `New DM from ${sender?.full_name || 'User'}`,
          message: safeContent.length > 60 ? `${safeContent.slice(0, 57)}...` : safeContent,
          type: "INFO",
          link: `/messages?channel=${channelId}`,
        }));
        await supabaseAdmin.from("notifications").insert(notifs);
      }
    }

    return jsonPrivateNoStore({ message: inserted });
  } catch (err: unknown) {
    reportError(err, { route: '/api/messages/send', method: 'POST' });
    return jsonPrivateNoStore({ error: 'Internal server error' }, { status: 500 });
  }
}
