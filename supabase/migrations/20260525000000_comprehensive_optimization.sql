-- NXTMUN Comprehensive Performance & Security Optimization
-- Date: 2026-05-25

-- 1. Drop Legacy Tables (Unused Roles & Features)
DROP TABLE IF EXISTS public.security_zone_logs CASCADE;
DROP TABLE IF EXISTS public.security_delegate_locations CASCADE;
DROP TABLE IF EXISTS public.security_badge_events CASCADE;
DROP TABLE IF EXISTS public.security_badges CASCADE;
DROP TABLE IF EXISTS public.security_access_zones CASCADE;
DROP TABLE IF EXISTS public.security_alerts CASCADE;
DROP TABLE IF EXISTS public.security_briefing_reads CASCADE;
DROP TABLE IF EXISTS public.security_briefings CASCADE;
DROP TABLE IF EXISTS public.security_incidents CASCADE;
DROP TABLE IF EXISTS public.media_gallery CASCADE;
DROP TABLE IF EXISTS public.press_releases CASCADE;
DROP TABLE IF EXISTS public.missing_persons CASCADE;

-- 2. Performance Indexes for Scalability (300+ Concurrent Users)
-- Users & Roles
CREATE INDEX IF NOT EXISTS idx_users_role_status ON public.users (role, status);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);

-- Committees & Assignments
CREATE INDEX IF NOT EXISTS idx_committee_assignments_user_id ON public.committee_assignments (user_id);
CREATE INDEX IF NOT EXISTS idx_committee_assignments_committee_id ON public.committee_assignments (committee_id);
CREATE INDEX IF NOT EXISTS idx_committees_chair_id ON public.committees (chair_id);
CREATE INDEX IF NOT EXISTS idx_committees_co_chair_id ON public.committees (co_chair_id);

-- Messaging System (High Load)
CREATE INDEX IF NOT EXISTS idx_messages_channel_id_created ON public.messages (channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_channel_members_composite ON public.channel_members (channel_id, user_id);
CREATE INDEX IF NOT EXISTS idx_message_attachments_msg ON public.message_attachments (message_id);

-- Session Management
CREATE INDEX IF NOT EXISTS idx_roll_call_records_session ON public.roll_call_records (session_id);
CREATE INDEX IF NOT EXISTS idx_roll_call_entries_composite ON public.roll_call_entries (roll_call_id, delegate_id);
CREATE INDEX IF NOT EXISTS idx_speakers_list_composite ON public.speakers_list (committee_id, session_id, status);

-- Content & Stats
CREATE INDEX IF NOT EXISTS idx_documents_committee_status ON public.documents (committee_id, status);
CREATE INDEX IF NOT EXISTS idx_delegate_stats_committee ON public.delegate_stats (committee_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user ON public.ai_feedback (user_id);

-- 3. Data Integrity & Resilience (Cascading Deletes)
ALTER TABLE public.committee_assignments 
  DROP CONSTRAINT IF EXISTS committee_assignments_user_id_fkey,
  ADD CONSTRAINT committee_assignments_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.committee_assignments 
  DROP CONSTRAINT IF EXISTS committee_assignments_committee_id_fkey,
  ADD CONSTRAINT committee_assignments_committee_id_fkey 
  FOREIGN KEY (committee_id) REFERENCES public.committees(id) ON DELETE CASCADE;

ALTER TABLE public.messages 
  DROP CONSTRAINT IF EXISTS messages_sender_id_fkey,
  ADD CONSTRAINT messages_sender_id_fkey 
  FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 4. Hardened Security Definership
CREATE OR REPLACE FUNCTION public.check_is_eb(u_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = u_id 
    AND role IN ('EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_is_chair(u_id uuid, c_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.committees 
    WHERE id = c_id 
    AND (chair_id = u_id OR co_chair_id = u_id)
  ) OR public.check_is_eb(u_id);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 5. Unified RLS Policies (Example: Documents)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
CREATE POLICY "Users can view their own documents"
ON public.documents FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.check_is_eb(auth.uid()) OR public.check_is_chair(auth.uid(), committee_id));

DROP POLICY IF EXISTS "Delegates can submit documents" ON public.documents;
CREATE POLICY "Delegates can submit documents"
ON public.documents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 6. Messaging Isolation
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view channel messages" ON public.messages;
CREATE POLICY "Members can view channel messages"
ON public.messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.channel_members 
    WHERE channel_id = messages.channel_id 
    AND user_id = auth.uid()
  ) OR public.check_is_eb(auth.uid())
);

-- 7. Scaling Audit Logs (Vacuum Strategy Hint)
-- For a system with high activity, audit_logs should be partitioned if possible, 
-- but here we ensure indexes are robust.
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_time ON public.audit_logs (actor_id, performed_at DESC);
