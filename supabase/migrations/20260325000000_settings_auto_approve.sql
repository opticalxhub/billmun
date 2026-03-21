ALTER TABLE public.conference_settings 
ADD COLUMN IF NOT EXISTS auto_approve_registrations BOOLEAN DEFAULT false;
