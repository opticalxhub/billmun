import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getEBContext } from "@/lib/eb-auth";
import { runOnAnnouncementCreated } from "@/lib/automation";

export async function POST(req: NextRequest) {
  try {
    const { context, error: authError, status: authStatus } = await getEBContext();
    if (!context) return NextResponse.json({ error: authError }, { status: authStatus || 401 });

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { action, id, title, body: content, is_pinned, target_roles, committee_id, scheduled_for } = body;
    const ebUserId = context.ebUserId;

    if (!action) return NextResponse.json({ error: "Missing action" }, { status: 400 });

    if (action === "create" || action === "notify_all") {
      let createdId = id;
      if (action === "create") {
        if (!title || !content) return NextResponse.json({ error: "Missing title or body" }, { status: 400 });
        const { data: created, error } = await supabaseAdmin
          .from("announcements")
          .insert({
            title,
            body: content,
            is_pinned: !!is_pinned,
            target_roles: target_roles || [],
            committee_id: committee_id === "ALL" ? null : committee_id,
            scheduled_for: scheduled_for || null,
            author_id: ebUserId,
          })
          .select("id")
          .single();
        if (error) throw error;
        createdId = created.id;
      }

      await runOnAnnouncementCreated(
        createdId as string,
        title,
        content || body.message,
        (target_roles || []) as string[],
        committee_id === "ALL" ? null : committee_id,
      );
      return NextResponse.json({ ok: true });
    }

    if (action === "update" && id) {
      const { error } = await supabaseAdmin.from("announcements").update({
        title, body: content, is_pinned: !!is_pinned,
        target_roles: target_roles || [],
        committee_id: committee_id === "ALL" ? null : committee_id,
        scheduled_for: scheduled_for || null
      }).eq("id", id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === "delete" && id) {
      const { error } = await supabaseAdmin.from("announcements").delete().eq("id", id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[eb/announcements/action] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
