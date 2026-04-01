import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
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
