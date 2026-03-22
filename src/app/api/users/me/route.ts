import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getRequestUserContext } from "@/lib/auth-context";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { context, error, status } = await getRequestUserContext();

    if (!context) {
      return NextResponse.json(
        { message: error || "Unauthorized" },
        { status: status || 401 }
      );
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role, status, date_of_birth, grade, phone_number, emergency_contact_name, emergency_contact_relation, emergency_contact_phone, dietary_restrictions, preferred_committee, allocated_country, has_completed_onboarding, badge_status, ai_analyses_today, created_at, updated_at')
      .eq('id', context.userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Get committee assignments
    const { data: assignments } = await supabaseAdmin
      .from('committee_assignments')
      .select('*, committees(*)')
      .eq('user_id', user.id);

    // Get recent documents
    const { data: documents } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false })
      .limit(5);

    // Get statistics
    const { count: docCount } = await supabaseAdmin
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { count: aiSessionCount } = await supabaseAdmin
      .from('ai_feedback')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Calculate days until conference
    const { data: settings } = await supabaseAdmin
      .from('conference_settings')
      .select('*')
      .single();

    return NextResponse.json({
      user,
      assignments,
      documents,
      stats: {
        docCount,
        aiSessionCount,
      },
      settings,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}