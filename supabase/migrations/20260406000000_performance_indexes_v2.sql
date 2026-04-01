-- =====================================================
-- Performance Indexes V2 — Conference Day Optimization
-- Targets the heaviest query patterns identified during audit
-- =====================================================

-- Admin dashboard: documents filtered by committee + status
CREATE INDEX IF NOT EXISTS idx_documents_committee_status ON public.documents (committee_id, status);

-- Admin dashboard: announcements by committee
CREATE INDEX IF NOT EXISTS idx_announcements_committee ON public.announcements (committee_id, created_at DESC);

-- Admin dashboard: committee resources by committee
CREATE INDEX IF NOT EXISTS idx_committee_resources_committee ON public.committee_resources (committee_id);

-- Admin dashboard: attendance by committee
CREATE INDEX IF NOT EXISTS idx_attendance_committee ON public.attendance_records (committee_id, session_start DESC);

-- Admin dashboard: vote records by committee
CREATE INDEX IF NOT EXISTS idx_vote_records_committee ON public.committee_vote_records (committee_id, created_at DESC);

-- Admin dashboard: admin tasks by committee + status
CREATE INDEX IF NOT EXISTS idx_admin_tasks_committee_status ON public.committee_admin_tasks (committee_id, status);

-- Committee sessions: lookup by committee (used by admin, chair, delegate dashboards)
CREATE INDEX IF NOT EXISTS idx_committee_sessions_committee ON public.committee_sessions (committee_id, updated_at DESC);

-- Committee assignments: lookup by user (used by middleware, delegate dashboard, EB registrations)
CREATE INDEX IF NOT EXISTS idx_committee_assignments_user ON public.committee_assignments (user_id);

-- Committee assignments: lookup by committee (used by admin dashboard, chair dashboard)
CREATE INDEX IF NOT EXISTS idx_committee_assignments_committee ON public.committee_assignments (committee_id);

-- Security dashboard: incidents by status
CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON public.security_incidents (status);

-- Security dashboard: badge events recent
CREATE INDEX IF NOT EXISTS idx_badge_events_time ON public.security_badge_events (created_at DESC);

-- Security dashboard: alerts recent  
CREATE INDEX IF NOT EXISTS idx_security_alerts_time ON public.security_alerts (created_at DESC);

-- EB overview: roll call records by session (N+1 fix support)
CREATE INDEX IF NOT EXISTS idx_roll_call_records_session ON public.roll_call_records (session_id, started_at DESC);

-- EB overview: roll call entries by roll call
CREATE INDEX IF NOT EXISTS idx_roll_call_entries_rollcall ON public.roll_call_entries (roll_call_id);

-- EB registrations: users by status for filtered queries
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users (status);

-- Messages: unread count (channel + created_at + deleted_at)
CREATE INDEX IF NOT EXISTS idx_messages_channel_unread ON public.messages (channel_id, created_at DESC) WHERE deleted_at IS NULL;

-- Channels: committee channel lookup
CREATE INDEX IF NOT EXISTS idx_channels_committee ON public.channels (committee_id) WHERE type = 'COMMITTEE';

-- User field history: EB registration detail drawer
CREATE INDEX IF NOT EXISTS idx_user_field_history_user ON public.user_field_history (user_id, changed_at DESC);

-- Notifications: user inbox (unread first)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications (user_id, created_at DESC) WHERE is_read = false;
