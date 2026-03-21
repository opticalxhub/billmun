-- Add SECURITY to UserRole enum if not already present
DO $$ BEGIN
  ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SECURITY';
EXCEPTION WHEN others THEN NULL;
END $$;

-- Add auto_approve_registrations to conference_settings
ALTER TABLE public.conference_settings ADD COLUMN IF NOT EXISTS auto_approve_registrations BOOLEAN DEFAULT false;

-- Roll call records
CREATE TABLE IF NOT EXISTS public.roll_call_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.committee_sessions(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.roll_call_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    roll_call_id UUID NOT NULL REFERENCES public.roll_call_records(id) ON DELETE CASCADE,
    delegate_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES public.committee_assignments(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'ABSENT', -- ABSENT, PRESENT, PRESENT_AND_VOTING
    UNIQUE(roll_call_id, delegate_id)
);

-- Speakers list
CREATE TABLE IF NOT EXISTS public.speakers_list (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.committee_sessions(id) ON DELETE SET NULL,
    delegate_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'QUEUED', -- QUEUED, SPEAKING, COMPLETED, YIELDED
    speaking_time_limit INTEGER DEFAULT 120, -- seconds
    actual_speaking_time INTEGER DEFAULT 0, -- seconds
    yield_type TEXT, -- null, 'DELEGATE', 'CHAIR', 'QUESTIONS'
    yield_to_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Points and motions
CREATE TABLE IF NOT EXISTS public.points_and_motions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.committee_sessions(id) ON DELETE SET NULL,
    delegate_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL, -- POINT_OF_ORDER, POINT_OF_INFORMATION, POINT_OF_PERSONAL_PRIVILEGE, MOTION_TO_OPEN_DEBATE, MOTION_TO_CLOSE_DEBATE, MOTION_TO_SUSPEND, MOTION_TO_ADJOURN, MOTION_FOR_MODERATED_CAUCUS, MOTION_FOR_UNMODERATED_CAUCUS, MOTION_TO_TABLE, MOTION_TO_INTRODUCE_DRAFT
    description TEXT,
    outcome TEXT, -- PASSED, FAILED, RULED_OUT_OF_ORDER, WITHDRAWN
    votes_for INTEGER DEFAULT 0,
    votes_against INTEGER DEFAULT 0,
    votes_abstain INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Session event log (chronological record of everything)
CREATE TABLE IF NOT EXISTS public.session_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.committee_sessions(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL, -- STATUS_CHANGE, MOTION, SPEAKER, TIMER, ROLL_CALL, ANNOUNCEMENT, DOCUMENT_REVIEW
    title TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Timer log
CREATE TABLE IF NOT EXISTS public.timer_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.committee_sessions(id) ON DELETE SET NULL,
    label TEXT,
    set_duration INTEGER NOT NULL, -- seconds
    actual_duration INTEGER DEFAULT 0, -- seconds
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Delegate performance ratings (chair private)
CREATE TABLE IF NOT EXISTS public.delegate_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
    delegate_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rated_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    argumentation_quality INTEGER DEFAULT 0 CHECK (argumentation_quality >= 0 AND argumentation_quality <= 5),
    diplomacy INTEGER DEFAULT 0 CHECK (diplomacy >= 0 AND diplomacy <= 5),
    preparation INTEGER DEFAULT 0 CHECK (preparation >= 0 AND preparation <= 5),
    private_notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(committee_id, delegate_id, rated_by)
);

-- Best delegate nominees
CREATE TABLE IF NOT EXISTS public.best_delegate_nominees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
    delegate_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    nominated_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    justification TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(committee_id, delegate_id, nominated_by)
);

-- Chair preparation checklist
CREATE TABLE IF NOT EXISTS public.chair_preparation (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
    chair_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    checklist JSONB DEFAULT '{}',
    research_notes JSONB DEFAULT '[]',
    country_positions JSONB DEFAULT '[]',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(committee_id, chair_id)
);

-- Status change details (for moderated caucus topic, break type, etc.)
CREATE TABLE IF NOT EXISTS public.status_change_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.committee_sessions(id) ON DELETE SET NULL,
    new_status TEXT NOT NULL,
    debate_topic TEXT,
    speaking_time_limit INTEGER,
    duration INTEGER, -- minutes
    purpose TEXT,
    break_type TEXT,
    session_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Add chairId to committees if not present
ALTER TABLE public.committees ADD COLUMN IF NOT EXISTS chair_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Enable realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.speakers_list;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.roll_call_entries;
