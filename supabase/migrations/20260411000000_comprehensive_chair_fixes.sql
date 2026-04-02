-- ============================================================
-- Comprehensive fix migration for chair dashboard and all tabs
-- ============================================================

-- 1. delegate_stats table (DelegateStatsSpreadsheet)
CREATE TABLE IF NOT EXISTS public.delegate_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
    delegate_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    pois_asked INTEGER DEFAULT 0,
    pois_answered INTEGER DEFAULT 0,
    opening_speech_words INTEGER DEFAULT 0,
    opening_speech_minutes NUMERIC DEFAULT 0,
    performance_score INTEGER DEFAULT 0,
    ai_performance_review TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(committee_id, delegate_id)
);
ALTER TABLE public.delegate_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access delegate_stats" ON public.delegate_stats;
CREATE POLICY "Enable all access delegate_stats" ON public.delegate_stats FOR ALL USING (true) WITH CHECK (true);

-- 2. user_notes: add missing columns for Notepad component
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_notes' AND column_name='note_type') THEN
        ALTER TABLE public.user_notes ADD COLUMN note_type TEXT DEFAULT 'GENERAL';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_notes' AND column_name='updated_at') THEN
        ALTER TABLE public.user_notes ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
END $$;

-- Add unique constraint for upsert (user_id, note_type)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_notes_user_id_note_type_key'
    ) THEN
        ALTER TABLE public.user_notes ADD CONSTRAINT user_notes_user_id_note_type_key UNIQUE (user_id, note_type);
    END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Make content nullable for empty notes
ALTER TABLE public.user_notes ALTER COLUMN content DROP NOT NULL;

-- 3. Fix bloc_messages RLS — open access for authenticated users (chairs need oversight)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Bloc members can access messages" ON public.bloc_messages;
    DROP POLICY IF EXISTS "Bloc and chair access messages" ON public.bloc_messages;
    CREATE POLICY "Authenticated users can access bloc_messages"
    ON public.bloc_messages FOR ALL TO authenticated
    USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- 4. Fix blocs RLS to ensure chairs can see blocs
DO $$
BEGIN
    DROP POLICY IF EXISTS "Enable all access for now" ON public.blocs;
    CREATE POLICY "Enable all access blocs" ON public.blocs FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Enable all access for now" ON public.bloc_members;
    CREATE POLICY "Enable all access bloc_members" ON public.bloc_members FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN others THEN NULL;
END $$;

-- 5. Ensure committee_schedules table exists with correct schema
CREATE TABLE IF NOT EXISTS public.committee_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    event_type TEXT DEFAULT 'session',
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.committee_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access committee_schedules" ON public.committee_schedules;
CREATE POLICY "Enable all access committee_schedules" ON public.committee_schedules FOR ALL USING (true) WITH CHECK (true);

-- 6. Ensure schedule_events has correct RLS
DO $$
BEGIN
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.schedule_events;
    CREATE POLICY "Enable read access schedule_events" ON public.schedule_events FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Enable all access schedule_events" ON public.schedule_events;
    CREATE POLICY "Enable all access schedule_events" ON public.schedule_events FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN others THEN NULL;
END $$;

-- 7. Ensure announcements table has is_active column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='announcements' AND column_name='is_active') THEN
        ALTER TABLE public.announcements ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 8. Ensure committee_admin_tasks table exists
CREATE TABLE IF NOT EXISTS public.committee_admin_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    assigned_admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'MEDIUM',
    status TEXT DEFAULT 'TODO',
    due_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.committee_admin_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access committee_admin_tasks" ON public.committee_admin_tasks;
CREATE POLICY "Enable all access committee_admin_tasks" ON public.committee_admin_tasks FOR ALL USING (true) WITH CHECK (true);

-- 9. Ensure chair_preparation table has correct RLS
DO $$
BEGIN
    ALTER TABLE public.chair_preparation ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Enable all access chair_preparation" ON public.chair_preparation;
    CREATE POLICY "Enable all access chair_preparation" ON public.chair_preparation FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN others THEN NULL;
END $$;

-- 10. Add realtime for key tables
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.delegate_stats;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.committee_schedules;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bloc_messages;
EXCEPTION WHEN others THEN NULL;
END $$;

-- 11. Performance indexes
CREATE INDEX IF NOT EXISTS idx_delegate_stats_committee ON public.delegate_stats(committee_id);
CREATE INDEX IF NOT EXISTS idx_delegate_stats_delegate ON public.delegate_stats(delegate_id);
CREATE INDEX IF NOT EXISTS idx_committee_schedules_committee ON public.committee_schedules(committee_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_user_type ON public.user_notes(user_id, note_type);
CREATE INDEX IF NOT EXISTS idx_announcements_committee ON public.announcements(committee_id, is_active);
