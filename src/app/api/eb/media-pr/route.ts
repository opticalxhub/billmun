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

    // Check if user is EB/Admin
    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const allowedRoles = ["EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL", "ADMIN"];
    if (!allowedRoles.includes(userData?.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all media and press releases with uploader info
    const [{ data: media }, { data: pressReleases }] = await Promise.all([
      supabaseAdmin.from("media_gallery").select("*, uploader:uploader_id(full_name, email)").order("created_at", { ascending: false }),
      supabaseAdmin.from("press_releases").select("*, author:author_id(full_name, email)").order("created_at", { ascending: false })
    ]);

    return NextResponse.json({
      media: media || [],
      pressReleases: pressReleases || []
    });
  } catch (err) {
    console.error("[eb/media-pr] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
