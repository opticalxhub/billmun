CREATE TABLE IF NOT EXISTS public.mass_emails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    recipient_count INT DEFAULT 0,
    sent_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.mass_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for now" ON public.mass_emails FOR ALL USING (true);
