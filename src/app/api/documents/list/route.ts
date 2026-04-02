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
      .from("documents")
      .select("*, users!documents_user_id_fkey(full_name)")
      .eq("committee_id", committeeId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[documents/list] error:", error);
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(data || []);
  } catch (err: any) {
    console.error("[documents/list] error:", err);
    return NextResponse.json([], { status: 200 });
  }
}
