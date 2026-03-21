CREATE TABLE IF NOT EXISTS public.committee_admin_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    assigned_admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL DEFAULT 'MEDIUM',
    status TEXT NOT NULL DEFAULT 'TODO',
    due_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.committee_admin_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for now" ON public.committee_admin_tasks;
CREATE POLICY "Enable all access for now" ON public.committee_admin_tasks FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_committee_admin_tasks_committee ON public.committee_admin_tasks(committee_id, created_at DESC);
