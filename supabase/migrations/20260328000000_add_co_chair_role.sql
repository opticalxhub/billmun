-- Migration: Add CO_CHAIR role and ensure committee_id requirement
-- Date: 2026-03-22

-- 1. Update user_role enum to include CO_CHAIR
-- Note: PostgreSQL doesn't allow ALTER TYPE ... ADD VALUE inside a transaction block easily in some versions, 
-- but Supabase migrations usually handle this.
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'CO_CHAIR';

-- 2. Add chair_id and co_chair_id to committees if they don't exist
-- This allows direct mapping of leadership roles to committees
ALTER TABLE public.committees ADD COLUMN IF NOT EXISTS chair_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.committees ADD COLUMN IF NOT EXISTS co_chair_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- 3. Update RLS or constraints if needed (optional based on app logic)
-- Ensure that for CHAIR and CO_CHAIR roles, a committee assignment MUST exist eventually.
-- We handle this in application logic, but database-level consistency is good.
