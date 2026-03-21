-- Admin dashboard committee-assistant data model

CREATE TABLE IF NOT EXISTS public.delegate_presence_statuses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    current_status TEXT NOT NULL,
    last_changed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    last_changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    note TEXT,
    UNIQUE(committee_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.delegate_presence_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    changed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    note TEXT
);

CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_start TIMESTAMP WITH TIME ZONE NOT NULL,
    session_end TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'PRESENT',
    corrected_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    correction_note TEXT,
    corrected_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.committee_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    archived BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.document_chair_flags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
    flagged_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    resolved BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.committee_announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    sent_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    read_count INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.committee_vote_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
    motion_type TEXT NOT NULL,
    outcome TEXT NOT NULL,
    votes_for INT DEFAULT 0,
    votes_against INT DEFAULT 0,
    abstentions INT DEFAULT 0,
    recorded_votes JSONB DEFAULT '[]'::jsonb,
    recorded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.committee_seating_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    seat_label TEXT NOT NULL,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(committee_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.admin_chair_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE UNIQUE,
    admin_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    chair_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    note_text TEXT DEFAULT '',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delegate_presence_statuses_committee ON public.delegate_presence_statuses(committee_id);
CREATE INDEX IF NOT EXISTS idx_delegate_presence_history_committee_user ON public.delegate_presence_history(committee_id, user_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_records_committee_user ON public.attendance_records(committee_id, user_id, session_start DESC);
CREATE INDEX IF NOT EXISTS idx_committee_resources_committee ON public.committee_resources(committee_id, archived);
CREATE INDEX IF NOT EXISTS idx_document_chair_flags_committee ON public.document_chair_flags(committee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_committee_announcements_committee ON public.committee_announcements(committee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_committee_vote_records_committee ON public.committee_vote_records(committee_id, created_at DESC);

ALTER TABLE public.delegate_presence_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delegate_presence_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.committee_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chair_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.committee_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.committee_vote_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.committee_seating_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_chair_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for now" ON public.delegate_presence_statuses;
CREATE POLICY "Enable all access for now" ON public.delegate_presence_statuses FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all access for now" ON public.delegate_presence_history;
CREATE POLICY "Enable all access for now" ON public.delegate_presence_history FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all access for now" ON public.attendance_records;
CREATE POLICY "Enable all access for now" ON public.attendance_records FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all access for now" ON public.committee_resources;
CREATE POLICY "Enable all access for now" ON public.committee_resources FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all access for now" ON public.document_chair_flags;
CREATE POLICY "Enable all access for now" ON public.document_chair_flags FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all access for now" ON public.committee_announcements;
CREATE POLICY "Enable all access for now" ON public.committee_announcements FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all access for now" ON public.committee_vote_records;
CREATE POLICY "Enable all access for now" ON public.committee_vote_records FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all access for now" ON public.committee_seating_assignments;
CREATE POLICY "Enable all access for now" ON public.committee_seating_assignments FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all access for now" ON public.admin_chair_notes;
CREATE POLICY "Enable all access for now" ON public.admin_chair_notes FOR ALL USING (true);
