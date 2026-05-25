import { supabaseAdmin } from '@/lib/supabase-admin';
import type { RequestUserContext } from '@/lib/auth-context';
import type {
  CommitteeAssignmentSummary,
  CommitteeSessionSummary,
  CommitteeSummary,
  DelegateDashboardData,
  PortalUserSummary,
} from '@/types/portal';

const EB_ROLES = ['EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL'];

export function resolveDelegateDashboardUserId(
  context: RequestUserContext,
  requestedUserId: string | null | undefined,
) {
  if (requestedUserId && EB_ROLES.includes(context.role)) {
    return requestedUserId;
  }

  return context.userId;
}

export async function getDelegateDashboardData(
  context: RequestUserContext,
  requestedUserId?: string | null,
): Promise<DelegateDashboardData | null> {
  const userId = resolveDelegateDashboardUserId(context, requestedUserId);

  const [userRes, assignmentRes, settingsRes] = await Promise.all([
    supabaseAdmin
      .from('users')
      .select(
        'id, email, full_name, role, status, has_completed_onboarding, badge_status, ai_analyses_today, ai_analyses_reset_date, created_at, updated_at',
      )
      .eq('id', userId)
      .maybeSingle<PortalUserSummary>(),
    supabaseAdmin
      .from('committee_assignments')
      .select('id, committee_id, country, seat_number, assigned_at')
      .eq('user_id', userId)
      .maybeSingle<CommitteeAssignmentSummary>(),
    supabaseAdmin
      .from('conference_settings')
      .select('id, conference_name, registration_open, maintenance_mode, ai_analysis_enabled, whatsapp_group_link')
      .eq('id', '1')
      .maybeSingle(),
  ]);

  if (userRes.error || !userRes.data) {
    return null;
  }

  let committee: CommitteeSummary | null = null;
  let committeeSession: CommitteeSessionSummary | null = null;

  if (assignmentRes.data?.committee_id) {
    const [committeeRes, sessionRes] = await Promise.all([
      supabaseAdmin
        .from('committees')
        .select(
          'id, name, abbreviation, topic, secondary_topic, description, background_guide_url, rop_url, sub_topics, chair_id, co_chair_id, admin_id, visibility',
        )
        .eq('id', assignmentRes.data.committee_id)
        .maybeSingle<CommitteeSummary>(),
      supabaseAdmin
        .from('committee_sessions')
        .select(
          'id, committee_id, status, caucus_type, debate_topic, current_speaker, speaking_time_limit, moderated_caucus_topic, moderated_caucus_time, unmoderated_caucus_time, voting_open, updated_at',
        )
        .eq('committee_id', assignmentRes.data.committee_id)
        .maybeSingle<CommitteeSessionSummary>(),
    ]);

    committee = committeeRes.data ?? null;
    committeeSession = sessionRes.data ?? null;
  }

  // Fetch Stats and Activity (Aggregated for 300+ users performance)
  const [docsCount, speechesCount, blocsCount, activityRes] = await Promise.all([
    supabaseAdmin.from('documents').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabaseAdmin.from('speeches').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabaseAdmin.from('bloc_members').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabaseAdmin.from('audit_logs')
      .select('id, action, performed_at')
      .eq('actor_id', userId)
      .not('action', 'ilike', '%rejected%')
      .not('action', 'ilike', '%suspended%')
      .order('performed_at', { ascending: false })
      .limit(10),
  ]);

  const today = new Date().toISOString().split('T')[0];
  const resetDate = userRes.data.ai_analyses_reset_date ? new Date(userRes.data.ai_analyses_reset_date).toISOString().split('T')[0] : null;
  const aiToday = resetDate === today ? (userRes.data.ai_analyses_today || 0) : 0;

  return {
    user: userRes.data,
    assignment: assignmentRes.data ?? null,
    committee,
    committeeSession,
    settings: settingsRes.data ?? null,
    stats: {
      documents: docsCount.count || 0,
      aiToday,
      speeches: speechesCount.count || 0,
      blocs: blocsCount.count || 0,
    },
    activity: activityRes.data || [],
  };
}
