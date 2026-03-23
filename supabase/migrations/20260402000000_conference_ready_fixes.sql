-- =====================================================
-- Conference Ready Fixes Migration
-- Fixes discovered by cross-referencing live DB with code
-- =====================================================

-- 1. Fix user_notes: add note_type, updated_at columns + unique constraint
-- The notepad component queries .eq('note_type', ...) and upserts with onConflict: 'user_id,note_type'
-- but these columns don't exist in the DB, causing silent failures
ALTER TABLE public.user_notes ADD COLUMN IF NOT EXISTS note_type TEXT DEFAULT 'GENERAL';
ALTER TABLE public.user_notes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add unique constraint for upsert to work (user_id + note_type)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_notes_user_id_note_type_key'
    ) THEN
        ALTER TABLE public.user_notes ADD CONSTRAINT user_notes_user_id_note_type_key UNIQUE (user_id, note_type);
    END IF;
END $$;

-- 2. Fix committee_sessions: add created_at column
-- Code orders by created_at but column doesn't exist (only updated_at)
ALTER TABLE public.committee_sessions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 3. Fix blocs: add channel_id column
-- BlocsTab and ResolutionBuilderTab select blocs(name, channel_id) but column doesn't exist
ALTER TABLE public.blocs ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES public.channels(id) ON DELETE SET NULL;

-- 4. Ensure RLS is enabled with proper policies on all delegate-facing tables
-- Many tables were created from CamelCase migrations without RLS

-- speeches
DO $$
BEGIN
    ALTER TABLE public.speeches ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can manage own speeches" ON public.speeches;
    CREATE POLICY "Users can manage own speeches"
    ON public.speeches FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- bloc_messages
DO $$
BEGIN
    ALTER TABLE public.bloc_messages ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Bloc members can access messages" ON public.bloc_messages;
    CREATE POLICY "Bloc members can access messages"
    ON public.bloc_messages FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.bloc_members bm
            WHERE bm.bloc_id = bloc_messages.bloc_id AND bm.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.bloc_members bm
            WHERE bm.bloc_id = bloc_messages.bloc_id AND bm.user_id = auth.uid()
        )
    );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- bloc_documents
DO $$
BEGIN
    ALTER TABLE public.bloc_documents ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Bloc members can access documents" ON public.bloc_documents;
    CREATE POLICY "Bloc members can access documents"
    ON public.bloc_documents FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.bloc_members bm
            WHERE bm.bloc_id = bloc_documents.bloc_id AND bm.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.bloc_members bm
            WHERE bm.bloc_id = bloc_documents.bloc_id AND bm.user_id = auth.uid()
        )
    );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- strategy_board
DO $$
BEGIN
    ALTER TABLE public.strategy_board ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Bloc members can access strategy board" ON public.strategy_board;
    CREATE POLICY "Bloc members can access strategy board"
    ON public.strategy_board FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.bloc_members bm
            WHERE bm.bloc_id = strategy_board.bloc_id AND bm.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.bloc_members bm
            WHERE bm.bloc_id = strategy_board.bloc_id AND bm.user_id = auth.uid()
        )
    );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- strategy_board_private
DO $$
BEGIN
    ALTER TABLE public.strategy_board_private ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can manage own private strategy" ON public.strategy_board_private;
    CREATE POLICY "Users can manage own private strategy"
    ON public.strategy_board_private FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- resolutions
DO $$
BEGIN
    ALTER TABLE public.resolutions ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can manage own resolutions" ON public.resolutions;
    CREATE POLICY "Users can manage own resolutions"
    ON public.resolutions FOR ALL TO authenticated
    USING (
        user_id = auth.uid() OR
        public.get_my_role() IN ('CHAIR', 'CO_CHAIR', 'ADMIN', 'EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
    )
    WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- resolution_clauses
DO $$
BEGIN
    ALTER TABLE public.resolution_clauses ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can manage own resolution clauses" ON public.resolution_clauses;
    CREATE POLICY "Users can manage own resolution clauses"
    ON public.resolution_clauses FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.resolutions r
            WHERE r.id = resolution_clauses.resolution_id AND (
                r.user_id = auth.uid() OR
                public.get_my_role() IN ('CHAIR', 'CO_CHAIR', 'ADMIN', 'EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.resolutions r
            WHERE r.id = resolution_clauses.resolution_id AND r.user_id = auth.uid()
        )
    );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- stance_notes
DO $$
BEGIN
    ALTER TABLE public.stance_notes ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can manage own stance notes" ON public.stance_notes;
    CREATE POLICY "Users can manage own stance notes"
    ON public.stance_notes FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- document_versions
DO $$
BEGIN
    ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Authenticated can read document versions" ON public.document_versions;
    CREATE POLICY "Authenticated can read document versions"
    ON public.document_versions FOR SELECT TO authenticated
    USING (true);
    DROP POLICY IF EXISTS "Users can insert own document versions" ON public.document_versions;
    CREATE POLICY "Users can insert own document versions"
    ON public.document_versions FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.documents d
            WHERE d.id = document_versions.document_id AND d.user_id = auth.uid()
        )
    );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- document_status_history
DO $$
BEGIN
    ALTER TABLE public.document_status_history ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Authenticated can read doc status history" ON public.document_status_history;
    CREATE POLICY "Authenticated can read doc status history"
    ON public.document_status_history FOR SELECT TO authenticated
    USING (true);
    DROP POLICY IF EXISTS "Chairs and system can insert doc status history" ON public.document_status_history;
    CREATE POLICY "Chairs and system can insert doc status history"
    ON public.document_status_history FOR INSERT TO authenticated
    WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- country_research
DO $$
BEGIN
    ALTER TABLE public.country_research ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Enable all access for now" ON public.country_research;
    DROP POLICY IF EXISTS "Users can manage own country research" ON public.country_research;
    CREATE POLICY "Users can manage own country research"
    ON public.country_research FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- personal_tasks
DO $$
BEGIN
    ALTER TABLE public.personal_tasks ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Enable all access for now" ON public.personal_tasks;
    DROP POLICY IF EXISTS "Users can manage own tasks" ON public.personal_tasks;
    CREATE POLICY "Users can manage own tasks"
    ON public.personal_tasks FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- user_notes
DO $$
BEGIN
    ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Enable all access for now" ON public.user_notes;
    DROP POLICY IF EXISTS "Users can manage own notes" ON public.user_notes;
    CREATE POLICY "Users can manage own notes"
    ON public.user_notes FOR ALL TO authenticated
    USING (user_id = auth.uid() OR author_id = auth.uid())
    WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- 5. Performance indexes for delegate dashboard queries
CREATE INDEX IF NOT EXISTS idx_speeches_user ON public.speeches(user_id);
CREATE INDEX IF NOT EXISTS idx_bloc_members_user ON public.bloc_members(user_id);
CREATE INDEX IF NOT EXISTS idx_bloc_messages_bloc ON public.bloc_messages(bloc_id, created_at);
CREATE INDEX IF NOT EXISTS idx_bloc_documents_bloc ON public.bloc_documents(bloc_id);
CREATE INDEX IF NOT EXISTS idx_resolutions_user ON public.resolutions(user_id);
CREATE INDEX IF NOT EXISTS idx_resolution_clauses_resolution ON public.resolution_clauses(resolution_id, order_index);
CREATE INDEX IF NOT EXISTS idx_personal_tasks_user ON public.personal_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_country_research_user ON public.country_research(user_id);
CREATE INDEX IF NOT EXISTS idx_stance_notes_user ON public.stance_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_user_type ON public.user_notes(user_id, note_type);
CREATE INDEX IF NOT EXISTS idx_document_versions_doc ON public.document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_status_history_doc ON public.document_status_history(document_id);
CREATE INDEX IF NOT EXISTS idx_committee_sessions_committee ON public.committee_sessions(committee_id);
CREATE INDEX IF NOT EXISTS idx_strategy_board_bloc ON public.strategy_board(bloc_id);
CREATE INDEX IF NOT EXISTS idx_strategy_board_private_bloc_user ON public.strategy_board_private(bloc_id, user_id);

-- 6. Ensure blocs RLS is properly set (replace old permissive policy)
DO $$
BEGIN
    ALTER TABLE public.blocs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Enable all access for now" ON public.blocs;
    DROP POLICY IF EXISTS "Authenticated can read blocs" ON public.blocs;
    CREATE POLICY "Authenticated can read blocs"
    ON public.blocs FOR SELECT TO authenticated
    USING (true);
    DROP POLICY IF EXISTS "Members and creators can manage blocs" ON public.blocs;
    CREATE POLICY "Members and creators can manage blocs"
    ON public.blocs FOR ALL TO authenticated
    USING (
        creator_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.bloc_members bm WHERE bm.bloc_id = blocs.id AND bm.user_id = auth.uid()) OR
        public.get_my_role() IN ('ADMIN', 'EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
    );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- bloc_members RLS
DO $$
BEGIN
    ALTER TABLE public.bloc_members ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Enable all access for now" ON public.bloc_members;
    DROP POLICY IF EXISTS "Authenticated can manage bloc membership" ON public.bloc_members;
    CREATE POLICY "Authenticated can manage bloc membership"
    ON public.bloc_members FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- 7. Create missing tables referenced by code

-- session_status_history (used by CommandCenterTab)
CREATE TABLE IF NOT EXISTS public.session_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.committee_sessions(id) ON DELETE SET NULL,
    status TEXT NOT NULL,
    changed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.session_status_history ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    DROP POLICY IF EXISTS "Authenticated can access session history" ON public.session_status_history;
    CREATE POLICY "Authenticated can access session history"
    ON public.session_status_history FOR ALL TO authenticated
    USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_session_status_history_committee ON public.session_status_history(committee_id);

-- user_field_history (used by EB registrations)
CREATE TABLE IF NOT EXISTS public.user_field_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    old_value TEXT DEFAULT '',
    new_value TEXT DEFAULT '',
    changed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.user_field_history ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    DROP POLICY IF EXISTS "EB and admins can access field history" ON public.user_field_history;
    CREATE POLICY "EB and admins can access field history"
    ON public.user_field_history FOR ALL TO authenticated
    USING (
        public.get_my_role() IN ('ADMIN', 'EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
    )
    WITH CHECK (
        public.get_my_role() IN ('ADMIN', 'EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
    );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_user_field_history_user ON public.user_field_history(user_id);

-- 8. Force schema cache reload
NOTIFY pgrst, 'reload schema';
