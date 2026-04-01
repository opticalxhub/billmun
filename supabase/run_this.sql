-- BILLMUN: Add missing columns to EXISTING tables
-- Safe to run multiple times. Only adds what's missing.

-- media_gallery
ALTER TABLE public.media_gallery ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;
ALTER TABLE public.media_gallery ADD COLUMN IF NOT EXISTS media_type TEXT;
ALTER TABLE public.media_gallery ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE public.media_gallery ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- press_releases
ALTER TABLE public.press_releases ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;
ALTER TABLE public.press_releases ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE public.press_releases ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- conference_config
ALTER TABLE public.conference_config ADD COLUMN IF NOT EXISTS countdown_target TIMESTAMPTZ;
ALTER TABLE public.conference_config ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Set countdown to April 3, 2026 12:30 PM KSA (09:30 UTC)
UPDATE public.conference_config SET countdown_target = '2026-04-03 09:30:00+00' WHERE id = '1';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_media_gallery_hidden ON public.media_gallery(is_hidden);
CREATE INDEX IF NOT EXISTS idx_press_releases_hidden ON public.press_releases(is_hidden);

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
