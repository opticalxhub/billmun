import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: () => {},
          remove: () => {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role
    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const allowedRoles = ["MEDIA", "PRESS", "EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"];
    if (!allowedRoles.includes(userData?.role || "")) {
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
