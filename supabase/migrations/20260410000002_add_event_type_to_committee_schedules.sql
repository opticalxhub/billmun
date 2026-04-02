-- Add event_type column to committee_schedules table
ALTER TABLE public.committee_schedules ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'session';

-- Add check constraint to ensure only 'session' or 'break' values
ALTER TABLE public.committee_schedules ADD CONSTRAINT committee_schedules_event_type_check 
  CHECK (event_type IN ('session', 'break'));
