import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getRequestUserContext } from "@/lib/auth-context";
import { jsonPrivateNoStore } from "@/lib/http";
import { reportError } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { context, error, status } = await getRequestUserContext();

    if (!context) {
      return jsonPrivateNoStore(
        { message: error || "Unauthorized" },
        { status: status || 401 }
      );
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role, status, date_of_birth, grade, phone_number, emergency_contact_name, emergency_contact_relation, emergency_contact_phone, dietary_restrictions, preferred_committee, allocated_country, has_completed_onboarding, badge_status, ai_analyses_today, created_at, updated_at')
      .eq('id', context.userId)
      .maybeSingle();

    if (userError || !user) {
      return jsonPrivateNoStore(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const [assignmentsRes, documentsRes, docCountRes, aiSessionCountRes, settingsRes] = await Promise.all([
      supabaseAdmin
        .from('committee_assignments')
        .select('id, committee_id, country, seat_number, assigned_at, committees(id, name, abbreviation, topic, secondary_topic)')
        .eq('user_id', user.id),
      supabaseAdmin
        .from('documents')
        .select('id, title, status, uploaded_at, reviewed_at, committee_id')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false })
        .limit(5),
      supabaseAdmin.from('documents').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabaseAdmin.from('ai_feedback').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabaseAdmin
        .from('conference_settings')
        .select('id, conference_name, conference_start_date, conference_end_date, maintenance_mode')
        .eq('id', '1')
        .maybeSingle(),
    ]);

    return jsonPrivateNoStore({
      user,
      assignments: assignmentsRes.data ?? [],
      documents: documentsRes.data ?? [],
      stats: {
        docCount: docCountRes.count ?? 0,
        aiSessionCount: aiSessionCountRes.count ?? 0,
      },
      settings: settingsRes.data ?? null,
    });
  } catch (error) {
    reportError(error, { route: '/api/users/me', method: 'GET' });
    return jsonPrivateNoStore({ error: "Server error" }, { status: 500 });
  }
}
