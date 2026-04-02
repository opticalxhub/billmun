import { NextRequest, NextResponse } from "next/server";
import { getEBContext } from "@/lib/eb-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { context, error: authErr, status: authStatus } = await getEBContext();
    if (!context) return NextResponse.json({ error: authErr }, { status: authStatus || 401 });

    const { id, isHidden } = await req.json();
    if (!id || typeof isHidden !== 'boolean') {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Update media hidden status using admin client
    const { error } = await supabaseAdmin
      .from("media_gallery")
      .update({ is_hidden: isHidden })
      .eq("id", id);

    if (error) {
      console.error("[eb/media/hide] error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({ success: true, isHidden });
  } catch (err) {
    console.error("[eb/media/hide] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
