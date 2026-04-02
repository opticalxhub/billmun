import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const committeeId = searchParams.get("committeeId");
    if (!committeeId) {
      return NextResponse.json({ error: "committeeId required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("announcements")
      .select("*")
      .or(`committee_id.eq.${committeeId},committee_id.is.null`)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[announcements/committee] error:", error);
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(data || []);
  } catch (err: any) {
    console.error("[announcements/committee] error:", err);
    return NextResponse.json([], { status: 200 });
  }
}
