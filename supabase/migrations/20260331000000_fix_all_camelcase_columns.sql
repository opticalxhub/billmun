-- =====================================================
-- Rename all remaining camelCase columns to snake_case
-- =====================================================

DO $$ 
BEGIN
    -- committee_sessions
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='committee_sessions' AND column_name='committeeId') THEN
        ALTER TABLE committee_sessions RENAME COLUMN "committeeId" TO committee_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='committee_sessions' AND column_name='debateTopic') THEN
        ALTER TABLE committee_sessions RENAME COLUMN "debateTopic" TO debate_topic;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='committee_sessions' AND column_name='speakingTimeLimit') THEN
        ALTER TABLE committee_sessions RENAME COLUMN "speakingTimeLimit" TO speaking_time_limit;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='committee_sessions' AND column_name='updatedAt') THEN
        ALTER TABLE committee_sessions RENAME COLUMN "updatedAt" TO updated_at;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='committee_sessions' AND column_name='updatedById') THEN
        ALTER TABLE committee_sessions RENAME COLUMN "updatedById" TO updated_by_id;
    END IF;

    -- speeches
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='speeches' AND column_name='userId') THEN
        ALTER TABLE speeches RENAME COLUMN "userId" TO user_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='speeches' AND column_name='wordCount') THEN
        ALTER TABLE speeches RENAME COLUMN "wordCount" TO word_count;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='speeches' AND column_name='isActive') THEN
        ALTER TABLE speeches RENAME COLUMN "isActive" TO is_active;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='speeches' AND column_name='createdAt') THEN
        ALTER TABLE speeches RENAME COLUMN "createdAt" TO created_at;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='speeches' AND column_name='updatedAt') THEN
        ALTER TABLE speeches RENAME COLUMN "updatedAt" TO updated_at;
    END IF;

    -- blocs
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blocs' AND column_name='inviteCode') THEN
        ALTER TABLE blocs RENAME COLUMN "inviteCode" TO invite_code;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blocs' AND column_name='creatorId') THEN
        ALTER TABLE blocs RENAME COLUMN "creatorId" TO creator_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blocs' AND column_name='createdAt') THEN
        ALTER TABLE blocs RENAME COLUMN "createdAt" TO created_at;
    END IF;

    -- bloc_members
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bloc_members' AND column_name='blocId') THEN
        ALTER TABLE bloc_members RENAME COLUMN "blocId" TO bloc_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bloc_members' AND column_name='userId') THEN
        ALTER TABLE bloc_members RENAME COLUMN "userId" TO user_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bloc_members' AND column_name='joinedAt') THEN
        ALTER TABLE bloc_members RENAME COLUMN "joinedAt" TO joined_at;
    END IF;

    -- bloc_messages
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bloc_messages' AND column_name='blocId') THEN
        ALTER TABLE bloc_messages RENAME COLUMN "blocId" TO bloc_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bloc_messages' AND column_name='userId') THEN
        ALTER TABLE bloc_messages RENAME COLUMN "userId" TO user_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bloc_messages' AND column_name='fileUrl') THEN
        ALTER TABLE bloc_messages RENAME COLUMN "fileUrl" TO file_url;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bloc_messages' AND column_name='fileName') THEN
        ALTER TABLE bloc_messages RENAME COLUMN "fileName" TO file_name;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bloc_messages' AND column_name='replyToId') THEN
        ALTER TABLE bloc_messages RENAME COLUMN "replyToId" TO reply_to_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bloc_messages' AND column_name='createdAt') THEN
        ALTER TABLE bloc_messages RENAME COLUMN "createdAt" TO created_at;
    END IF;

    -- bloc_documents
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bloc_documents' AND column_name='blocId') THEN
        ALTER TABLE bloc_documents RENAME COLUMN "blocId" TO bloc_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bloc_documents' AND column_name='uploaderId') THEN
        ALTER TABLE bloc_documents RENAME COLUMN "uploaderId" TO uploader_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bloc_documents' AND column_name='fileUrl') THEN
        ALTER TABLE bloc_documents RENAME COLUMN "fileUrl" TO file_url;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bloc_documents' AND column_name='fileSize') THEN
        ALTER TABLE bloc_documents RENAME COLUMN "fileSize" TO file_size;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bloc_documents' AND column_name='uploadedAt') THEN
        ALTER TABLE bloc_documents RENAME COLUMN "uploadedAt" TO uploaded_at;
    END IF;

    -- strategy_board
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='strategy_board' AND column_name='blocId') THEN
        ALTER TABLE strategy_board RENAME COLUMN "blocId" TO bloc_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='strategy_board' AND column_name='sharedContent') THEN
        ALTER TABLE strategy_board RENAME COLUMN "sharedContent" TO shared_content;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='strategy_board' AND column_name='lastEditedById') THEN
        ALTER TABLE strategy_board RENAME COLUMN "lastEditedById" TO last_edited_by_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='strategy_board' AND column_name='lastEditedAt') THEN
        ALTER TABLE strategy_board RENAME COLUMN "lastEditedAt" TO last_edited_at;
    END IF;

    -- strategy_board_private
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='strategy_board_private' AND column_name='blocId') THEN
        ALTER TABLE strategy_board_private RENAME COLUMN "blocId" TO bloc_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='strategy_board_private' AND column_name='userId') THEN
        ALTER TABLE strategy_board_private RENAME COLUMN "userId" TO user_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='strategy_board_private' AND column_name='updatedAt') THEN
        ALTER TABLE strategy_board_private RENAME COLUMN "updatedAt" TO updated_at;
    END IF;

    -- resolutions
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resolutions' AND column_name='userId') THEN
        ALTER TABLE resolutions RENAME COLUMN "userId" TO user_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resolutions' AND column_name='committeeId') THEN
        ALTER TABLE resolutions RENAME COLUMN "committeeId" TO committee_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resolutions' AND column_name='coSponsors') THEN
        ALTER TABLE resolutions RENAME COLUMN "coSponsors" TO co_sponsors;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resolutions' AND column_name='createdAt') THEN
        ALTER TABLE resolutions RENAME COLUMN "createdAt" TO created_at;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resolutions' AND column_name='updatedAt') THEN
        ALTER TABLE resolutions RENAME COLUMN "updatedAt" TO updated_at;
    END IF;

    -- resolution_clauses
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resolution_clauses' AND column_name='resolutionId') THEN
        ALTER TABLE resolution_clauses RENAME COLUMN "resolutionId" TO resolution_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resolution_clauses' AND column_name='openingPhrase') THEN
        ALTER TABLE resolution_clauses RENAME COLUMN "openingPhrase" TO opening_phrase;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resolution_clauses' AND column_name='orderIndex') THEN
        ALTER TABLE resolution_clauses RENAME COLUMN "orderIndex" TO order_index;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resolution_clauses' AND column_name='parentClauseId') THEN
        ALTER TABLE resolution_clauses RENAME COLUMN "parentClauseId" TO parent_clause_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resolution_clauses' AND column_name='createdAt') THEN
        ALTER TABLE resolution_clauses RENAME COLUMN "createdAt" TO created_at;
    END IF;

    -- personal_tasks
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='personal_tasks' AND column_name='userId') THEN
        ALTER TABLE personal_tasks RENAME COLUMN "userId" TO user_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='personal_tasks' AND column_name='dueAt') THEN
        ALTER TABLE personal_tasks RENAME COLUMN "dueAt" TO due_at;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='personal_tasks' AND column_name='isCompleted') THEN
        ALTER TABLE personal_tasks RENAME COLUMN "isCompleted" TO is_completed;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='personal_tasks' AND column_name='createdAt') THEN
        ALTER TABLE personal_tasks RENAME COLUMN "createdAt" TO created_at;
    END IF;

    -- country_research
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='country_research' AND column_name='userId') THEN
        ALTER TABLE country_research RENAME COLUMN "userId" TO user_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='country_research' AND column_name='countryNotes') THEN
        ALTER TABLE country_research RENAME COLUMN "countryNotes" TO country_notes;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='country_research' AND column_name='previousResolutions') THEN
        ALTER TABLE country_research RENAME COLUMN "previousResolutions" TO previous_resolutions;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='country_research' AND column_name='updatedAt') THEN
        ALTER TABLE country_research RENAME COLUMN "updatedAt" TO updated_at;
    END IF;

    -- stance_notes
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stance_notes' AND column_name='userId') THEN
        ALTER TABLE stance_notes RENAME COLUMN "userId" TO user_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stance_notes' AND column_name='subTopic') THEN
        ALTER TABLE stance_notes RENAME COLUMN "subTopic" TO sub_topic;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stance_notes' AND column_name='updatedAt') THEN
        ALTER TABLE stance_notes RENAME COLUMN "updatedAt" TO updated_at;
    END IF;

    -- document_versions
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='document_versions' AND column_name='documentId') THEN
        ALTER TABLE document_versions RENAME COLUMN "documentId" TO document_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='document_versions' AND column_name='fileUrl') THEN
        ALTER TABLE document_versions RENAME COLUMN "fileUrl" TO file_url;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='document_versions' AND column_name='fileSize') THEN
        ALTER TABLE document_versions RENAME COLUMN "fileSize" TO file_size;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='document_versions' AND column_name='uploadedAt') THEN
        ALTER TABLE document_versions RENAME COLUMN "uploadedAt" TO uploaded_at;
    END IF;

    -- document_status_history
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='document_status_history' AND column_name='documentId') THEN
        ALTER TABLE document_status_history RENAME COLUMN "documentId" TO document_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='document_status_history' AND column_name='changedById') THEN
        ALTER TABLE document_status_history RENAME COLUMN "changedById" TO changed_by_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='document_status_history' AND column_name='changedAt') THEN
        ALTER TABLE document_status_history RENAME COLUMN "changedAt" TO changed_at;
    END IF;

    -- announcements
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='announcements' AND column_name='committeeId') THEN
        ALTER TABLE announcements RENAME COLUMN "committeeId" TO committee_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='announcements' AND column_name='authorId') THEN
        ALTER TABLE announcements RENAME COLUMN "authorId" TO author_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='announcements' AND column_name='isPinned') THEN
        ALTER TABLE announcements RENAME COLUMN "isPinned" TO is_pinned;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='announcements' AND column_name='targetRoles') THEN
        ALTER TABLE announcements RENAME COLUMN "targetRoles" TO target_roles;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='announcements' AND column_name='createdAt') THEN
        ALTER TABLE announcements RENAME COLUMN "createdAt" TO created_at;
    END IF;

    -- committees
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='committees' AND column_name='chairId') THEN
        ALTER TABLE committees RENAME COLUMN "chairId" TO chair_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='committees' AND column_name='coChairId') THEN
        ALTER TABLE committees RENAME COLUMN "coChairId" TO co_chair_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='committees' AND column_name='backgroundGuideUrl') THEN
        ALTER TABLE committees RENAME COLUMN "backgroundGuideUrl" TO background_guide_url;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='committees' AND column_name='ropUrl') THEN
        ALTER TABLE committees RENAME COLUMN "ropUrl" TO rop_url;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='committees' AND column_name='subTopics') THEN
        ALTER TABLE committees RENAME COLUMN "subTopics" TO sub_topics;
    END IF;

    -- users
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='aiAnalysesToday') THEN
        ALTER TABLE users RENAME COLUMN "aiAnalysesToday" TO ai_analyses_today;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='aiAnalysesResetDate') THEN
        ALTER TABLE users RENAME COLUMN "aiAnalysesResetDate" TO ai_analyses_reset_date;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='allocatedCountry') THEN
        ALTER TABLE users RENAME COLUMN "allocatedCountry" TO allocated_country;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='dietaryRestrictions') THEN
        ALTER TABLE users RENAME COLUMN "dietaryRestrictions" TO dietary_restrictions;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='preferredCommittee') THEN
        ALTER TABLE users RENAME COLUMN "preferredCommittee" TO preferred_committee;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='hasCompletedOnboarding') THEN
        ALTER TABLE users RENAME COLUMN "hasCompletedOnboarding" TO has_completed_onboarding;
    END IF;

    -- committee_assignments
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='committee_assignments' AND column_name='committeeId') THEN
        ALTER TABLE committee_assignments RENAME COLUMN "committeeId" TO committee_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='committee_assignments' AND column_name='userId') THEN
        ALTER TABLE committee_assignments RENAME COLUMN "userId" TO user_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='committee_assignments' AND column_name='assignedById') THEN
        ALTER TABLE committee_assignments RENAME COLUMN "assignedById" TO assigned_by_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='committee_assignments' AND column_name='assignedAt') THEN
        ALTER TABLE committee_assignments RENAME COLUMN "assignedAt" TO assigned_at;
    END IF;

    -- documents
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='committeeId') THEN
        ALTER TABLE documents RENAME COLUMN "committeeId" TO committee_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='userId') THEN
        ALTER TABLE documents RENAME COLUMN "userId" TO user_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='parentDocumentId') THEN
        ALTER TABLE documents RENAME COLUMN "parentDocumentId" TO parent_document_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='reviewedById') THEN
        ALTER TABLE documents RENAME COLUMN "reviewedById" TO reviewed_by_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='fileUrl') THEN
        ALTER TABLE documents RENAME COLUMN "fileUrl" TO file_url;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='fileSize') THEN
        ALTER TABLE documents RENAME COLUMN "fileSize" TO file_size;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='mimeType') THEN
        ALTER TABLE documents RENAME COLUMN "mimeType" TO mime_type;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='uploadedAt') THEN
        ALTER TABLE documents RENAME COLUMN "uploadedAt" TO uploaded_at;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='reviewedAt') THEN
        ALTER TABLE documents RENAME COLUMN "reviewedAt" TO reviewed_at;
    END IF;

    -- ai_feedback
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_feedback' AND column_name='documentId') THEN
        ALTER TABLE ai_feedback RENAME COLUMN "documentId" TO document_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_feedback' AND column_name='userId') THEN
        ALTER TABLE ai_feedback RENAME COLUMN "userId" TO user_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_feedback' AND column_name='overallScore') THEN
        ALTER TABLE ai_feedback RENAME COLUMN "overallScore" TO overall_score;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_feedback' AND column_name='argumentStrength') THEN
        ALTER TABLE ai_feedback RENAME COLUMN "argumentStrength" TO argument_strength;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_feedback' AND column_name='researchDepth') THEN
        ALTER TABLE ai_feedback RENAME COLUMN "researchDepth" TO research_depth;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_feedback' AND column_name='policyAlignment') THEN
        ALTER TABLE ai_feedback RENAME COLUMN "policyAlignment" TO policy_alignment;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_feedback' AND column_name='writingClarity') THEN
        ALTER TABLE ai_feedback RENAME COLUMN "writingClarity" TO writing_clarity;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_feedback' AND column_name='formatAdherence') THEN
        ALTER TABLE ai_feedback RENAME COLUMN "formatAdherence" TO format_adherence;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_feedback' AND column_name='annotatedSegments') THEN
        ALTER TABLE ai_feedback RENAME COLUMN "annotatedSegments" TO annotated_segments;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_feedback' AND column_name='diplomaticLanguage') THEN
        ALTER TABLE ai_feedback RENAME COLUMN "diplomaticLanguage" TO diplomatic_language;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_feedback' AND column_name='aiDetectionScore') THEN
        ALTER TABLE ai_feedback RENAME COLUMN "aiDetectionScore" TO ai_detection_score;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_feedback' AND column_name='aiDetectionPhrases') THEN
        ALTER TABLE ai_feedback RENAME COLUMN "aiDetectionPhrases" TO ai_detection_phrases;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_feedback' AND column_name='createdAt') THEN
        ALTER TABLE ai_feedback RENAME COLUMN "createdAt" TO created_at;
    END IF;

    -- attendance_records
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance_records' AND column_name='committeeId') THEN
        ALTER TABLE attendance_records RENAME COLUMN "committeeId" TO committee_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance_records' AND column_name='userId') THEN
        ALTER TABLE attendance_records RENAME COLUMN "userId" TO user_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance_records' AND column_name='sessionStart') THEN
        ALTER TABLE attendance_records RENAME COLUMN "sessionStart" TO session_start;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance_records' AND column_name='sessionEnd') THEN
        ALTER TABLE attendance_records RENAME COLUMN "sessionEnd" TO session_end;
    END IF;

    -- committee_vote_records
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='committee_vote_records' AND column_name='committeeId') THEN
        ALTER TABLE committee_vote_records RENAME COLUMN "committeeId" TO committee_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='committee_vote_records' AND column_name='motionType') THEN
        ALTER TABLE committee_vote_records RENAME COLUMN "motionType" TO motion_type;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='committee_vote_records' AND column_name='votesFor') THEN
        ALTER TABLE committee_vote_records RENAME COLUMN "votesFor" TO votes_for;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='committee_vote_records' AND column_name='votesAgainst') THEN
        ALTER TABLE committee_vote_records RENAME COLUMN "votesAgainst" TO votes_against;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='committee_vote_records' AND column_name='recordedVotes') THEN
        ALTER TABLE committee_vote_records RENAME COLUMN "recordedVotes" TO recorded_votes;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='committee_vote_records' AND column_name='createdAt') THEN
        ALTER TABLE committee_vote_records RENAME COLUMN "createdAt" TO created_at;
    END IF;

    -- admin_chair_notes
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_chair_notes' AND column_name='committeeId') THEN
        ALTER TABLE admin_chair_notes RENAME COLUMN "committeeId" TO committee_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_chair_notes' AND column_name='noteText') THEN
        ALTER TABLE admin_chair_notes RENAME COLUMN "noteText" TO note_text;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_chair_notes' AND column_name='updatedAt') THEN
        ALTER TABLE admin_chair_notes RENAME COLUMN "updatedAt" TO updated_at;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_chair_notes' AND column_name='updatedById') THEN
        ALTER TABLE admin_chair_notes RENAME COLUMN "updatedById" TO updated_by_id;
    END IF;

    -- channels
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='channels' AND column_name='committeeId') THEN
        ALTER TABLE channels RENAME COLUMN "committeeId" TO committee_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='channels' AND column_name='isReadOnly') THEN
        ALTER TABLE channels RENAME COLUMN "isReadOnly" TO is_read_only;
    END IF;

    -- committee_admin_tasks
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='committee_admin_tasks' AND column_name='committeeId') THEN
        ALTER TABLE committee_admin_tasks RENAME COLUMN "committeeId" TO committee_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='committee_admin_tasks' AND column_name='createdBy') THEN
        ALTER TABLE committee_admin_tasks RENAME COLUMN "createdBy" TO created_by;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='committee_admin_tasks' AND column_name='assignedAdminId') THEN
        ALTER TABLE committee_admin_tasks RENAME COLUMN "assignedAdminId" TO assigned_admin_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='committee_admin_tasks' AND column_name='createdAt') THEN
        ALTER TABLE committee_admin_tasks RENAME COLUMN "createdAt" TO created_at;
    END IF;

    -- delegate_presence_statuses
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='delegate_presence_statuses' AND column_name='committeeId') THEN
        ALTER TABLE delegate_presence_statuses RENAME COLUMN "committeeId" TO committee_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='delegate_presence_statuses' AND column_name='userId') THEN
        ALTER TABLE delegate_presence_statuses RENAME COLUMN "userId" TO user_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='delegate_presence_statuses' AND column_name='currentStatus') THEN
        ALTER TABLE delegate_presence_statuses RENAME COLUMN "currentStatus" TO current_status;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='delegate_presence_statuses' AND column_name='lastChangedBy') THEN
        ALTER TABLE delegate_presence_statuses RENAME COLUMN "lastChangedBy" TO last_changed_by;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='delegate_presence_statuses' AND column_name='lastChangedAt') THEN
        ALTER TABLE delegate_presence_statuses RENAME COLUMN "lastChangedAt" TO last_changed_at;
    END IF;

    -- security_badges
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='security_badges' AND column_name='userId') THEN
        ALTER TABLE security_badges RENAME COLUMN "userId" TO user_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='security_badges' AND column_name='badgeNumber') THEN
        ALTER TABLE security_badges RENAME COLUMN "badgeNumber" TO badge_number;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='security_badges' AND column_name='issuedAt') THEN
        ALTER TABLE security_badges RENAME COLUMN "issuedAt" TO issued_at;
    END IF;

    -- committee_resources
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='committee_resources' AND column_name='committeeId') THEN
        ALTER TABLE committee_resources RENAME COLUMN "committeeId" TO committee_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='committee_resources' AND column_name='fileUrl') THEN
        ALTER TABLE committee_resources RENAME COLUMN "fileUrl" TO file_url;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='committee_resources' AND column_name='updatedAt') THEN
        ALTER TABLE committee_resources RENAME COLUMN "updatedAt" TO updated_at;
    END IF;

END $$;
