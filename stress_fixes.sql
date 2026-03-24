-- Migration: Sync schema names for stress testing across frontend and backend

-- 1. resolutions
ALTER TABLE public.resolutions ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT false;
ALTER TABLE public.resolutions ADD COLUMN IF NOT EXISTS manual_content TEXT DEFAULT '';

-- 2. delegate_presence_statuses
ALTER TABLE public.delegate_presence_statuses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PRESENT';
ALTER TABLE public.delegate_presence_statuses DROP COLUMN IF EXISTS current_status;

-- 3. admin_chair_notes
ALTER TABLE public.admin_chair_notes ADD COLUMN IF NOT EXISTS content TEXT DEFAULT '';
ALTER TABLE public.admin_chair_notes DROP COLUMN IF EXISTS note_text;
ALTER TABLE public.admin_chair_notes ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- 4. digital_passes (add if missing to test security)
CREATE TABLE IF NOT EXISTS public.digital_passes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    issue_date TIMESTAMP DEFAULT now()
);

-- 5. security_scans (add if missing to test security)
CREATE TABLE IF NOT EXISTS public.security_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passthrough_id UUID REFERENCES public.digital_passes(id) ON DELETE CASCADE,
    scanner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status TEXT,
    scanned_at TIMESTAMP DEFAULT now()
);
