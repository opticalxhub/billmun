import { NextRequest, NextResponse } from "next/server";
import { getRequestUserContext } from "@/lib/auth-context";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { reportError } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const { context, error, status } = await getRequestUserContext();
    if (!context) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: status || 401 });
    }

    const { userId, role } = context;

    // Execute multiple queries in parallel on the server
    const [
      { data: settings },
      { data: profile },
      { data: assignment },
    ] = await Promise.all([
      supabaseAdmin
        .from('conference_settings')
        .select('id, conference_name, registration_open, maintenance_mode, ai_analysis_enabled, whatsapp_group_link')
        .eq('id', '1')
        .maybeSingle(),
      supabaseAdmin
        .from('users')
        .select('id, email, full_name, role, status, has_completed_onboarding, badge_status, ai_analyses_today')
        .eq('id', userId)
        .maybeSingle(),
      supabaseAdmin
        .from('committee_assignments')
        .select('committee_id, country, seat_number')
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

    let committee = null;
    let session = null;
    let stats = null;
    let activity = null;

    if (assignment?.committee_id) {
      const [
        { data: committeeData },
        { data: sessionData },
        { data: docsCount },
        { data: speechesCount },
        { data: blocsCount },
        { data: logs },
      ] = await Promise.all([
        supabaseAdmin
          .from('committees')
          .select('id, name, topic, background_guide_url, rop_url')
          .eq('id', assignment.committee_id)
          .maybeSingle(),
        supabaseAdmin
          .from('committee_sessions')
          .select('id, status, debate_topic, speaking_time_limit')
          .eq('committee_id', assignment.committee_id)
          .maybeSingle(),
        supabaseAdmin
          .from('documents')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabaseAdmin
          .from('speeches')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabaseAdmin
          .from('bloc_members')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabaseAdmin
          .from('audit_logs')
          .select('id, action, performed_at')
          .eq('actor_id', userId)
          .order('performed_at', { ascending: false })
          .limit(5),
      ]);

      committee = committeeData;
      session = sessionData;
      stats = {
        documents: docsCount || 0,
        aiToday: profile?.ai_analyses_today || 0,
        speeches: speechesCount || 0,
        blocs: blocsCount || 0,
      };
      activity = logs || [];
    }

    return NextResponse.json({
      settings,
      profile,
      assignment,
      committee,
      session,
      stats,
      activity,
    });
  } catch (err: any) {
    reportError(err, { context: 'bootstrap_api' });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
