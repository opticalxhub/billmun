-- Fix RLS recursion properly by using a SECURITY DEFINER function to check roles
-- This avoids infinite recursion because SECURITY DEFINER functions run with the
-- privileges of the function owner (the database owner), bypassing RLS checks.

-- 1. Create a function to safely get the current user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  SELECT role::text FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 2. Update users table policies
DROP POLICY IF EXISTS "EB and Admin can view all users" ON public.users;
CREATE POLICY "EB and Admin can view all users" 
ON public.users FOR SELECT 
TO authenticated
USING (
  public.get_my_role() IN ('EXECUTIVE_BOARD', 'ADMIN') OR 
  auth.uid() = id
);

-- 3. Update committee_sessions policies
DROP POLICY IF EXISTS "Chairs and EB can insert/update committee_sessions" ON public.committee_sessions;
CREATE POLICY "Chairs and EB can insert/update committee_sessions" 
ON public.committee_sessions FOR ALL 
TO authenticated
USING (
  public.get_my_role() IN ('CHAIR', 'EXECUTIVE_BOARD', 'ADMIN')
);

-- 4. Update media_gallery policies
DROP POLICY IF EXISTS "Public can view approved media" ON public.media_gallery;
CREATE POLICY "Public can view approved media" 
ON public.media_gallery FOR SELECT 
TO authenticated
USING (
  status = 'APPROVED' OR 
  public.get_my_role() IN ('EXECUTIVE_BOARD', 'PRESS', 'MEDIA')
);

DROP POLICY IF EXISTS "Press can upload media" ON public.media_gallery;
CREATE POLICY "Press can upload media" 
ON public.media_gallery FOR INSERT 
TO authenticated
WITH CHECK (
  public.get_my_role() IN ('PRESS', 'MEDIA', 'EXECUTIVE_BOARD')
);

DROP POLICY IF EXISTS "EB can update media status" ON public.media_gallery;
CREATE POLICY "EB can update media status" 
ON public.media_gallery FOR UPDATE 
TO authenticated
USING (
  public.get_my_role() = 'EXECUTIVE_BOARD'
);

-- 5. Update speaker_lists policies
DROP POLICY IF EXISTS "Chairs can manage speaker lists" ON public.speaker_lists;
CREATE POLICY "Chairs can manage speaker lists" 
ON public.speaker_lists FOR ALL 
TO authenticated
USING (
  public.get_my_role() IN ('CHAIR', 'EXECUTIVE_BOARD')
);

-- 6. Update documents policies
DROP POLICY IF EXISTS "Chairs can manage documents" ON public.documents;
CREATE POLICY "Chairs can manage documents" 
ON public.documents FOR ALL 
TO authenticated
USING (
  public.get_my_role() IN ('CHAIR', 'EXECUTIVE_BOARD')
);

-- 7. Update conference_settings policies
DROP POLICY IF EXISTS "EB and Admin can update settings" ON public.conference_settings;
CREATE POLICY "EB and Admin can update settings" 
ON public.conference_settings FOR ALL 
TO authenticated
USING (
  public.get_my_role() IN ('EXECUTIVE_BOARD', 'ADMIN')
);

-- 8. Update audit_logs policies
DROP POLICY IF EXISTS "EB and Admin can view all audit logs" ON public.audit_logs;
CREATE POLICY "EB and Admin can view all audit logs" 
ON public.audit_logs FOR SELECT 
TO authenticated
USING (
  public.get_my_role() IN ('EXECUTIVE_BOARD', 'ADMIN')
);
