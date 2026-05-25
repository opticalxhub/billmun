import { NextRequest, NextResponse } from "next/server";
import { getRequestUserContext } from "@/lib/auth-context";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { jsonPrivateNoStore } from "@/lib/http";
import { reportError } from "@/lib/logger";
import { messageReactionSchema } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const { context, error, status } = await getRequestUserContext();
    if (!context) return jsonPrivateNoStore({ error }, { status: status || 500 });

    const parsedBody = messageReactionSchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return jsonPrivateNoStore({ error: "Invalid reaction payload" }, { status: 400 });
    }
    const { message_id: messageId, emoji } = parsedBody.data;

    const { data: message } = await supabaseAdmin
      .from("messages")
      .select("id, channel_id")
      .eq("id", messageId)
      .maybeSingle();
    if (!message?.id) return jsonPrivateNoStore({ error: "Message not found" }, { status: 404 });

    const { data: membership } = await supabaseAdmin
      .from("channel_members")
      .select("id")
      .eq("channel_id", message.channel_id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!membership?.id) return jsonPrivateNoStore({ error: "Forbidden" }, { status: 403 });

    const { data: existing } = await supabaseAdmin
      .from("message_reactions")
      .select("id")
      .eq("message_id", messageId)
      .eq("user_id", context.userId)
      .eq("emoji", emoji)
      .maybeSingle();

    if (existing?.id) {
      await supabaseAdmin.from("message_reactions").delete().eq("id", existing.id);
      return jsonPrivateNoStore({ removed: true });
    }

    const { error: insertError } = await supabaseAdmin
      .from("message_reactions")
      .insert({ message_id: messageId, user_id: context.userId, emoji });
    if (insertError) {
      reportError(insertError, { route: '/api/messages/react', method: 'POST' });
      return jsonPrivateNoStore({ error: "Internal server error" }, { status: 500 });
    }

    return jsonPrivateNoStore({ added: true });
  } catch (err: unknown) {
    reportError(err, { route: '/api/messages/react', method: 'POST' });
    return jsonPrivateNoStore({ error: 'Internal server error' }, { status: 500 });
  }
}
