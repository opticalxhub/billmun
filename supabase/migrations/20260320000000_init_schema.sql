-- CreateEnum for UserRole
CREATE TYPE "UserRole" AS ENUM ('DELEGATE', 'CHAIR', 'ADMIN', 'MEDIA', 'EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL');

-- CreateEnum for UserStatus
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum for Grade
CREATE TYPE "Grade" AS ENUM ('GRADE_9', 'GRADE_10', 'GRADE_11', 'GRADE_12');

-- CreateEnum for EmergencyContactRelation
CREATE TYPE "EmergencyContactRelation" AS ENUM ('PARENT', 'GUARDIAN', 'SIBLING', 'OTHER');

-- CreateEnum for CommitteeDifficulty
CREATE TYPE "CommitteeDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum for DocumentType
CREATE TYPE "DocumentType" AS ENUM ('POSITION_PAPER', 'BACKGROUND_GUIDE', 'RULES_OF_PROCEDURE', 'PRESS_RELEASE', 'RESOLUTION_DRAFT', 'OTHER');

-- CreateEnum for DocumentStatus
CREATE TYPE "DocumentStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED');

-- CreateEnum for NotificationType
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ALERT');

-- CreateTable User
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "grade" "Grade" NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "emergencyContactName" TEXT NOT NULL,
    "emergencyContactRelation" "EmergencyContactRelation" NOT NULL,
    "emergencyContactPhone" TEXT NOT NULL,
    "registrationNote" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "role" "UserRole" NOT NULL DEFAULT 'DELEGATE',
    "profileImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT
);

-- CreateIndex on User
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_status_idx" ON "User"("status");
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateTable Committee
CREATE TABLE "Committee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL UNIQUE,
    "topic" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "maxDelegates" INTEGER NOT NULL,
    "difficulty" "CommitteeDifficulty" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex on Committee
CREATE INDEX "Committee_isActive_idx" ON "Committee"("isActive");

-- CreateTable CommitteeAssignment
CREATE TABLE "CommitteeAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "committeeId" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "seatNumber" INTEGER,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedById" TEXT
);

-- CreateIndex on CommitteeAssignment
CREATE UNIQUE INDEX "CommitteeAssignment_userId_committeeId_key" ON "CommitteeAssignment"("userId", "committeeId");
CREATE INDEX "CommitteeAssignment_userId_idx" ON "CommitteeAssignment"("userId");
CREATE INDEX "CommitteeAssignment_committeeId_idx" ON "CommitteeAssignment"("committeeId");

-- CreateTable Document
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "committeeId" TEXT,
    "type" "DocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'SUBMITTED',
    "feedback" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT
);

-- CreateIndex on Document
CREATE INDEX "Document_userId_idx" ON "Document"("userId");
CREATE INDEX "Document_committeeId_idx" ON "Document"("committeeId");
CREATE INDEX "Document_status_idx" ON "Document"("status");
CREATE INDEX "Document_type_idx" ON "Document"("type");

-- CreateTable AIFeedback
CREATE TABLE "AIFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL UNIQUE,
    "userId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "argumentStrength" INTEGER NOT NULL,
    "researchDepth" INTEGER NOT NULL,
    "policyAlignment" INTEGER NOT NULL,
    "writingClarity" INTEGER NOT NULL,
    "formatAdherence" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "strengths" TEXT[],
    "weaknesses" TEXT[],
    "suggestions" TEXT[],
    "annotatedSegments" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex on AIFeedback
CREATE INDEX "AIFeedback_userId_idx" ON "AIFeedback"("userId");
CREATE INDEX "AIFeedback_documentId_idx" ON "AIFeedback"("documentId");

-- CreateTable Announcement
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "targetRoles" "UserRole"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex on Announcement
CREATE INDEX "Announcement_authorId_idx" ON "Announcement"("authorId");
CREATE INDEX "Announcement_isPinned_idx" ON "Announcement"("isPinned");

-- CreateTable Notification
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex on Notification
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateTable PasswordResetToken
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3)
);

-- CreateIndex on PasswordResetToken
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");

-- CreateTable AuditLog
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "metadata" JSONB,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex on AuditLog
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");
CREATE INDEX "AuditLog_performedAt_idx" ON "AuditLog"("performedAt");

-- CreateTable ConferenceSettings
CREATE TABLE "ConferenceSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT '1',
    "conferenceName" TEXT NOT NULL,
    "conferenceDate" TIMESTAMP(3) NOT NULL,
    "conferenceLocation" TEXT NOT NULL,
    "registrationOpen" BOOLEAN NOT NULL DEFAULT false,
    "portalMessage" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT
);

-- Add Foreign Keys
ALTER TABLE "User" ADD CONSTRAINT "User_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CommitteeAssignment" ADD CONSTRAINT "CommitteeAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommitteeAssignment" ADD CONSTRAINT "CommitteeAssignment_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "Committee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Document" ADD CONSTRAINT "Document_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "Committee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Document" ADD CONSTRAINT "Document_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AIFeedback" ADD CONSTRAINT "AIFeedback_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AIFeedback" ADD CONSTRAINT "AIFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ConferenceSettings" ADD CONSTRAINT "ConferenceSettings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
