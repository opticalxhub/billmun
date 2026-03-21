create table if not exists public.chair_ai_runs (
  id uuid primary key default gen_random_uuid(),
  chair_id uuid not null references public.users(id) on delete cascade,
  committee_id uuid references public.committees(id) on delete set null,
  tool text not null check (tool in ('working_paper', 'debate_quality', 'speech_evaluator')),
  input_text text not null,
  score integer not null default 0,
  summary text,
  sections jsonb not null default '[]'::jsonb,
  suggestions text[] not null default array[]::text[],
  created_at timestamp with time zone not null default now()
);

alter table public.chair_ai_runs enable row level security;

create policy if not exists "chair_ai_runs_select_owner_or_eb"
on public.chair_ai_runs
for select
to authenticated
using (
  chair_id = auth.uid()
  or exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.role in ('EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
  )
);
