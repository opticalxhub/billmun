-- BILLMUN SUPABASE SCHEMA UPDATES
-- Run this in your Supabase SQL Editor to ensure all tables exist

-- 1. Committee Blocs (for Blocs & Resolutions section)
CREATE TABLE IF NOT EXISTS public.committee_blocs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    committee_id UUID REFERENCES public.committees(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    resolution_topic TEXT,
    stance TEXT,
    members TEXT[] DEFAULT '{}', -- Array of country names
    supporting_countries TEXT[] DEFAULT '{}',
    opposing_countries TEXT[] DEFAULT '{}',
    ai_analysis TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Delegate Statistics (for the spreadsheet section)
CREATE TABLE IF NOT EXISTS public.delegate_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    committee_id UUID REFERENCES public.committees(id) ON DELETE CASCADE,
    delegate_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    pois_asked INTEGER DEFAULT 0,
    pois_answered INTEGER DEFAULT 0,
    opening_speech_words INTEGER DEFAULT 0,
    opening_speech_minutes DECIMAL(5,2) DEFAULT 0.0,
    performance_score INTEGER DEFAULT 0, -- 0-100
    ai_performance_review TEXT,
    last_updated TIMESTAMPTZ DEFAULT now(),
    UNIQUE(committee_id, delegate_id)
);

-- 3. Ensure Documents table has AI analysis field if not already
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS ai_analysis_json JSONB;

-- 4. Create RLS Policies (Simple versions - adjust as needed)
ALTER TABLE public.committee_blocs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delegate_stats ENABLE ROW LEVEL SECURITY;

-- Allow Chairs and EB to manage blocs/stats
CREATE POLICY "Chairs and EB can manage blocs" ON public.committee_blocs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND role IN ('CHAIR', 'CO_CHAIR', 'EXECUTIVE_BOARD', 'ADMIN', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
        )
    );

CREATE POLICY "Delegates can view their own committee blocs" ON public.committee_blocs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.committee_assignments
            WHERE committee_assignments.user_id = auth.uid()
            AND committee_assignments.committee_id = committee_blocs.committee_id
        )
    );

CREATE POLICY "Chairs and EB can manage stats" ON public.delegate_stats
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND role IN ('CHAIR', 'CO_CHAIR', 'EXECUTIVE_BOARD', 'ADMIN', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
        )
    );

-- Enable realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.committee_blocs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.delegate_stats;
