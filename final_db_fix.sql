-- FINAL_COMPREHENSIVE_FIX.sql
-- Run this in Supabase SQL Editor to fix all synchronization and visibility issues.

-- 1. Create a helper for role checking if it doesn't exist
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  SELECT role::text FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 2. Fix committee_assignments RLS
ALTER TABLE public.committee_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view assignments" ON public.committee_assignments;
CREATE POLICY "Public can view assignments" 
ON public.committee_assignments FOR SELECT 
TO authenticated, anon 
USING (true);

DROP POLICY IF EXISTS "EB and Admin can manage assignments" ON public.committee_assignments;
CREATE POLICY "EB and Admin can manage assignments" 
ON public.committee_assignments FOR ALL 
TO authenticated 
USING (public.get_my_role() IN ('EXECUTIVE_BOARD', 'ADMIN', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL'))
WITH CHECK (public.get_my_role() IN ('EXECUTIVE_BOARD', 'ADMIN', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL'));

-- 3. Fix committees RLS (so delegates can see their committee name)
ALTER TABLE public.committees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view committees" ON public.committees;
CREATE POLICY "Anyone can view committees" 
ON public.committees FOR SELECT 
TO authenticated, anon 
USING (true);

-- 4. Fix documents RLS (allow uploads and viewing)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
CREATE POLICY "Users can view own documents" 
ON public.documents FOR SELECT 
TO authenticated 
USING (user_id = auth.uid() OR user_id = '00000000-0000-0000-0000-000000000000' OR public.get_my_role() IN ('EXECUTIVE_BOARD', 'ADMIN', 'CHAIR'));

DROP POLICY IF EXISTS "Users can upload documents" ON public.documents;
CREATE POLICY "Users can upload documents" 
ON public.documents FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000' OR public.get_my_role() IN ('EXECUTIVE_BOARD', 'ADMIN', 'CHAIR'));

-- 5. Storage policies for 'documents' bucket
-- Ensure the bucket exists and is public-read or has select policies
-- These usually need to be run as service role or via some UI, but we can try:
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true) ON CONFLICT (id) DO NOTHING;
END $$;

DROP POLICY IF EXISTS "Authenticated upload" ON storage.objects;
CREATE POLICY "Authenticated upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');

DROP POLICY IF EXISTS "Public read" ON storage.objects;
CREATE POLICY "Public read" ON storage.objects FOR SELECT TO authenticated, anon USING (bucket_id = 'documents');

-- 6. Fix for the "no committee" in EB dashboard refetch
-- The EB dashboard refetch uses client-side fetch.
-- Ensure EB users can select from users and committee_assignments freely.
DROP POLICY IF EXISTS "EB can view all users" ON public.users;
CREATE POLICY "EB can view all users" 
ON public.users FOR SELECT 
TO authenticated 
USING (public.get_my_role() IN ('EXECUTIVE_BOARD', 'ADMIN', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL') OR auth.uid() = id);

-- 7. Audit logs fallback user
INSERT INTO users (id, email, full_name, role, status)
VALUES ('00000000-0000-0000-0000-000000000000', 'emergency@billmun.online', 'Engineer (Emergency)', 'EXECUTIVE_BOARD', 'APPROVED')
ON CONFLICT DO NOTHING;

-- 8. Refresh schema cache
NOTIFY pgrst, 'reload schema';
