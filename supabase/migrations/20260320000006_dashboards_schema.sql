-- Migration for extensive dashboard features (dashboards.txt)

-- Speech Drafts
CREATE TABLE IF NOT EXISTS public.speech_drafts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    word_count INT DEFAULT 0,
    speaking_time_seconds INT DEFAULT 0,
    is_active BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Blocs (Diplomatic Groups)
CREATE TABLE IF NOT EXISTS public.blocs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    committee_id UUID REFERENCES public.committees(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    invite_code VARCHAR(6) UNIQUE NOT NULL,
    strategy_board TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Bloc Members
CREATE TABLE IF NOT EXISTS public.bloc_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bloc_id UUID NOT NULL REFERENCES public.blocs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    individual_contribution TEXT,
    UNIQUE(bloc_id, user_id)
);

-- Resolution Drafts
CREATE TABLE IF NOT EXISTS public.resolution_drafts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    committee_id UUID REFERENCES public.committees(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    topic TEXT,
    sponsors TEXT[],
    signatories TEXT[],
    preambulatory_clauses JSONB DEFAULT '[]'::jsonb,
    operative_clauses JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'DRAFT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Country Research
CREATE TABLE IF NOT EXISTS public.country_research (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    committee_id UUID REFERENCES public.committees(id) ON DELETE CASCADE,
    country_profile TEXT,
    stance_tracker JSONB DEFAULT '{}'::jsonb,
    previous_resolutions TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, committee_id)
);

-- Personal Tasks
CREATE TABLE IF NOT EXISTS public.personal_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    notes TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Roll Calls
CREATE TABLE IF NOT EXISTS public.roll_calls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.committee_sessions(id) ON DELETE SET NULL,
    conducted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    quorum_established BOOLEAN DEFAULT false,
    attendance_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Timer Logs
CREATE TABLE IF NOT EXISTS public.timer_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
    label TEXT,
    set_duration_seconds INT NOT NULL,
    actual_duration_seconds INT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Points and Motions
CREATE TABLE IF NOT EXISTS public.points_and_motions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
    raised_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    outcome TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Delegate Performance
CREATE TABLE IF NOT EXISTS public.delegate_performance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
    speech_count INT DEFAULT 0,
    total_speaking_time INT DEFAULT 0,
    argumentation_quality INT CHECK (argumentation_quality >= 1 AND argumentation_quality <= 5),
    diplomacy_rating INT CHECK (diplomacy_rating >= 1 AND diplomacy_rating <= 5),
    preparation_rating INT CHECK (preparation_rating >= 1 AND preparation_rating <= 5),
    chair_notes TEXT,
    UNIQUE(user_id, committee_id)
);

-- Channels (Messaging)
CREATE TABLE IF NOT EXISTS public.channels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'COMMITTEE', 'DEPARTMENT', 'BLOC', 'CONFERENCE', 'DM'
    committee_id UUID REFERENCES public.committees(id) ON DELETE CASCADE,
    bloc_id UUID REFERENCES public.blocs(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Channel Members
CREATE TABLE IF NOT EXISTS public.channel_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(channel_id, user_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT,
    file_url TEXT,
    is_announcement BOOLEAN DEFAULT false,
    reactions JSONB DEFAULT '{}'::jsonb,
    reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Press Releases
CREATE TABLE IF NOT EXISTS public.press_releases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    target_committee_id UUID REFERENCES public.committees(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'PENDING',
    eb_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Enablement
ALTER TABLE public.speech_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bloc_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resolution_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roll_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timer_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_and_motions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delegate_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.press_releases ENABLE ROW LEVEL SECURITY;

-- Allow reading/writing all for now to ease development, will lock down later if needed
CREATE POLICY "Enable all access for now" ON public.speech_drafts FOR ALL USING (true);
CREATE POLICY "Enable all access for now" ON public.blocs FOR ALL USING (true);
CREATE POLICY "Enable all access for now" ON public.bloc_members FOR ALL USING (true);
CREATE POLICY "Enable all access for now" ON public.resolution_drafts FOR ALL USING (true);
CREATE POLICY "Enable all access for now" ON public.country_research FOR ALL USING (true);
CREATE POLICY "Enable all access for now" ON public.personal_tasks FOR ALL USING (true);
CREATE POLICY "Enable all access for now" ON public.roll_calls FOR ALL USING (true);
CREATE POLICY "Enable all access for now" ON public.timer_logs FOR ALL USING (true);
CREATE POLICY "Enable all access for now" ON public.points_and_motions FOR ALL USING (true);
CREATE POLICY "Enable all access for now" ON public.delegate_performance FOR ALL USING (true);
CREATE POLICY "Enable all access for now" ON public.channels FOR ALL USING (true);
CREATE POLICY "Enable all access for now" ON public.channel_members FOR ALL USING (true);
CREATE POLICY "Enable all access for now" ON public.messages FOR ALL USING (true);
CREATE POLICY "Enable all access for now" ON public.press_releases FOR ALL USING (true);
