-- Create EmergencySession table
CREATE TABLE IF NOT EXISTS public.emergency_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Allow reading/writing emergency sessions without RLS for now since it's an internal developer tool
ALTER TABLE public.emergency_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.emergency_sessions;
CREATE POLICY "Enable read access for all users" ON public.emergency_sessions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert access for all users" ON public.emergency_sessions;
CREATE POLICY "Enable insert access for all users" ON public.emergency_sessions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete access for all users" ON public.emergency_sessions;
CREATE POLICY "Enable delete access for all users" ON public.emergency_sessions FOR DELETE USING (true);
