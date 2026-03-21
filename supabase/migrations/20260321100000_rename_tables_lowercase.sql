-- =====================================================
-- Rename all PascalCase tables to lowercase_underscores
-- This ensures the Supabase JS client queries work correctly
-- Column names remain camelCase as-is
-- =====================================================

-- Core tables from initial schema
ALTER TABLE IF EXISTS "User" RENAME TO users;
ALTER TABLE IF EXISTS "Committee" RENAME TO committees;
ALTER TABLE IF EXISTS "CommitteeAssignment" RENAME TO committee_assignments;
ALTER TABLE IF EXISTS "Document" RENAME TO documents;
ALTER TABLE IF EXISTS "AIFeedback" RENAME TO ai_feedback;
ALTER TABLE IF EXISTS "Announcement" RENAME TO announcements;
ALTER TABLE IF EXISTS "Notification" RENAME TO notifications;
ALTER TABLE IF EXISTS "PasswordResetToken" RENAME TO password_reset_tokens;
ALTER TABLE IF EXISTS "AuditLog" RENAME TO audit_logs;
ALTER TABLE IF EXISTS "ConferenceSettings" RENAME TO conference_settings;

-- Delegate dashboard tables
ALTER TABLE IF EXISTS "CommitteeSession" RENAME TO committee_sessions;
ALTER TABLE IF EXISTS "Speech" RENAME TO speeches;
ALTER TABLE IF EXISTS "Bloc" RENAME TO blocs;
ALTER TABLE IF EXISTS "BlocMember" RENAME TO bloc_members;
ALTER TABLE IF EXISTS "BlocMessage" RENAME TO bloc_messages;
ALTER TABLE IF EXISTS "BlocDocument" RENAME TO bloc_documents;
ALTER TABLE IF EXISTS "StrategyBoard" RENAME TO strategy_board;
ALTER TABLE IF EXISTS "StrategyBoardPrivate" RENAME TO strategy_board_private;
ALTER TABLE IF EXISTS "Resolution" RENAME TO resolutions;
ALTER TABLE IF EXISTS "ResolutionClause" RENAME TO resolution_clauses;
ALTER TABLE IF EXISTS "PersonalTask" RENAME TO personal_tasks;
ALTER TABLE IF EXISTS "CountryResearch" RENAME TO country_research;
ALTER TABLE IF EXISTS "StanceNote" RENAME TO stance_notes;
ALTER TABLE IF EXISTS "DocumentVersion" RENAME TO document_versions;
ALTER TABLE IF EXISTS "DocumentStatusHistory" RENAME TO document_status_history;
ALTER TABLE IF EXISTS "ScheduleEvent" RENAME TO schedule_events;

-- Add missing columns to users table that the code references
ALTER TABLE users ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_committee TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS allocated_country TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN NOT NULL DEFAULT false;

-- Ensure the emergency_sessions table exists (used by /911 flow)
CREATE TABLE IF NOT EXISTS emergency_sessions (
    id TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    expires_at TIMESTAMP(3) NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
