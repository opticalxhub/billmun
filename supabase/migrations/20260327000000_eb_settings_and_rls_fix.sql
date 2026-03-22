-- Migration to synchronize conference_settings with EB dashboard requirements
-- and ensure proper RLS policies for Executive Board members

-- 1. Ensure conference_settings has all required columns
ALTER TABLE public.conference_settings ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN DEFAULT false;
ALTER TABLE public.conference_settings ADD COLUMN IF NOT EXISTS ai_analysis_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.conference_settings ADD COLUMN IF NOT EXISTS max_file_upload_mb INTEGER DEFAULT 10;
ALTER TABLE public.conference_settings ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT DEFAULT '+966 5X XXX XXXX';
ALTER TABLE public.conference_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 2. Seed initial settings if table is empty
INSERT INTO public.conference_settings (id, conference_name, conference_date, conference_location, registration_open, auto_approve_registrations, portal_message, maintenance_mode, ai_analysis_enabled, max_file_upload_mb, emergency_contact_phone)
VALUES ('1', 'BILLMUN 2026', '2026-03-27', 'Khobar, Saudi Arabia', true, false, 'Welcome to the official BILLMUN 2026 Attendees Portal.', false, true, 10, '+966 5X XXX XXXX')
ON CONFLICT (id) DO NOTHING;

-- 3. Reset and fix RLS for conference_settings
ALTER TABLE public.conference_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view settings" ON public.conference_settings;
CREATE POLICY "Public can view settings" 
ON public.conference_settings FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "EB and Admin can update settings" ON public.conference_settings;
CREATE POLICY "EB and Admin can update settings" 
ON public.conference_settings FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND (users.role = 'EXECUTIVE_BOARD' OR users.role = 'ADMIN')
  )
);

-- 4. Fix RLS for audit_logs to ensure EB can see them
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "EB and Admin can view all audit logs" ON public.audit_logs;
CREATE POLICY "EB and Admin can view all audit logs" 
ON public.audit_logs FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND (users.role = 'EXECUTIVE_BOARD' OR users.role = 'ADMIN')
  )
);

-- 5. Ensure users table allows EB to see all users (Fixes infinite loading/empty list)
-- Fixed to avoid infinite recursion by using auth.jwt() metadata
DROP POLICY IF EXISTS "EB and Admin can view all users" ON public.users;
CREATE POLICY "EB and Admin can view all users" 
ON public.users FOR SELECT 
TO authenticated
USING (
  (auth.jwt() ->> 'role') = 'EXECUTIVE_BOARD' OR 
  (auth.jwt() ->> 'role') = 'ADMIN' OR
  auth.uid() = id
);

