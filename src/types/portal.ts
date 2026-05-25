export interface PortalUserSummary {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  status: string;
  has_completed_onboarding: boolean | null;
  badge_status?: string | null;
  ai_analyses_today?: number | null;
  ai_analyses_reset_date?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CommitteeAssignmentSummary {
  id: string;
  committee_id: string;
  country: string | null;
  seat_number: number | null;
  assigned_at: string | null;
}

export interface CommitteeSummary {
  id: string;
  name: string;
  abbreviation: string | null;
  topic: string | null;
  secondary_topic: string | null;
  description?: string | null;
  background_guide_url?: string | null;
  rop_url?: string | null;
  sub_topics?: string[] | null;
  chair_id: string | null;
  co_chair_id: string | null;
  admin_id: string | null;
  visibility: string | null;
}

export interface CommitteeSessionSummary {
  id: string;
  committee_id: string;
  status: string | null;
  caucus_type?: string | null;
  debate_topic?: string | null;
  current_speaker: string | null;
  speaking_time_limit?: number | null;
  moderated_caucus_topic: string | null;
  moderated_caucus_time: number | null;
  unmoderated_caucus_time: number | null;
  voting_open: boolean | null;
  updated_at: string | null;
}

export interface DelegateDashboardData {
  user: PortalUserSummary;
  assignment: CommitteeAssignmentSummary | null;
  committee: CommitteeSummary | null;
  committeeSession: CommitteeSessionSummary | null;
  settings?: any | null;
  stats?: {
    documents: number;
    aiToday: number;
    speeches: number;
    blocs: number;
  };
  activity?: Array<{
    id: string;
    action: string;
    performed_at: string;
  }>;
}

export interface PortalNotification {
  id: string;
  title: string;
  message: string;
  type: string | null;
  link: string | null;
  is_read: boolean | null;
  created_at: string;
}

export interface PortalAnnouncement {
  id: string;
  title: string;
  body: string;
  is_pinned: boolean | null;
  created_at: string;
  committee_id: string | null;
  target_roles: string[] | null;
  is_active: boolean | null;
}

export interface DelegateActivity {
  id: string;
  action: string;
  performed_at: string;
  type: 'personal' | 'document' | 'announcement';
}

export interface DelegateSummary extends PortalUserSummary {
  user_id: string;
  country: string;
  seat_number: string;
}

export interface PortalDocument {
  id: string;
  user_id: string;
  committee_id?: string | null;
  title: string;
  type: string;
  status: string;
  file_url?: string | null;
  file_size?: number | null;
  uploaded_at: string;
  reviewed_at?: string | null;
  feedback?: string | null;
}
