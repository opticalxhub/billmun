import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SNAKE_CASE_COLUMNS = [
  'full_name', 'phone_number', 'date_of_birth', 'emergency_contact_name', 
  'emergency_contact_relation', 'emergency_contact_phone', 'profile_image_url', 
  'approved_at', 'approved_by_id', 'created_at', 'updated_at', 'badge_status', 
  'current_zone_id', 'ai_analyses_today', 'ai_analyses_reset_date', 'password_hash', 
  'has_completed_onboarding', 'dietary_restrictions', 'preferred_committee', 
  'allocated_country', 'is_active', 'is_read', 'is_pinned', 'is_completed', 
  'is_announcement', 'file_url', 'file_size', 'mime_type', 'user_id', 
  'committee_id', 'bloc_id', 'channel_id', 'sender_id', 'message_id', 
  'reply_to_id', 'parent_clause_id', 'resolution_id', 'order_index', 
  'opening_phrase', 'last_edited_by_id', 'last_edited_at', 'shared_content', 
  'day_label', 'event_name', 'start_time', 'end_time', 'applicable_roles', 
  'sub_topic', 'country_notes', 'previous_resolutions', 'parent_document_id', 
  'word_count', 'invite_code', 'creator_id', 'chair_id', 'reviewed_by_id', 
  'uploaded_at', 'reviewed_at', 'assigned_at', 'assigned_by_id', 'performed_at', 
  'changed_at', 'changed_by_id', 'pinned_at', 'pinned_by_id', 'edited_at', 
  'deleted_at', 'last_read_at', 'joined_at', 'read_at', 'reported_by', 
  'assigned_to', 'sent_by', 'created_by', 'updated_by', 'last_changed_by', 
  'last_changed_at', 'last_seen_at', 'last_seen_by', 'officer_id', 'roll_call_id', 
  'delegate_id', 'rated_by', 'nominated_by', 'zone_id', 'badge_id', 'briefing_id', 
  'due_at', 'is_winner', 'set_duration', 'actual_duration', 'speaking_time_limit', 
  'actual_speaking_time', 'yield_type', 'yield_to_id', 'started_at', 
  'completed_at', 'quorum_established', 'votes_for', 'votes_against', 
  'votes_abstain', 'recorded_votes', 'recorded_by', 'seat_label', 'note_text', 
  'admin_user_id', 'chair_user_id', 'correction_note', 'corrected_at', 
  'corrected_by', 'session_start', 'session_end', 'event_type', 
  'requires_eb_notification', 'resolution_note', 'flagged_reason', 
  'restricted_reason', 'missing_note', 'rejection_reason', 'eb_notes', 
  'target_committee_id', 'committee_tag', 'event_tag', 'approval_at', 
  'recipient_count', 'body_html', 'auto_approve_registrations', 
  'registration_open', 'portal_message', 'conference_name', 'conference_date', 
  'conference_location', 'argumentation_quality', 'private_notes', 'checklist', 
  'research_notes', 'country_positions', 'individual_contribution', 
  'stance_tracker', 'country_profile', 'sub_topics', 'background_guide_url', 
  'rop_url', 'max_delegates', 'is_read_only', 'caucus_type', 'caucus_duration', 
  'caucus_purpose', 'break_type', 'break_duration', 'session_summary', 
  'debate_topic', 'speaking_time_limit', 'ai_detection_score', 
  'ai_detection_phrases', 'diplomatic_language', 'annotated_segments', 
  'overall_score', 'argument_strength', 'research_depth', 'policy_alignment', 
  'writing_clarity', 'format_adherence'
];

const CAMEL_CASE_TO_SNAKE = {
  'fullName': 'full_name',
  'phoneNumber': 'phone_number',
  'dateOfBirth': 'date_of_birth',
  'emergencyContactName': 'emergency_contact_name',
  'emergencyContactRelation': 'emergency_contact_relation',
  'emergencyContactPhone': 'emergency_contact_phone',
  'profileImageUrl': 'profile_image_url',
  'approvedAt': 'approved_at',
  'approvedById': 'approved_by_id',
  'createdAt': 'created_at',
  'updatedAt': 'updated_at',
  'badgeStatus': 'badge_status',
  'currentZoneId': 'current_zone_id',
  'aiAnalysesToday': 'ai_analyses_today',
  'aiAnalysesResetDate': 'ai_analyses_reset_date',
  'passwordHash': 'password_hash',
  'hasCompletedOnboarding': 'has_completed_onboarding',
  'dietaryRestrictions': 'dietary_restrictions',
  'preferredCommittee': 'preferred_committee',
  'allocatedCountry': 'allocated_country',
  'isActive': 'is_active',
  'isRead': 'is_read',
  'isPinned': 'is_pinned',
  'isCompleted': 'is_completed',
  'isAnnouncement': 'is_announcement',
  'fileUrl': 'file_url',
  'fileSize': 'file_size',
  'mimeType': 'mime_type',
  'userId': 'user_id',
  'committeeId': 'committee_id',
  'blocId': 'bloc_id',
  'channelId': 'channel_id',
  'senderId': 'sender_id',
  'messageId': 'message_id',
  'replyToId': 'reply_to_id',
  'parentClauseId': 'parent_clause_id',
  'resolutionId': 'resolution_id',
  'orderIndex': 'order_index',
  'openingPhrase': 'opening_phrase',
  'lastEditedById': 'last_edited_by_id',
  'lastEditedAt': 'last_edited_at',
  'sharedContent': 'shared_content',
  'dayLabel': 'day_label',
  'eventName': 'event_name',
  'startTime': 'start_time',
  'endTime': 'end_time',
  'applicableRoles': 'applicable_roles',
  'subTopic': 'sub_topic',
  'countryNotes': 'country_notes',
  'previousResolutions': 'previous_resolutions',
  'parentDocumentId': 'parent_document_id',
  'wordCount': 'word_count',
  'inviteCode': 'invite_code',
  'creatorId': 'creator_id',
  'chairId': 'chair_id',
  'reviewedById': 'reviewed_by_id',
  'uploadedAt': 'uploaded_at',
  'reviewedAt': 'reviewed_at',
  'assignedAt': 'assigned_at',
  'assignedById': 'assigned_by_id',
  'performedAt': 'performed_at',
  'changedAt': 'changed_at',
  'changedById': 'changed_by_id',
  'pinnedAt': 'pinned_at',
  'pinnedById': 'pinned_by_id',
  'editedAt': 'edited_at',
  'deletedAt': 'deleted_at',
  'lastReadAt': 'last_read_at',
  'joinedAt': 'joined_at',
  'readAt': 'read_at',
  'reportedBy': 'reported_by',
  'assignedTo': 'assigned_to',
  'sentBy': 'sent_by',
  'createdBy': 'created_by',
  'updatedBy': 'updated_by',
  'lastChangedBy': 'last_changed_by',
  'lastChangedAt': 'last_changed_at',
  'lastSeenAt': 'last_seen_at',
  'lastSeenBy': 'last_seen_by',
  'officerId': 'officer_id',
  'rollCallId': 'roll_call_id',
  'delegateId': 'delegate_id',
  'ratedBy': 'rated_by',
  'nominatedBy': 'nominated_by',
  'zoneId': 'zone_id',
  'badgeId': 'badge_id',
  'briefingId': 'briefing_id',
  'dueAt': 'due_at',
  'isWinner': 'is_winner',
  'setDuration': 'set_duration',
  'actualDuration': 'actual_duration',
  'speakingTimeLimit': 'speaking_time_limit',
  'actualSpeakingTime': 'actual_speaking_time',
  'yieldType': 'yield_type',
  'yieldToId': 'yield_to_id',
  'startedAt': 'started_at',
  'completedAt': 'completed_at',
  'quorumEstablished': 'quorum_established',
  'votesFor': 'votes_for',
  'votesAgainst': 'votes_against',
  'votesAbstain': 'votes_abstain',
  'recordedVotes': 'recorded_votes',
  'recordedBy': 'recorded_by',
  'seatLabel': 'seat_label',
  'noteText': 'note_text',
  'adminUserId': 'admin_user_id',
  'chairUserId': 'chair_user_id',
  'correctionNote': 'correction_note',
  'correctedAt': 'corrected_at',
  'correctedBy': 'corrected_by',
  'sessionStart': 'session_start',
  'sessionEnd': 'session_end',
  'eventType': 'event_type',
  'requiresEbNotification': 'requires_eb_notification',
  'resolutionNote': 'resolution_note',
  'flaggedReason': 'flagged_reason',
  'restrictedReason': 'restricted_reason',
  'missingNote': 'missing_note',
  'rejectionReason': 'rejection_reason',
  'ebNotes': 'eb_notes',
  'targetCommitteeId': 'target_committee_id',
  'committeeTag': 'committee_tag',
  'eventTag': 'event_tag',
  'approvalAt': 'approval_at',
  'recipientCount': 'recipient_count',
  'bodyHtml': 'body_html',
  'autoApproveRegistrations': 'auto_approve_registrations',
  'registrationOpen': 'registration_open',
  'portalMessage': 'portal_message',
  'conferenceName': 'conference_name',
  'conferenceDate': 'conference_date',
  'conferenceLocation': 'conference_location',
  'argumentationQuality': 'argumentation_quality',
  'privateNotes': 'private_notes',
  'checklist': 'checklist',
  'researchNotes': 'research_notes',
  'countryPositions': 'country_positions',
  'individualContribution': 'individual_contribution',
  'stanceTracker': 'stance_tracker',
  'countryProfile': 'country_profile',
  'subTopics': 'sub_topics',
  'backgroundGuideUrl': 'background_guide_url',
  'ropUrl': 'rop_url',
  'maxDelegates': 'max_delegates',
  'isReadOnly': 'is_read_only',
  'caucusType': 'caucus_type',
  'caucusDuration': 'caucus_duration',
  'caucusPurpose': 'caucus_purpose',
  'breakType': 'break_type',
  'breakDuration': 'break_duration',
  'sessionSummary': 'session_summary',
  'debateTopic': 'debate_topic',
  'aiDetectionScore': 'ai_detection_score',
  'aiDetectionPhrases': 'ai_detection_phrases',
  'diplomaticLanguage': 'diplomatic_language',
  'annotatedSegments': 'annotated_segments',
  'overallScore': 'overall_score',
  'argumentStrength': 'argument_strength',
  'researchDepth': 'research_depth',
  'policyAlignment': 'policy_alignment',
  'writingClarity': 'writing_clarity',
  'formatAdherence': 'format_adherence'
};

function walkDir(dir: string, callback: (filePath: string) => void) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules' && f !== '.next' && f !== '.git') {
        walkDir(dirPath, callback);
      }
    } else {
      callback(dirPath);
    }
  });
}

async function audit() {
  console.log('Starting end-to-end audit...');
  
  const files: string[] = [];
  walkDir('./src', (f) => files.push(f));

  let issuesFound = 0;

  for (const file of files) {
    if (!file.endsWith('.ts') && !file.endsWith('.tsx') && !file.endsWith('.js') && !file.endsWith('.jsx')) continue;
    
    const content = fs.readFileSync(file, 'utf8');
    let newContent = content;

    // Check for camelCase columns in .select(), .insert(), .update(), .eq(), etc.
    // This is a simple regex-based check and replace.
    for (const [camel, snake] of Object.entries(CAMEL_CASE_TO_SNAKE)) {
      // Look for camelCase in Supabase calls or property access on objects that might be DB results
      // We look for:
      // 1. .select("...camel...")
      // 2. .insert({ ...camel: ... })
      // 3. .update({ ...camel: ... })
      // 4. .eq("camel", ...)
      // 5. user.camel
      
      const selectRegex = new RegExp(`\\.select\\(['"\s*]*.*${camel}.*['"\s*]*\\)`, 'g');
      if (selectRegex.test(content)) {
        console.log(`[ISSUE] ${file}: Found camelCase '${camel}' in .select()`);
        issuesFound++;
        // Replace camel with snake in the select string
        newContent = newContent.replace(selectRegex, (match) => match.replace(new RegExp(camel, 'g'), snake));
      }

      const objectPropRegex = new RegExp(`\\b${camel}:`, 'g'); // { fullName: ... }
      if (objectPropRegex.test(content)) {
        // Only replace if it looks like it's inside an insert/update or a DB-related object
        // For simplicity, we'll replace and then manually review or rely on the user's request.
        // Actually, let's be more specific.
        if (content.includes('.insert(') || content.includes('.update(') || content.includes('.upsert(')) {
           console.log(`[ISSUE] ${file}: Found camelCase key '${camel}' in object (likely insert/update)`);
           issuesFound++;
           newContent = newContent.replace(objectPropRegex, `${snake}:`);
        }
      }

      const eqRegex = new RegExp(`\\.eq\\(['"]${camel}['"]`, 'g');
      if (eqRegex.test(content)) {
        console.log(`[ISSUE] ${file}: Found camelCase '${camel}' in .eq()`);
        issuesFound++;
        newContent = newContent.replace(eqRegex, `.eq("${snake}"`);
      }

      // Property access: user.fullName -> user.full_name
      // We need to be careful not to replace legitimate camelCase props that are NOT from the DB.
      // But the user said: "If a component reads user.fullName but the database returns user.full_name that is a bug — fix it."
      // So we'll look for common object prefixes like user, row, r, u, member, delegate, etc.
      const propAccessRegex = new RegExp(`\\b(user|row|r|u|member|delegate|selectedUser|targetUser|profile|row|item|data)\\.${camel}\\b`, 'g');
      if (propAccessRegex.test(content)) {
        console.log(`[ISSUE] ${file}: Found camelCase property access '${camel}'`);
        issuesFound++;
        newContent = newContent.replace(propAccessRegex, `$1.${snake}`);
      }
    }

    if (newContent !== content) {
      fs.writeFileSync(file, newContent);
      console.log(`[FIXED] ${file}`);
    }
  }

  console.log(`\nAudit complete. Issues found and fixed: ${issuesFound}`);
}

audit();
