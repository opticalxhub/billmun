import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    // Fetch conference config
    const { data: config } = await supabaseAdmin
      .from("conference_config")
      .select("*")
      .eq("id", "1")
      .maybeSingle();

    // Fetch windows
    const { data: windows } = await supabaseAdmin
      .from("conference_windows")
      .select("*")
      .order("start_time", { ascending: true });

    const now = new Date();
    const manualOverride = config?.manual_override ?? null; // "OPEN" | "CLOSED" | null
    const postConferenceMessage = config?.post_conference_message || "";

    // Determine if we're inside a conference window
    let currentWindow: any = null;
    let nextWindow: any = null;

    for (const w of windows || []) {
      const start = new Date(w.start_time);
      const end = new Date(w.end_time);
      if (now >= start && now <= end) {
        currentWindow = w;
        break;
      }
      if (now < start && !nextWindow) {
        nextWindow = w;
      }
    }

    // Determine effective status
    let status: "OPEN" | "CLOSED" | "PRE_CONFERENCE" | "POST_CONFERENCE" = "CLOSED";

    if (manualOverride === "OPEN") {
      status = "OPEN";
    } else if (manualOverride === "CLOSED") {
      status = "CLOSED";
    } else if (currentWindow) {
      status = "OPEN";
    } else if (nextWindow) {
      status = "PRE_CONFERENCE";
    } else if ((windows || []).length > 0) {
      // All windows have passed
      const lastEnd = new Date((windows as any[])[(windows as any[]).length - 1].end_time);
      if (now > lastEnd) {
        status = "POST_CONFERENCE";
      } else {
        status = "PRE_CONFERENCE";
      }
    }

    const current_window = currentWindow
      ? { id: currentWindow.id, label: currentWindow.label, start_time: currentWindow.start_time, end_time: currentWindow.end_time }
      : null;
    const next_window = nextWindow
      ? { id: nextWindow.id, label: nextWindow.label, start_time: nextWindow.start_time, end_time: nextWindow.end_time }
      : null;

    const response = NextResponse.json({
      status,
      manual_override: manualOverride,
      current_window,
      next_window,
      windows: (windows || []).map((w: any) => ({
        id: w.id,
        label: w.label,
        start_time: w.start_time,
        end_time: w.end_time,
      })),
      post_conference_message: postConferenceMessage,
      server_time: now.toISOString(),
    });
    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=120');
    return response;
  } catch (err: any) {
    console.error("[conference-status] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
