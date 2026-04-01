-- Migration: Add missing columns to existing tables
-- Run this after the initial migrations

-- ============================================
-- ADD COLUMNS TO EXISTING TABLES
-- ============================================

-- Add columns to media_gallery table
ALTER TABLE media_gallery 
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS media_type TEXT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS committee_tag TEXT,
  ADD COLUMN IF NOT EXISTS event_tag TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Add columns to press_releases table
ALTER TABLE press_releases 
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Add columns to conference_config table
ALTER TABLE conference_config 
  ADD COLUMN IF NOT EXISTS countdown_target TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Update conference_config with countdown target
UPDATE conference_config SET countdown_target = '2026-04-03 09:30:00+00' WHERE id = '1';

-- ============================================
-- CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_media_gallery_hidden ON media_gallery(is_hidden);
CREATE INDEX IF NOT EXISTS idx_media_gallery_status ON media_gallery(status);
CREATE INDEX IF NOT EXISTS idx_media_gallery_created ON media_gallery(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_press_releases_hidden ON press_releases(is_hidden);
CREATE INDEX IF NOT EXISTS idx_press_releases_status ON press_releases(status);
CREATE INDEX IF NOT EXISTS idx_press_releases_created ON press_releases(created_at DESC);
