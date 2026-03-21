import { NextRequest, NextResponse } from "next/server";
import { getRequestUserContext } from "@/lib/auth-context";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const { context, error, status } = await getRequestUserContext();
  if (!context) return NextResponse.json({ error }, { status: status || 500 });

  const body = await req.json();
  const messageId = body?.message_id as string;
  const emoji = body?.emoji as string;
  if (!messageId || !emoji) return NextResponse.json({ error: "Missing message_id or emoji" }, { status: 400 });

  const { data: message } = await supabaseAdmin
    .from("messages")
    .select("id, channel_id")
    .eq("id", messageId)
    .maybeSingle();
  if (!message?.id) return NextResponse.json({ error: "Message not found" }, { status: 404 });

  const { data: membership } = await supabaseAdmin
    .from("channel_members")
    .select("id")
    .eq("channel_id", message.channel_id)
    .eq("user_id", context.userId)
    .maybeSingle();
  if (!membership?.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: existing } = await supabaseAdmin
    .from("message_reactions")
    .select("id")
    .eq("message_id", messageId)
    .eq("user_id", context.userId)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing?.id) {
    await supabaseAdmin.from("message_reactions").delete().eq("id", existing.id);
    return NextResponse.json({ removed: true });
  }

  const { error: insertError } = await supabaseAdmin
    .from("message_reactions")
    .insert({ message_id: messageId, user_id: context.userId, emoji });
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  return NextResponse.json({ added: true });
}
