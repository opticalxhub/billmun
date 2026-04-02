import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getRequestUserContext } from "@/lib/auth-context";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { context, error: authError, status: authStatus } = await getRequestUserContext();
    if (!context) {
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: authStatus || 401 });
    }

    // Get user ID from query param
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");

    // Only allow users to query their own data, or EB/Admin to query anyone
    const EB_ROLES = ["EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL", "ADMIN"];
    const userId = (requestedUserId && EB_ROLES.includes(context.role))
      ? requestedUserId
      : context.userId;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Fetch user data
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, role, status, has_completed_onboarding, badge_status, ai_analyses_today, created_at, updated_at")
      .eq("id", userId)
      .maybeSingle();

    if (userError) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch assignment in parallel
    const { data: assignment } = await supabaseAdmin
      .from("committee_assignments")
      .select("*")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    // Fetch committee if assigned
    let committee = null;
    let committeeSession = null;

    if (assignment?.committee_id) {
      const { data: committeeData } = await supabaseAdmin
        .from("committees")
        .select("*")
        .eq("id", assignment.committee_id)
        .maybeSingle();
      committee = committeeData;

      const { data: sessionData } = await supabaseAdmin
        .from("committee_sessions")
        .select("*")
        .eq("committee_id", assignment.committee_id)
        .maybeSingle();
      committeeSession = sessionData;
    }

    return NextResponse.json({
      user,
      assignment,
      committee,
      committeeSession,
    });
  } catch (err: any) {
    console.error("[delegate/dashboard] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
