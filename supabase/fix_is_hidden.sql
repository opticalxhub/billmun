-- Quick Fix: Add missing is_hidden columns
-- Run this in Supabase SQL Editor if you get "column is_hidden does not exist" error

-- Add is_hidden column to media_gallery if it doesn't exist
ALTER TABLE media_gallery ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;

-- Add is_hidden column to press_releases if it doesn't exist  
ALTER TABLE press_releases ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_media_gallery_hidden ON media_gallery(is_hidden);
CREATE INDEX IF NOT EXISTS idx_press_releases_hidden ON press_releases(is_hidden);
