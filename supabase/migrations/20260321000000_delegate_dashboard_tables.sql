-- =====================================================
-- Delegate Dashboard Tables Migration
-- =====================================================

-- Add missing columns to existing tables
ALTER TABLE "Committee" ADD COLUMN IF NOT EXISTS "chairId" TEXT REFERENCES "User"("id");
ALTER TABLE "Committee" ADD COLUMN IF NOT EXISTS "backgroundGuideUrl" TEXT;
ALTER TABLE "Committee" ADD COLUMN IF NOT EXISTS "ropUrl" TEXT;
ALTER TABLE "Committee" ADD COLUMN IF NOT EXISTS "subTopics" TEXT[] DEFAULT '{}';

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "aiAnalysesToday" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "aiAnalysesResetDate" DATE;

ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "parentDocumentId" TEXT REFERENCES "Document"("id");

ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "committeeId" TEXT REFERENCES "Committee"("id");

-- Make AIFeedback.documentId NOT unique so we can store multiple analyses per user
-- and add a text-based analysis option
ALTER TABLE "AIFeedback" DROP CONSTRAINT IF EXISTS "AIFeedback_documentId_key";
ALTER TABLE "AIFeedback" ADD COLUMN IF NOT EXISTS "inputText" TEXT;
ALTER TABLE "AIFeedback" ADD COLUMN IF NOT EXISTS "diplomaticLanguage" INTEGER;
ALTER TABLE "AIFeedback" ADD COLUMN IF NOT EXISTS "persuasiveness" INTEGER;
ALTER TABLE "AIFeedback" ADD COLUMN IF NOT EXISTS "aiDetectionScore" INTEGER;
ALTER TABLE "AIFeedback" ADD COLUMN IF NOT EXISTS "aiDetectionPhrases" TEXT[];
ALTER TABLE "AIFeedback" ALTER COLUMN "documentId" DROP NOT NULL;

-- CommitteeSession: live session status per committee
CREATE TABLE IF NOT EXISTS "CommitteeSession" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "committeeId" TEXT NOT NULL REFERENCES "Committee"("id") ON DELETE CASCADE,
    "status" TEXT NOT NULL DEFAULT 'ADJOURNED',
    "debateTopic" TEXT,
    "speakingTimeLimit" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedById" TEXT REFERENCES "User"("id"),
    UNIQUE("committeeId")
);

-- Speech: delegate speech drafts
CREATE TABLE IF NOT EXISTS "Speech" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL DEFAULT 'Untitled Speech',
    "body" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Speech_userId_idx" ON "Speech"("userId");

-- Bloc: delegate bloc groups
CREATE TABLE IF NOT EXISTS "Bloc" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "inviteCode" TEXT NOT NULL UNIQUE,
    "creatorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Bloc_inviteCode_idx" ON "Bloc"("inviteCode");

-- BlocMember: bloc membership
CREATE TABLE IF NOT EXISTS "BlocMember" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "blocId" TEXT NOT NULL REFERENCES "Bloc"("id") ON DELETE CASCADE,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("blocId", "userId")
);
CREATE INDEX IF NOT EXISTS "BlocMember_blocId_idx" ON "BlocMember"("blocId");
CREATE INDEX IF NOT EXISTS "BlocMember_userId_idx" ON "BlocMember"("userId");

-- BlocMessage: bloc chat messages
CREATE TABLE IF NOT EXISTS "BlocMessage" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "blocId" TEXT NOT NULL REFERENCES "Bloc"("id") ON DELETE CASCADE,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "content" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "replyToId" TEXT REFERENCES "BlocMessage"("id") ON DELETE SET NULL,
    "reactions" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "BlocMessage_blocId_idx" ON "BlocMessage"("blocId");

-- BlocDocument: shared bloc files
CREATE TABLE IF NOT EXISTS "BlocDocument" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "blocId" TEXT NOT NULL REFERENCES "Bloc"("id") ON DELETE CASCADE,
    "uploaderId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "BlocDocument_blocId_idx" ON "BlocDocument"("blocId");

-- StrategyBoard: shared bloc strategy content
CREATE TABLE IF NOT EXISTS "StrategyBoard" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "blocId" TEXT NOT NULL REFERENCES "Bloc"("id") ON DELETE CASCADE,
    "sharedContent" TEXT NOT NULL DEFAULT '',
    "lastEditedById" TEXT REFERENCES "User"("id"),
    "lastEditedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("blocId")
);

-- StrategyBoardPrivate: per-member private strategy section
CREATE TABLE IF NOT EXISTS "StrategyBoardPrivate" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "blocId" TEXT NOT NULL REFERENCES "Bloc"("id") ON DELETE CASCADE,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "content" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("blocId", "userId")
);

-- Resolution: resolution drafts
CREATE TABLE IF NOT EXISTS "Resolution" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "committeeId" TEXT REFERENCES "Committee"("id"),
    "title" TEXT NOT NULL DEFAULT 'Untitled Resolution',
    "topic" TEXT NOT NULL DEFAULT '',
    "coSponsors" TEXT[] DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Resolution_userId_idx" ON "Resolution"("userId");

-- ResolutionClause: clauses within a resolution
CREATE TABLE IF NOT EXISTS "ResolutionClause" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "resolutionId" TEXT NOT NULL REFERENCES "Resolution"("id") ON DELETE CASCADE,
    "type" TEXT NOT NULL,
    "openingPhrase" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "parentClauseId" TEXT REFERENCES "ResolutionClause"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "ResolutionClause_resolutionId_idx" ON "ResolutionClause"("resolutionId");

-- PersonalTask: delegate personal tasks
CREATE TABLE IF NOT EXISTS "PersonalTask" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "dueAt" TIMESTAMP(3),
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "PersonalTask_userId_idx" ON "PersonalTask"("userId");

-- CountryResearch: delegate country research notes
CREATE TABLE IF NOT EXISTS "CountryResearch" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "countryNotes" TEXT NOT NULL DEFAULT '',
    "previousResolutions" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("userId")
);

-- StanceNote: delegate stance on each sub-topic
CREATE TABLE IF NOT EXISTS "StanceNote" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "subTopic" TEXT NOT NULL,
    "stance" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("userId", "subTopic")
);
CREATE INDEX IF NOT EXISTS "StanceNote_userId_idx" ON "StanceNote"("userId");

-- DocumentVersion: version tracking for documents
CREATE TABLE IF NOT EXISTS "DocumentVersion" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "documentId" TEXT NOT NULL REFERENCES "Document"("id") ON DELETE CASCADE,
    "version" INTEGER NOT NULL DEFAULT 1,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "DocumentVersion_documentId_idx" ON "DocumentVersion"("documentId");

-- DocumentStatusHistory: full status change history
CREATE TABLE IF NOT EXISTS "DocumentStatusHistory" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "documentId" TEXT NOT NULL REFERENCES "Document"("id") ON DELETE CASCADE,
    "status" "DocumentStatus" NOT NULL,
    "changedById" TEXT REFERENCES "User"("id"),
    "note" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "DocumentStatusHistory_documentId_idx" ON "DocumentStatusHistory"("documentId");

-- ScheduleEvent: conference schedule events managed by EB
CREATE TABLE IF NOT EXISTS "ScheduleEvent" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "dayLabel" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "location" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "applicableRoles" "UserRole"[],
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "ScheduleEvent_dayLabel_idx" ON "ScheduleEvent"("dayLabel");
