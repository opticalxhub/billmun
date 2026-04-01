-- Fix missing columns in existing tables
-- Run this in Supabase SQL Editor

-- Fix media_gallery table
ALTER TABLE media_gallery ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;
ALTER TABLE media_gallery ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE media_gallery ADD COLUMN IF NOT EXISTS media_type TEXT;
ALTER TABLE media_gallery ADD COLUMN IF NOT EXISTS mime_type TEXT;
ALTER TABLE media_gallery ADD COLUMN IF NOT EXISTS committee_tag TEXT;
ALTER TABLE media_gallery ADD COLUMN IF NOT EXISTS event_tag TEXT;
ALTER TABLE media_gallery ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id);
ALTER TABLE media_gallery ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE media_gallery ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Fix press_releases table  
ALTER TABLE press_releases ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;
ALTER TABLE press_releases ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id);
ALTER TABLE press_releases ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE press_releases ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Fix users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_analyses_today INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_analyses_reset_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_committee TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS allocated_country TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Fix conference_config table
ALTER TABLE conference_config ADD COLUMN IF NOT EXISTS countdown_target TIMESTAMP WITH TIME ZONE;
ALTER TABLE conference_config ADD COLUMN IF NOT EXISTS post_conference_message TEXT DEFAULT 'The conference has concluded. Thank you for participating!';
ALTER TABLE conference_config ADD COLUMN IF NOT EXISTS manual_override TEXT;
ALTER TABLE conference_config ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE conference_config ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Insert default conference config
INSERT INTO conference_config (id, countdown_target, post_conference_message) 
VALUES ('1', '2026-04-03 09:30:00+00', 'The conference has concluded. Thank you for participating!')
ON CONFLICT (id) DO UPDATE SET 
  countdown_target = EXCLUDED.countdown_target,
  post_conference_message = EXCLUDED.post_conference_message;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_media_gallery_hidden ON media_gallery(is_hidden);
CREATE INDEX IF NOT EXISTS idx_press_releases_hidden ON press_releases(is_hidden);
CREATE INDEX IF NOT EXISTS idx_media_gallery_status ON media_gallery(status);
CREATE INDEX IF NOT EXISTS idx_media_gallery_created ON media_gallery(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_press_releases_status ON press_releases(status);
CREATE INDEX IF NOT EXISTS idx_press_releases_created ON press_releases(created_at DESC);
