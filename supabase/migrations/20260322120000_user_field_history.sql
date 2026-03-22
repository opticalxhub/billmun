-- EB registrations: audit trail for profile edits (run in Supabase SQL editor if migrations are not applied automatically)
CREATE TABLE IF NOT EXISTS public.user_field_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  old_value TEXT NOT NULL DEFAULT '',
  new_value TEXT NOT NULL DEFAULT '',
  changed_by_id UUID NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_field_history_user_field
  ON public.user_field_history (user_id, field_name, changed_at DESC);
