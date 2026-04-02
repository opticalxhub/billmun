import { NextRequest, NextResponse } from "next/server";
import { getEBContext } from "@/lib/eb-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { context, error: authErr, status: authStatus } = await getEBContext();
    if (!context) return NextResponse.json({ error: authErr }, { status: authStatus || 401 });

    const { id, status } = await req.json();
    if (!id || !status || !["PUBLISHED", "APPROVED", "REJECTED", "PENDING"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Update press release status using admin client
    const { error } = await supabaseAdmin
      .from("press_releases")
      .update({ status, reviewed_by: context.ebUserId, reviewed_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("[eb/press/approve] error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({ success: true, status });
  } catch (err) {
    console.error("[eb/press/approve] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
