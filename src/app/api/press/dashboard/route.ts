import { NextRequest, NextResponse } from "next/server";
import { getRequestUserContext } from "@/lib/auth-context";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  try {
    const { context, error, status } = await getRequestUserContext();
    if (!context) return NextResponse.json({ error }, { status: status || 401 });

    const allowedRoles = ["MEDIA", "PRESS", "EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"];
    if (!allowedRoles.includes(context.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all dashboard data using supabaseAdmin to bypass RLS
    const [
      { data: media },
      { data: pressReleases },
      { data: events },
      { data: resources }
    ] = await Promise.all([
      supabaseAdmin.from("media_gallery").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("press_releases").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("schedule_events").select("*").order("start_time", { ascending: true }),
      supabaseAdmin.from("committee_resources").select("*").eq("archived", false).order("created_at", { ascending: false })
    ]);

    return NextResponse.json({
      media: media || [],
      pressReleases: pressReleases || [],
      events: events || [],
      resources: resources || []
    });
  } catch (err) {
    console.error("[press/dashboard] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
