-- Migration: Ensure SECURITY role exists in user_role enum
-- Date: 2026-03-22

-- 1. Update user_role enum to include SECURITY
-- Using a DO block to safely add the value if it doesn't exist
DO $$ BEGIN
  ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'SECURITY';
EXCEPTION WHEN others THEN NULL;
END $$;
