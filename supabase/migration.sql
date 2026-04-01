-- BILLMUN Database Migration
-- Run this in Supabase SQL Editor to set up all required tables and columns

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'DELEGATE',
  status TEXT NOT NULL DEFAULT 'PENDING',
  profile_image_url TEXT,
  phone_number TEXT,
  has_completed_onboarding BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media Gallery table
CREATE TABLE IF NOT EXISTS media_gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uploader_id UUID REFERENCES users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  caption TEXT,
  title TEXT,
  media_type TEXT,
  mime_type TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  committee_tag TEXT,
  event_tag TEXT,
  is_hidden BOOLEAN DEFAULT FALSE,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Press Releases table
CREATE TABLE IF NOT EXISTS press_releases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  is_hidden BOOLEAN DEFAULT FALSE,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conference Config table
CREATE TABLE IF NOT EXISTS conference_config (
  id TEXT PRIMARY KEY DEFAULT '1',
  manual_override TEXT, -- 'OPEN', 'CLOSED', or null
  post_conference_message TEXT DEFAULT 'The conference has concluded. Thank you for participating!',
  countdown_target TIMESTAMP WITH TIME ZONE, -- For countdown timer
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conference Windows table (for AUTO mode schedule)
CREATE TABLE IF NOT EXISTS conference_windows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency Sessions table
CREATE TABLE IF NOT EXISTS emergency_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conference Settings table (for maintenance mode)
CREATE TABLE IF NOT EXISTS conference_settings (
  id TEXT PRIMARY KEY DEFAULT '1',
  maintenance_mode BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schedule Events table
CREATE TABLE IF NOT EXISTS schedule_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name TEXT NOT NULL,
  location TEXT,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Committee Resources table
CREATE TABLE IF NOT EXISTS committee_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  committee_id UUID,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add countdown_target column if it doesn't exist
ALTER TABLE conference_config ADD COLUMN IF NOT EXISTS countdown_target TIMESTAMP WITH TIME ZONE;
ALTER TABLE conference_config ADD COLUMN IF NOT EXISTS post_conference_message TEXT DEFAULT 'The conference has concluded. Thank you for participating!';

-- Insert default conference config with countdown target: April 3, 2026 12:30 PM KSA (UTC+3)
INSERT INTO conference_config (id, countdown_target, post_conference_message) 
VALUES ('1', '2026-04-03 09:30:00+00', 'The conference has concluded. Thank you for participating!')
ON CONFLICT (id) DO UPDATE SET countdown_target = EXCLUDED.countdown_target;

-- Insert default conference settings
INSERT INTO conference_settings (id, maintenance_mode) 
VALUES ('1', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_media_gallery_status ON media_gallery(status);
CREATE INDEX IF NOT EXISTS idx_media_gallery_uploader ON media_gallery(uploader_id);
CREATE INDEX IF NOT EXISTS idx_media_gallery_created ON media_gallery(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_press_releases_status ON press_releases(status);
CREATE INDEX IF NOT EXISTS idx_press_releases_author ON press_releases(author_id);
CREATE INDEX IF NOT EXISTS idx_press_releases_created ON press_releases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_conference_windows_start ON conference_windows(start_time);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE press_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conference_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users (simplified for admin-only access via API)
CREATE POLICY "Allow all" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON media_gallery FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON press_releases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON emergency_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON conference_windows FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON schedule_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON committee_resources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON conference_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON conference_settings FOR ALL USING (true) WITH CHECK (true);
