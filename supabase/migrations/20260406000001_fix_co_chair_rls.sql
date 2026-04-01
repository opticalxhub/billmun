-- =====================================================
-- Fix RLS policies to include CO_CHAIR role
-- CO_CHAIR users use the same chair dashboard and need
-- identical permissions to CHAIR for client-side queries.
-- =====================================================

-- 1. committee_sessions — CO_CHAIR needs to start/end sessions
DROP POLICY IF EXISTS "Chairs and EB can insert/update committee_sessions" ON public.committee_sessions;
CREATE POLICY "Chairs and EB can insert/update committee_sessions"
ON public.committee_sessions FOR ALL
TO authenticated
USING (
  public.get_my_role() IN ('CHAIR', 'CO_CHAIR', 'EXECUTIVE_BOARD', 'ADMIN', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
);

-- 2. speakers_list — CO_CHAIR needs to manage speakers
DROP POLICY IF EXISTS "Chairs can manage speaker lists" ON public.speakers_list;
CREATE POLICY "Chairs can manage speaker lists"
ON public.speakers_list FOR ALL
TO authenticated
USING (
  public.get_my_role() IN ('CHAIR', 'CO_CHAIR', 'EXECUTIVE_BOARD', 'ADMIN', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
);

-- Also allow delegates to view the speakers list
DROP POLICY IF EXISTS "Delegates can view speakers list" ON public.speakers_list;
CREATE POLICY "Delegates can view speakers list"
ON public.speakers_list FOR SELECT
TO authenticated
USING (true);

-- 3. documents — CO_CHAIR needs to review and upload documents
DROP POLICY IF EXISTS "Chairs can manage documents" ON public.documents;
CREATE POLICY "Chairs can manage documents"
ON public.documents FOR ALL
TO authenticated
USING (
  public.get_my_role() IN ('CHAIR', 'CO_CHAIR', 'EXECUTIVE_BOARD', 'ADMIN', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
  OR auth.uid() = user_id
);

-- 4. session_events — CO_CHAIR logs session events
ALTER TABLE IF EXISTS public.session_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Chairs can manage session events" ON public.session_events;
CREATE POLICY "Chairs can manage session events"
ON public.session_events FOR ALL
TO authenticated
USING (
  public.get_my_role() IN ('CHAIR', 'CO_CHAIR', 'EXECUTIVE_BOARD', 'ADMIN', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
);

-- 5. session_status_history — CO_CHAIR logs status changes
ALTER TABLE IF EXISTS public.session_status_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Chairs can manage session status history" ON public.session_status_history;
CREATE POLICY "Chairs can manage session status history"
ON public.session_status_history FOR ALL
TO authenticated
USING (
  public.get_my_role() IN ('CHAIR', 'CO_CHAIR', 'EXECUTIVE_BOARD', 'ADMIN', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
);

-- 6. roll_call_records — CO_CHAIR runs roll calls
ALTER TABLE IF EXISTS public.roll_call_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Chairs can manage roll calls" ON public.roll_call_records;
CREATE POLICY "Chairs can manage roll calls"
ON public.roll_call_records FOR ALL
TO authenticated
USING (
  public.get_my_role() IN ('CHAIR', 'CO_CHAIR', 'EXECUTIVE_BOARD', 'ADMIN', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
);

-- 7. roll_call_entries — CO_CHAIR records attendance
ALTER TABLE IF EXISTS public.roll_call_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Chairs can manage roll call entries" ON public.roll_call_entries;
CREATE POLICY "Chairs can manage roll call entries"
ON public.roll_call_entries FOR ALL
TO authenticated
USING (
  public.get_my_role() IN ('CHAIR', 'CO_CHAIR', 'EXECUTIVE_BOARD', 'ADMIN', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
);

-- 8. delegate_ratings — CO_CHAIR rates delegates
ALTER TABLE IF EXISTS public.delegate_ratings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Chairs can manage delegate ratings" ON public.delegate_ratings;
CREATE POLICY "Chairs can manage delegate ratings"
ON public.delegate_ratings FOR ALL
TO authenticated
USING (
  public.get_my_role() IN ('CHAIR', 'CO_CHAIR', 'EXECUTIVE_BOARD', 'ADMIN', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
);

-- 9. best_delegate_nominees — CO_CHAIR nominates best delegates
ALTER TABLE IF EXISTS public.best_delegate_nominees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Chairs can manage nominees" ON public.best_delegate_nominees;
CREATE POLICY "Chairs can manage nominees"
ON public.best_delegate_nominees FOR ALL
TO authenticated
USING (
  public.get_my_role() IN ('CHAIR', 'CO_CHAIR', 'EXECUTIVE_BOARD', 'ADMIN', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
);

-- 10. delegate_presence_statuses — CO_CHAIR updates presence during roll call
DROP POLICY IF EXISTS "Chairs can manage presence" ON public.delegate_presence_statuses;
CREATE POLICY "Chairs can manage presence"
ON public.delegate_presence_statuses FOR ALL
TO authenticated
USING (
  public.get_my_role() IN ('CHAIR', 'CO_CHAIR', 'EXECUTIVE_BOARD', 'ADMIN', 'SECURITY', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
  OR auth.uid() = user_id
);

-- 11. media_gallery — Include SECRETARY_GENERAL / DEPUTY_SECRETARY_GENERAL
DROP POLICY IF EXISTS "Public can view approved media" ON public.media_gallery;
CREATE POLICY "Public can view approved media"
ON public.media_gallery FOR SELECT
TO authenticated
USING (
  status = 'APPROVED'
  OR public.get_my_role() IN ('EXECUTIVE_BOARD', 'PRESS', 'MEDIA', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
);

DROP POLICY IF EXISTS "EB can update media status" ON public.media_gallery;
CREATE POLICY "EB can update media status"
ON public.media_gallery FOR UPDATE
TO authenticated
USING (
  public.get_my_role() IN ('EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
);
