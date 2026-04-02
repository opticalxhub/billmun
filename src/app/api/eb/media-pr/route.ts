import { NextRequest, NextResponse } from "next/server";
import { getEBContext } from "@/lib/eb-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  try {
    const { context, error, status } = await getEBContext();
    if (!context) return NextResponse.json({ error }, { status: status || 401 });

    // Fetch all media and press releases with uploader info
    const [{ data: media }, { data: pressReleases }] = await Promise.all([
      supabaseAdmin.from("media_gallery").select("*, users!media_gallery_uploader_id_fkey(full_name, email)").order("created_at", { ascending: false }),
      supabaseAdmin.from("press_releases").select("*, users!press_releases_author_id_fkey(full_name, email)").order("created_at", { ascending: false })
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
