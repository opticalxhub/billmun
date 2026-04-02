-- Remove applicable_roles column from schedule_events table
ALTER TABLE public.schedule_events DROP COLUMN IF EXISTS applicable_roles;

-- Note: committee_schedules table doesn't have applicable_roles, so no changes needed there
