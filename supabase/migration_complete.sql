-- BILLMUN Complete Database Migration
-- Run this in Supabase SQL Editor to set up all required tables, columns, indexes, and policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE TABLES
-- ============================================

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'DELEGATE',
  status TEXT NOT NULL DEFAULT 'PENDING',
  profile_image_url TEXT,
  phone_number TEXT,
  has_completed_onboarding BOOLEAN DEFAULT FALSE,
  ai_analyses_today INTEGER DEFAULT 0,
  ai_analyses_reset_date DATE,
  preferred_committee TEXT,
  allocated_country TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conference Config table (for portal open/close settings)
CREATE TABLE IF NOT EXISTS conference_config (
  id TEXT PRIMARY KEY DEFAULT '1',
  manual_override TEXT, -- 'OPEN', 'CLOSED', or null
  post_conference_message TEXT DEFAULT 'The conference has concluded. Thank you for participating!',
  countdown_target TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conference Settings table (for maintenance mode, conference date)
CREATE TABLE IF NOT EXISTS conference_settings (
  id TEXT PRIMARY KEY DEFAULT '1',
  maintenance_mode BOOLEAN DEFAULT FALSE,
  conference_date DATE,
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

-- ============================================
-- MEDIA & PRESS TABLES
-- ============================================

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

-- Media Assets table (legacy/alternative storage)
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  status TEXT DEFAULT 'pending',
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

-- ============================================
-- COMMITTEE TABLES
-- ============================================

-- Committees table
CREATE TABLE IF NOT EXISTS committees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  abbreviation TEXT,
  description TEXT,
  chair_id UUID REFERENCES users(id),
  co_chair_id UUID REFERENCES users(id),
  topic_guide_url TEXT,
  rules_of_procedure_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Committee Assignments table
CREATE TABLE IF NOT EXISTS committee_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  committee_id UUID REFERENCES committees(id) ON DELETE CASCADE,
  country TEXT,
  role TEXT DEFAULT 'DELEGATE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, committee_id)
);

-- Committee Schedules table
CREATE TABLE IF NOT EXISTS committee_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  committee_id UUID REFERENCES committees(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  location TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Committee Resources table
CREATE TABLE IF NOT EXISTS committee_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  committee_id UUID REFERENCES committees(id) ON DELETE SET NULL,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SCHEDULE & EVENTS TABLES
-- ============================================

-- Schedule Events table
CREATE TABLE IF NOT EXISTS schedule_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name TEXT NOT NULL,
  location TEXT,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  description TEXT,
  day_label TEXT,
  applicable_roles TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Personal Tasks table
CREATE TABLE IF NOT EXISTS personal_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  due_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- DOCUMENTS & AI TABLES
-- ============================================

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT,
  mime_type TEXT,
  document_type TEXT,
  status TEXT DEFAULT 'PENDING',
  committee_id UUID REFERENCES committees(id) ON DELETE SET NULL,
  review_notes TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Feedback table
CREATE TABLE IF NOT EXISTS ai_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  feedback TEXT NOT NULL,
  analysis_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- MESSAGING TABLES
-- ============================================

-- Channels table
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'GENERAL', -- 'GENERAL', 'COMMITTEE', 'DEPARTMENT', 'DM'
  committee_id UUID REFERENCES committees(id) ON DELETE SET NULL,
  is_read_only BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Channel Members table
CREATE TABLE IF NOT EXISTS channel_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(channel_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'TEXT', -- 'TEXT', 'IMAGE', 'FILE', 'SYSTEM'
  file_url TEXT,
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message Reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, reaction)
);

-- Direct Messages table (for DM channels)
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- ============================================
-- NOTIFICATIONS & AUDIT TABLES
-- ============================================

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  link_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SECURITY & ACCESS TABLES
-- ============================================

-- Emergency Sessions table (for 911 access)
CREATE TABLE IF NOT EXISTS emergency_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security Badges table
CREATE TABLE IF NOT EXISTS security_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_number TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'ACTIVE', -- 'ACTIVE', 'LOST', 'REVOKED'
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  returned_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- ANNOUNCEMENTS & RESOURCES TABLES
-- ============================================

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,
  target_roles TEXT[], -- null = all roles
  target_committee_ids UUID[],
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp Links table
CREATE TABLE IF NOT EXISTS whatsapp_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_name TEXT NOT NULL,
  invite_url TEXT NOT NULL,
  target_roles TEXT[],
  target_committee_id UUID REFERENCES committees(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Insert default conference config with countdown target: April 3, 2026 12:30 PM KSA
INSERT INTO conference_config (id, countdown_target, post_conference_message) 
VALUES ('1', '2026-04-03 09:30:00+00', 'The conference has concluded. Thank you for participating!')
ON CONFLICT (id) DO UPDATE SET 
  countdown_target = EXCLUDED.countdown_target,
  post_conference_message = EXCLUDED.post_conference_message;

-- Insert default conference settings
INSERT INTO conference_settings (id, maintenance_mode, conference_date) 
VALUES ('1', FALSE, '2026-04-03')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at DESC);

-- Media indexes
CREATE INDEX IF NOT EXISTS idx_media_gallery_status ON media_gallery(status);
CREATE INDEX IF NOT EXISTS idx_media_gallery_uploader ON media_gallery(uploader_id);
CREATE INDEX IF NOT EXISTS idx_media_gallery_hidden ON media_gallery(is_hidden);
CREATE INDEX IF NOT EXISTS idx_media_gallery_created ON media_gallery(created_at DESC);

-- Press releases indexes
CREATE INDEX IF NOT EXISTS idx_press_releases_status ON press_releases(status);
CREATE INDEX IF NOT EXISTS idx_press_releases_author ON press_releases(author_id);
CREATE INDEX IF NOT EXISTS idx_press_releases_hidden ON press_releases(is_hidden);
CREATE INDEX IF NOT EXISTS idx_press_releases_created ON press_releases(created_at DESC);

-- Committee indexes
CREATE INDEX IF NOT EXISTS idx_committee_assignments_user ON committee_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_committee_assignments_committee ON committee_assignments(committee_id);
CREATE INDEX IF NOT EXISTS idx_committee_schedules_committee ON committee_schedules(committee_id);
CREATE INDEX IF NOT EXISTS idx_committee_schedules_start ON committee_schedules(start_time);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_committee ON documents(committee_id);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_channel_members_channel ON channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_user ON channel_members(user_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- Schedule indexes
CREATE INDEX IF NOT EXISTS idx_schedule_events_start ON schedule_events(start_time);
CREATE INDEX IF NOT EXISTS idx_personal_tasks_user ON personal_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_tasks_completed ON personal_tasks(is_completed);

-- Conference indexes
CREATE INDEX IF NOT EXISTS idx_conference_windows_start ON conference_windows(start_time);
CREATE INDEX IF NOT EXISTS idx_emergency_sessions_expires ON emergency_sessions(expires_at);

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conference_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE conference_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conference_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE press_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_links ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - ALLOW ALL (Server-side API handles authorization)
-- ============================================

CREATE POLICY "Allow all" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON conference_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON conference_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON conference_windows FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON media_gallery FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON media_assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON press_releases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON committees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON committee_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON committee_schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON committee_resources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON schedule_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON personal_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON ai_feedback FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON channels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON channel_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON message_reactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON direct_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON emergency_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON security_badges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON announcements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON whatsapp_links FOR ALL USING (true) WITH CHECK (true);
