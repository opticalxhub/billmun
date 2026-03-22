-- Performance indexes (run in Supabase SQL editor)
CREATE INDEX IF NOT EXISTS idx_users_status_role ON public.users (status, role);
CREATE INDEX IF NOT EXISTS idx_messages_channel_created ON public.messages (channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_channel_members_user ON public.channel_members (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_documents_user_status ON public.documents (user_id, status);
CREATE INDEX IF NOT EXISTS idx_delegate_presence_committee ON public.delegate_presence_statuses (committee_id);
CREATE INDEX IF NOT EXISTS idx_speakers_list_committee_status ON public.speakers_list (committee_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_time ON public.audit_logs (performed_at DESC);
