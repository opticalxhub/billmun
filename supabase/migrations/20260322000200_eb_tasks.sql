CREATE TABLE IF NOT EXISTS public.eb_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'TODO',
    priority TEXT NOT NULL DEFAULT 'MEDIUM',
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    due_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.eb_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for now" ON public.eb_tasks;
CREATE POLICY "Enable all access for now" ON public.eb_tasks FOR ALL USING (true);
