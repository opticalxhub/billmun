-- 1. Helper for role checking (idempotent)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  SELECT role::text FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 2. Sync Trigger: Automatically update committees.chair_id/co_chair_id
-- When a committee_assignment is created or updated, if the user is a CHAIR or CO_CHAIR, 
-- update the corresponding field in the committees table.
CREATE OR REPLACE FUNCTION public.sync_committee_leaders()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Get the role of the user being assigned
    SELECT role::text INTO user_role FROM public.users WHERE id = NEW.user_id;

    IF user_role = 'CHAIR' THEN
        UPDATE public.committees 
        SET chair_id = NEW.user_id 
        WHERE id = NEW.committee_id;
    ELSIF user_role = 'CO_CHAIR' THEN
        UPDATE public.committees 
        SET co_chair_id = NEW.user_id 
        WHERE id = NEW.committee_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_committee_leaders ON public.committee_assignments;
CREATE TRIGGER tr_sync_committee_leaders
AFTER INSERT OR UPDATE ON public.committee_assignments
FOR EACH ROW EXECUTE FUNCTION public.sync_committee_leaders();

-- 3. Comprehensive RLS Update for CO_CHAIR parity
-- Update policies that might have missed CO_CHAIR

-- documents
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
CREATE POLICY "Users can view own documents" 
ON public.documents FOR SELECT 
TO authenticated 
USING (user_id = auth.uid() OR user_id = '00000000-0000-0000-0000-000000000000' OR public.get_my_role() IN ('EXECUTIVE_BOARD', 'ADMIN', 'CHAIR', 'CO_CHAIR', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL'));

DROP POLICY IF EXISTS "Users can upload documents" ON public.documents;
CREATE POLICY "Users can upload documents" 
ON public.documents FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000' OR public.get_my_role() IN ('EXECUTIVE_BOARD', 'ADMIN', 'CHAIR', 'CO_CHAIR', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL'));

DROP POLICY IF EXISTS "Chairs can manage documents" ON public.documents;
CREATE POLICY "Chairs can manage documents"
ON public.documents FOR ALL
TO authenticated
USING (
    public.get_my_role() IN ('CHAIR', 'CO_CHAIR', 'ADMIN', 'EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
);

-- committee_sessions
-- Ensure CO_CHAIR can update session status
ALTER TABLE public.committee_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Chairs can manage sessions" ON public.committee_sessions;
CREATE POLICY "Chairs can manage sessions"
ON public.committee_sessions FOR ALL
TO authenticated
USING (
    public.get_my_role() IN ('CHAIR', 'CO_CHAIR', 'ADMIN', 'EXECUTIVE_BOARD')
);

-- speakers_list
ALTER TABLE public.speakers_list ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Chairs can manage speakers" ON public.speakers_list;
CREATE POLICY "Chairs can manage speakers"
ON public.speakers_list FOR ALL
TO authenticated
USING (
    public.get_my_role() IN ('CHAIR', 'CO_CHAIR', 'ADMIN', 'EXECUTIVE_BOARD')
);

-- committee_resources
-- Already updated in comprehensive_fixes but double check
DROP POLICY IF EXISTS "Admin and EB can manage committee resources" ON public.committee_resources;
CREATE POLICY "Admin and EB can manage committee resources"
ON public.committee_resources FOR ALL
TO authenticated
USING (
    public.get_my_role() IN ('ADMIN', 'EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL', 'CHAIR', 'CO_CHAIR')
);

-- 4. Audit Log fixes
-- Ensure EB/Admin/Chair can see all audit logs for their context
DROP POLICY IF EXISTS "EB and Admin can view all audit logs" ON public.audit_logs;
CREATE POLICY "EB and Admin can view all audit logs" 
ON public.audit_logs FOR SELECT 
TO authenticated 
USING (public.get_my_role() IN ('EXECUTIVE_BOARD', 'ADMIN', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL', 'SECURITY', 'CHAIR', 'CO_CHAIR'));

-- 5. Force schema cache reload
NOTIFY pgrst, 'reload schema';
