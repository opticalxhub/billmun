import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from("media_gallery")
      .select("id, media_url, caption, media_type, status, created_at, uploader_id")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;

    const response = NextResponse.json({ items: data || [] });
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    return response;
  } catch (err: any) {
    console.error("[gallery] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
