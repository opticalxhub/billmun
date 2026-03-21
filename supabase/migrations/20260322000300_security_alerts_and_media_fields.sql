CREATE TABLE IF NOT EXISTS public.security_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    severity TEXT NOT NULL,
    message TEXT NOT NULL,
    sent_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for now" ON public.security_alerts;
CREATE POLICY "Enable all access for now" ON public.security_alerts FOR ALL USING (true);

ALTER TABLE public.media_gallery
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS committee_tag TEXT,
    ADD COLUMN IF NOT EXISTS event_tag TEXT,
    ADD COLUMN IF NOT EXISTS mime_type TEXT,
    ADD COLUMN IF NOT EXISTS file_size BIGINT,
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
