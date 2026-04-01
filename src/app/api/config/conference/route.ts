import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getEBContext } from "@/lib/eb-auth";

export async function PATCH(req: NextRequest) {
  try {
    const { context, error: authError, status: authStatus } = await getEBContext();
    if (!context) return NextResponse.json({ error: authError }, { status: authStatus || 401 });

    const body = await req.json();
    const { manual_override, post_conference_message } = body;

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (manual_override !== undefined) {
      if (manual_override !== null && manual_override !== "OPEN" && manual_override !== "CLOSED") {
        return NextResponse.json({ error: "manual_override must be 'OPEN', 'CLOSED', or null" }, { status: 400 });
      }
      updates.manual_override = manual_override;
    }
    if (post_conference_message !== undefined) {
      updates.post_conference_message = post_conference_message;
    }

    const { error } = await supabaseAdmin
      .from("conference_config")
      .upsert({ id: "1", ...updates });

    if (error) throw error;

    try {
      await supabaseAdmin.from("audit_logs").insert({
        actor_id: context.ebUserId,
        action: "UPDATE_CONFERENCE_CONFIG",
        target_type: "CONFERENCE_CONFIG",
        target_id: "1",
        metadata: updates,
      });
    } catch { /* ignore */ }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[conference config PATCH] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { context, error: authError, status: authStatus } = await getEBContext();
    if (!context) return NextResponse.json({ error: authError }, { status: authStatus || 401 });

    const body = await req.json();
    const { windows } = body as {
      windows?: Array<{ id?: string; label: string; start_time: string; end_time: string }>;
    };

    if (!windows || !Array.isArray(windows)) {
      return NextResponse.json({ error: "windows array required" }, { status: 400 });
    }

    // Delete all existing windows and re-insert
    await supabaseAdmin.from("conference_windows").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    if (windows.length > 0) {
      const rows = windows.map((w) => ({
        label: w.label,
        start_time: w.start_time,
        end_time: w.end_time,
      }));
      const { error } = await supabaseAdmin.from("conference_windows").insert(rows);
      if (error) throw error;
    }

    try {
      await supabaseAdmin.from("audit_logs").insert({
        actor_id: context.ebUserId,
        action: "UPDATE_CONFERENCE_WINDOWS",
        target_type: "CONFERENCE_WINDOWS",
        metadata: { window_count: windows.length },
      });
    } catch { /* ignore */ }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[conference windows PUT] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
