import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from("announcements")
      .select("id, title, body, is_pinned, created_at, author:author_id(full_name)")
      .eq("is_active", true)
      .is("committee_id", null)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;

    const response = NextResponse.json({ announcements: data || [] });
    response.headers.set('Cache-Control', 'public, max-age=120, s-maxage=300');
    return response;
  } catch (err: any) {
    console.error("[announcements/public] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
