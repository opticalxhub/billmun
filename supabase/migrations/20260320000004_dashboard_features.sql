-- Migration to add dashboard features

-- 1. Delegate session status
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS session_status text DEFAULT 'PRESENT';
-- Possible values: 'PRESENT', 'MISSING', 'LAVATORY', 'EXCUSED'

-- 2. Committee Sessions (Timers, Caucuses, etc.)
CREATE TABLE IF NOT EXISTS public.committee_sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    committee_id uuid REFERENCES public.committees(id) ON DELETE CASCADE,
    current_topic text,
    caucus_type text, -- 'UNMODERATED', 'MODERATED', 'NONE'
    timer_ends_at timestamptz,
    timer_paused_at timestamptz,
    timer_duration_seconds integer,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Media Gallery (Press uploads)
CREATE TABLE IF NOT EXISTS public.media_gallery (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    uploader_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    media_url text NOT NULL,
    media_type text DEFAULT 'image', -- 'image' or 'video'
    status text DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    caption text,
    created_at timestamptz DEFAULT now()
);

-- 4. Speaker Lists (For chairs to manage)
CREATE TABLE IF NOT EXISTS public.speaker_lists (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    committee_id uuid REFERENCES public.committees(id) ON DELETE CASCADE,
    speaker_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    status text DEFAULT 'WAITING', -- 'WAITING', 'SPEAKING', 'DONE'
    spoken_time_seconds integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- 5. Documents / Resolution Drafts
CREATE TABLE IF NOT EXISTS public.documents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    committee_id uuid REFERENCES public.committees(id) ON DELETE CASCADE,
    uploader_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    title text NOT NULL,
    document_url text NOT NULL,
    document_type text, -- 'POSITION_PAPER', 'RESOLUTION', 'WORKING_PAPER'
    ai_analysis_result jsonb, -- Results from AI review
    created_at timestamptz DEFAULT now()
);

-- Create storage bucket for media if it doesn't exist (Has to be done via API or dashboard in Supabase usually, but we will assume it's created or we can just mock the URL for now or use Supabase storage)
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true) ON CONFLICT DO NOTHING;

-- RLS for committee_sessions
ALTER TABLE public.committee_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view committee_sessions" ON public.committee_sessions;
CREATE POLICY "Public can view committee_sessions" ON public.committee_sessions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Chairs and EB can insert/update committee_sessions" ON public.committee_sessions;
CREATE POLICY "Chairs and EB can insert/update committee_sessions" ON public.committee_sessions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role::text IN ('CHAIR', 'EXECUTIVE_BOARD', 'ADMIN'))
);

-- RLS for media_gallery
ALTER TABLE public.media_gallery ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view approved media" ON public.media_gallery;
CREATE POLICY "Public can view approved media" ON public.media_gallery FOR SELECT USING (status = 'APPROVED' OR EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role::text IN ('EXECUTIVE_BOARD', 'PRESS', 'MEDIA')));

DROP POLICY IF EXISTS "Press can upload media" ON public.media_gallery;
CREATE POLICY "Press can upload media" ON public.media_gallery FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role::text IN ('PRESS', 'MEDIA', 'EXECUTIVE_BOARD')));

DROP POLICY IF EXISTS "EB can update media status" ON public.media_gallery;
CREATE POLICY "EB can update media status" ON public.media_gallery FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role::text = 'EXECUTIVE_BOARD'));

-- RLS for speaker_lists
ALTER TABLE public.speaker_lists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view speaker lists" ON public.speaker_lists;
CREATE POLICY "Public can view speaker lists" ON public.speaker_lists FOR SELECT USING (true);

DROP POLICY IF EXISTS "Chairs can manage speaker lists" ON public.speaker_lists;
CREATE POLICY "Chairs can manage speaker lists" ON public.speaker_lists FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role::text IN ('CHAIR', 'EXECUTIVE_BOARD')));

-- RLS for documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Committee members can view documents" ON public.documents;
CREATE POLICY "Committee members can view documents" ON public.documents FOR SELECT USING (true);

DROP POLICY IF EXISTS "Delegates can upload documents" ON public.documents;
CREATE POLICY "Delegates can upload documents" ON public.documents FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Chairs can manage documents" ON public.documents;
CREATE POLICY "Chairs can manage documents" ON public.documents FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role::text IN ('CHAIR', 'EXECUTIVE_BOARD')));
