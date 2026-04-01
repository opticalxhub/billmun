export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  DELEGATE: 'Delegate',
  CHAIR: 'Chair',
  CO_CHAIR: 'Co-Chair',
  MEDIA: 'Press / Media',
  PRESS: 'Press',
  EXECUTIVE_BOARD: 'Executive Member',
  ADMIN: 'Administrator',
  SECURITY: 'Security',
  SECRETARY_GENERAL: 'Secretary General',
  DEPUTY_SECRETARY_GENERAL: 'Deputy Secretary General',
};

export function displayRole(role: string | undefined | null): string {
  if (!role) return 'Participant';
  return ROLE_DISPLAY_NAMES[role] || formatLabel(role);
}

/**
 * Comprehensive snake_case → human-readable label converter.
 * Covers roles, statuses, session types, motion outcomes, event types, etc.
 * Use this everywhere in the frontend instead of raw DB enum values.
 */
const LABEL_MAP: Record<string, string> = {
  // Roles
  ...ROLE_DISPLAY_NAMES,

  // User statuses
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  SUSPENDED: 'Suspended',

  // Document statuses
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  REVISION_REQUESTED: 'Revision Requested',

  // Document types
  POSITION_PAPER: 'Position Paper',
  RESOLUTION: 'Resolution',
  WORKING_PAPER: 'Working Paper',
  AMENDMENT: 'Amendment',
  DIRECTIVE: 'Directive',

  // Session statuses
  ROLL_CALL: 'Roll Call',
  FORMAL_DEBATE: 'Formal Debate',
  MODERATED_CAUCUS: 'Moderated Caucus',
  UNMODERATED_CAUCUS: 'Unmoderated Caucus',
  VOTING_PROCEDURE: 'Voting Procedure',
  SUSPENSION: 'Suspension',
  ADJOURNED: 'Adjourned',
  IN_SESSION: 'In Session',
  BREAK: 'Break',

  // Presence statuses
  PRESENT_IN_SESSION: 'Present',
  PRESENT_AND_VOTING: 'Present & Voting',
  ABSENT: 'Absent',
  CHECKED_IN: 'Checked In',
  NOT_CHECKED_IN: 'Not Checked In',

  // Points & motions
  POINT_OF_ORDER: 'Point of Order',
  POINT_OF_INFORMATION: 'Point of Information',
  POINT_OF_PERSONAL_PRIVILEGE: 'Point of Personal Privilege',
  MOTION_FOR_MODERATED_CAUCUS: 'Motion for Moderated Caucus',
  MOTION_FOR_UNMODERATED_CAUCUS: 'Motion for Unmoderated Caucus',
  MOTION_TO_OPEN_DEBATE: 'Motion to Open Debate',
  MOTION_TO_CLOSE_DEBATE: 'Motion to Close Debate',
  MOTION_TO_SUSPEND: 'Motion to Suspend',
  MOTION_TO_ADJOURN: 'Motion to Adjourn',
  MOTION_TO_TABLE: 'Motion to Table',
  MOTION_TO_INTRODUCE_DRAFT: 'Motion to Introduce Draft Resolution',

  // Motion outcomes
  PASSED: 'Passed',
  FAILED: 'Failed',
  RULED_OUT_OF_ORDER: 'Ruled Out of Order',
  WITHDRAWN: 'Withdrawn',

  // Event types
  MOTION: 'Motion',
  SPEECH: 'Speech',
  VOTE: 'Vote',
  SESSION_START: 'Session Start',
  SESSION_END: 'Session End',
  CAUCUS_START: 'Caucus Start',
  CAUCUS_END: 'Caucus End',

  // Notification types
  INFO: 'Info',
  SUCCESS: 'Success',
  WARNING: 'Warning',
  ALERT: 'Alert',

  // Yield types
  YIELD_TO_CHAIR: 'Yield to Chair',
  YIELD_TO_DELEGATE: 'Yield to Delegate',
  YIELD_TO_QUESTIONS: 'Yield to Questions',

  // Speakers list statuses
  QUEUED: 'Queued',
  SPEAKING: 'Speaking',
  COMPLETED: 'Completed',
  SKIPPED: 'Skipped',

  // Channel types
  COMMITTEE: 'Committee',
  DEPARTMENT: 'Department',
  BROADCAST: 'Broadcast',
  DIRECT: 'Direct',

  // Media statuses
  PUBLISHED: 'Published',
  DRAFT: 'Draft',
  HIDDEN: 'Hidden',

  // Badge statuses
  ACTIVE: 'Active',
  REVOKED: 'Revoked',

  // Issue report categories
  TECHNICAL: 'Technical',
  BEHAVIORAL: 'Behavioral',
  EMERGENCY: 'Emergency',

  // Misc
  ALL: 'All',
  TEXT: 'Text',
  FILE: 'File',
  MEMBER: 'Member',
  MODERATOR: 'Moderator',
};

export function formatLabel(value: string | undefined | null): string {
  if (!value) return '';
  if (LABEL_MAP[value]) return LABEL_MAP[value];
  // Fallback: convert SNAKE_CASE to Title Case
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}
