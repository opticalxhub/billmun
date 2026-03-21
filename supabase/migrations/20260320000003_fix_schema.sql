-- Drop incorrect tables created by Prisma migration
DROP TABLE IF EXISTS "ConferenceSettings" CASCADE;
DROP TABLE IF EXISTS "AuditLog" CASCADE;
DROP TABLE IF EXISTS "PasswordResetToken" CASCADE;
DROP TABLE IF EXISTS "Notification" CASCADE;
DROP TABLE IF EXISTS "Announcement" CASCADE;
DROP TABLE IF EXISTS "AIFeedback" CASCADE;
DROP TABLE IF EXISTS "Document" CASCADE;
DROP TABLE IF EXISTS "CommitteeAssignment" CASCADE;
DROP TABLE IF EXISTS "Committee" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Drop existing lowercase tables if they exist
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS ai_feedback CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS committee_assignments CASCADE;
DROP TABLE IF EXISTS committees CASCADE;
DROP TABLE IF EXISTS conference_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop incorrect types
DROP TYPE IF EXISTS "UserRole" CASCADE;
DROP TYPE IF EXISTS "UserStatus" CASCADE;
DROP TYPE IF EXISTS "Grade" CASCADE;
DROP TYPE IF EXISTS "EmergencyContactRelation" CASCADE;
DROP TYPE IF EXISTS "CommitteeDifficulty" CASCADE;
DROP TYPE IF EXISTS "DocumentType" CASCADE;
DROP TYPE IF EXISTS "DocumentStatus" CASCADE;
DROP TYPE IF EXISTS "NotificationType" CASCADE;

-- Drop lowercase types if they exist (to avoid conflict)
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS document_type CASCADE;
DROP TYPE IF EXISTS document_status CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS difficulty CASCADE;

-- Create correct ENUM types
CREATE TYPE user_role AS ENUM ('DELEGATE', 'CHAIR', 'MEDIA', 'PRESS', 'EXECUTIVE_BOARD', 'ADMIN', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL');
CREATE TYPE user_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');
CREATE TYPE document_type AS ENUM ('POSITION_PAPER', 'SPEECH', 'RESOLUTION');
CREATE TYPE document_status AS ENUM ('PENDING', 'APPROVED', 'NEEDS_REVISION', 'REJECTED');
CREATE TYPE notification_type AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR');
CREATE TYPE difficulty AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  password_hash VARCHAR(255),
  date_of_birth DATE,
  grade VARCHAR(50),
  phone_number VARCHAR(20),
  emergency_contact_name VARCHAR(255),
  emergency_contact_relation VARCHAR(50),
  emergency_contact_phone VARCHAR(20),
  role user_role DEFAULT 'DELEGATE',
  status user_status DEFAULT 'PENDING',
  preferred_committee VARCHAR(255),
  allocated_country VARCHAR(100),
  approved_at TIMESTAMP,
  approved_by_id UUID,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Committees table
CREATE TABLE committees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  abbreviation VARCHAR(10) UNIQUE NOT NULL,
  topic TEXT,
  description TEXT,
  image_url VARCHAR(500),
  max_delegates INT DEFAULT 10,
  difficulty difficulty,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- Committee assignments
CREATE TABLE committee_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  committee_id UUID NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
  country VARCHAR(100),
  seat_number VARCHAR(10),
  assigned_at TIMESTAMP DEFAULT now(),
  assigned_by_id UUID,
  UNIQUE(user_id, committee_id)
);

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  committee_id UUID REFERENCES committees(id) ON DELETE SET NULL,
  type document_type,
  title VARCHAR(255),
  file_url VARCHAR(500),
  file_size BIGINT,
  mime_type VARCHAR(50),
  status document_status DEFAULT 'PENDING',
  feedback TEXT,
  uploaded_at TIMESTAMP DEFAULT now(),
  reviewed_at TIMESTAMP,
  reviewed_by_id UUID
);

-- AI Feedback
CREATE TABLE ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID UNIQUE NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  overall_score INT,
  argument_strength INT,
  research_depth INT,
  policy_alignment INT,
  writing_clarity INT,
  format_adherence INT,
  summary TEXT,
  strengths TEXT[],
  weaknesses TEXT[],
  suggestions TEXT[],
  annotated_segments JSONB,
  created_at TIMESTAMP DEFAULT now()
);

-- Announcements
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255),
  body TEXT,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_pinned BOOLEAN DEFAULT false,
  target_roles TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP DEFAULT now()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  message TEXT,
  type notification_type,
  is_read BOOLEAN DEFAULT false,
  link VARCHAR(500),
  created_at TIMESTAMP DEFAULT now()
);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255),
  target_type VARCHAR(100),
  target_id UUID,
  metadata JSONB,
  performed_at TIMESTAMP DEFAULT now()
);

-- Conference settings (singleton)
CREATE TABLE conference_settings (
  id VARCHAR(1) PRIMARY KEY DEFAULT '1',
  conference_name VARCHAR(255),
  conference_date DATE,
  conference_location VARCHAR(255),
  registration_open BOOLEAN DEFAULT true,
  portal_message TEXT,
  updated_at TIMESTAMP DEFAULT now(),
  updated_by_id UUID
);

-- Create indexes for common queries
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_announcements_created ON announcements(created_at DESC);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- Foreign keys mapping back to users
ALTER TABLE users ADD CONSTRAINT fk_users_approved_by FOREIGN KEY (approved_by_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE committee_assignments ADD CONSTRAINT fk_committee_assignments_assigned_by FOREIGN KEY (assigned_by_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE documents ADD CONSTRAINT fk_documents_reviewed_by FOREIGN KEY (reviewed_by_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE conference_settings ADD CONSTRAINT fk_conference_settings_updated_by FOREIGN KEY (updated_by_id) REFERENCES users(id) ON DELETE SET NULL;

-- Insert premade committees
INSERT INTO committees (name, abbreviation, max_delegates, is_active) VALUES
('United States Security Council', 'UNSC', 15, true),
('United Nations Educational and Cultural Organization', 'UNESCO', 47, true),
('United Nations Historical Committee', 'UNHC', 25, true),
('Disarmament and International Security Committee', 'DISEC', 100, true),
('Batman - The nightfall protocol', 'SPECIAL', 20, true),
('Crisis Committee', 'CRISIS', 20, true),
('Economic and Social Council', 'ECOSOC', 54, true),
('International Court of Justice', 'ICJ', 20, true);

-- Insert EB User
-- Note: You'll need to create this user in Supabase Auth first to get a real UUID
-- Email: EB@billmun.sa
-- Suggested Password: B1llMUN_2026_EB!
INSERT INTO users (id, email, full_name, role, status)
VALUES ('00000000-0000-0000-0000-000000000000', 'EB@billmun.sa', 'BillMUN Executive Board', 'EXECUTIVE_BOARD', 'APPROVED')
ON CONFLICT (email) DO UPDATE SET role = 'EXECUTIVE_BOARD', status = 'APPROVED';
