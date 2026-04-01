-- ============================================================
-- Migration: Conference readiness system + Contact submissions
-- Tables: conference_config, conference_windows, contact_submissions
-- ============================================================

-- Conference configuration (singleton row, id = '1')
CREATE TABLE IF NOT EXISTS conference_config (
  id TEXT PRIMARY KEY DEFAULT '1',
  manual_override TEXT CHECK (manual_override IN ('OPEN', 'CLOSED') OR manual_override IS NULL),
  post_conference_message TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default row if not exists
INSERT INTO conference_config (id, manual_override, post_conference_message)
VALUES ('1', NULL, '')
ON CONFLICT (id) DO NOTHING;

-- Conference time windows (when the portal is open for non-EB users)
CREATE TABLE IF NOT EXISTS conference_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL DEFAULT '',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert the two default windows (April 3-4 2026, Riyadh time UTC+3)
INSERT INTO conference_windows (label, start_time, end_time) VALUES
  ('Day 1', '2026-04-03T12:30:00+03:00', '2026-04-03T21:30:00+03:00'),
  ('Day 2', '2026-04-04T07:00:00+03:00', '2026-04-04T19:30:00+03:00');

-- Contact form submissions (from /contact page)
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'READ', 'REPLIED', 'ARCHIVED')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
-- conference_config: read for everyone, write for authenticated (EB enforced at API level)
ALTER TABLE conference_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conference_config_read" ON conference_config FOR SELECT USING (true);
CREATE POLICY "conference_config_write" ON conference_config FOR ALL USING (auth.role() = 'authenticated');

-- conference_windows: read for everyone, write for authenticated
ALTER TABLE conference_windows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conference_windows_read" ON conference_windows FOR SELECT USING (true);
CREATE POLICY "conference_windows_write" ON conference_windows FOR ALL USING (auth.role() = 'authenticated');

-- contact_submissions: insert for everyone (public form), read/update for authenticated
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contact_submissions_insert" ON contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "contact_submissions_read" ON contact_submissions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "contact_submissions_update" ON contact_submissions FOR UPDATE USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conference_windows_start ON conference_windows (start_time);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created ON contact_submissions (created_at DESC);
