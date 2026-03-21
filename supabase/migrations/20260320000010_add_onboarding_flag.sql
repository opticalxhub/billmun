ALTER TABLE users ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT false;
