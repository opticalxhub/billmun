-- =====================================================
-- Conference Ready Final Migration
-- =====================================================

-- 1. Create issue_reports table
CREATE TABLE IF NOT EXISTS public.issue_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL, -- PORTAL, IN_PERSON, MEDICAL
    issue_type TEXT NOT NULL,
    description TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    user_details JSONB NOT NULL, -- snapshot of user details at time of report
    metadata JSONB DEFAULT '{}'::jsonb, -- dynamic fields based on category
    status TEXT DEFAULT 'PENDING', -- PENDING, REVIEWED, RESOLVED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create schedule_events table (Official Conference Schedule)
CREATE TABLE IF NOT EXISTS public.schedule_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    day_label TEXT NOT NULL,
    event_name TEXT NOT NULL,
    location TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT,
    applicable_roles TEXT[] DEFAULT ARRAY[]::TEXT[],
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Create committee_schedules table (Committee-specific timeline)
CREATE TABLE IF NOT EXISTS public.committee_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    location TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Update conference_settings with WhatsApp field
ALTER TABLE public.conference_settings 
ADD COLUMN IF NOT EXISTS whatsapp_group_link TEXT;

-- 5. Add missing columns to users if any (Double-checking registration fields)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT,
ADD COLUMN IF NOT EXISTS preferred_committee TEXT,
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_analyses_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_analyses_reset_date DATE;

-- 6. Ensure delegate_presence_statuses exists (used for live tracking)
CREATE TABLE IF NOT EXISTS public.delegate_presence_statuses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    committee_id UUID REFERENCES public.committees(id) ON DELETE SET NULL,
    current_status TEXT DEFAULT 'Absent', -- Absent, Present In Session, etc.
    last_changed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    last_changed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Add mass_emails table if missing
CREATE TABLE IF NOT EXISTS public.mass_emails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    recipient_count INTEGER NOT NULL,
    sent_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. Enable RLS and add basic policies
ALTER TABLE public.issue_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.committee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delegate_presence_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mass_emails ENABLE ROW LEVEL SECURITY;

-- Allow all for now to ensure conference flows aren't blocked by RLS misconfig
-- In a real prod env, these would be restricted by role
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.issue_reports;
CREATE POLICY "Enable all for authenticated users" ON public.issue_reports FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable read for all" ON public.schedule_events;
CREATE POLICY "Enable read for all" ON public.schedule_events FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable all for EB" ON public.schedule_events;
CREATE POLICY "Enable all for EB" ON public.schedule_events FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable read for all" ON public.committee_schedules;
CREATE POLICY "Enable read for all" ON public.committee_schedules FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.committee_schedules;
CREATE POLICY "Enable all for authenticated" ON public.committee_schedules FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all for authenticated" ON public.delegate_presence_statuses;
CREATE POLICY "Enable all for authenticated" ON public.delegate_presence_statuses FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all for authenticated" ON public.mass_emails;
CREATE POLICY "Enable all for authenticated" ON public.mass_emails FOR ALL USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_issue_reports_status ON public.issue_reports(status);
CREATE INDEX IF NOT EXISTS idx_issue_reports_category ON public.issue_reports(category);
CREATE INDEX IF NOT EXISTS idx_schedule_events_start ON public.schedule_events(start_time);
CREATE INDEX IF NOT EXISTS idx_committee_schedules_committee ON public.committee_schedules(committee_id);
