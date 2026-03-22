export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          password_hash: string;
          date_of_birth?: string;
          grade?: string;
          phone_number?: string;
          emergency_contact_name?: string;
          emergency_contact_relation?: string;
          emergency_contact_phone?: string;
          role: 'DELEGATE' | 'CHAIR' | 'CO_CHAIR' | 'MEDIA' | 'PRESS' | 'EXECUTIVE_BOARD' | 'ADMIN' | 'SECURITY' | 'SECRETARY_GENERAL' | 'DEPUTY_SECRETARY_GENERAL';
          status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
          preferred_committee?: string;
          allocated_country?: string;
          profile_image_url?: string;
          badge_status: string;
          current_zone_id?: string;
          ai_analyses_today: number;
          ai_analyses_reset_date?: string;
          has_completed_onboarding: boolean;
          dietary_restrictions?: string;
          approved_at?: string;
          approved_by_id?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      committees: {
        Row: {
          id: string;
          name: string;
          abbreviation: string;
          topic: string;
          description: string;
          image_url?: string;
          background_guide_url?: string;
          rop_url?: string;
          sub_topics?: string[];
          max_delegates: number;
          difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
          is_active: boolean;
          chair_id?: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['committees']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['committees']['Insert']>;
      };
      committee_assignments: {
        Row: {
          id: string;
          user_id: string;
          committee_id: string;
          country: string;
          seat_number?: string;
          assigned_at: string;
          assigned_by_id?: string;
        };
        Insert: Omit<Database['public']['Tables']['committee_assignments']['Row'], 'id' | 'assigned_at'>;
        Update: Partial<Database['public']['Tables']['committee_assignments']['Insert']>;
      };
      committee_sessions: {
        Row: {
          id: string;
          committee_id: string;
          status: string;
          debate_topic?: string;
          speaking_time_limit?: number;
          caucus_type: 'UNMODERATED' | 'MODERATED' | 'NONE';
          caucus_duration?: number;
          caucus_purpose?: string;
          break_type?: string;
          break_duration?: number;
          session_summary?: string;
          updated_at: string;
          updated_by_id?: string;
        };
        Insert: Omit<Database['public']['Tables']['committee_sessions']['Row'], 'id' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['committee_sessions']['Insert']>;
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          committee_id?: string;
          parent_document_id?: string;
          type: 'POSITION_PAPER' | 'SPEECH' | 'RESOLUTION';
          title: string;
          file_url: string;
          file_size: number;
          mime_type: string;
          status: 'PENDING' | 'APPROVED' | 'NEEDS_REVISION' | 'REJECTED';
          feedback?: string;
          uploaded_at: string;
          reviewed_at?: string;
          reviewed_by_id?: string;
        };
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id' | 'uploaded_at'>;
        Update: Partial<Database['public']['Tables']['documents']['Insert']>;
      };
      document_versions: {
        Row: {
          id: string;
          document_id: string;
          version: number;
          file_url: string;
          file_size: number;
          uploaded_at: string;
        };
        Insert: Omit<Database['public']['Tables']['document_versions']['Row'], 'id' | 'uploaded_at'>;
        Update: Partial<Database['public']['Tables']['document_versions']['Insert']>;
      };
      document_status_history: {
        Row: {
          id: string;
          document_id: string;
          status: string;
          changed_by_id?: string;
          note?: string;
          changed_at: string;
        };
        Insert: Omit<Database['public']['Tables']['document_status_history']['Row'], 'id' | 'changed_at'>;
        Update: Partial<Database['public']['Tables']['document_status_history']['Insert']>;
      };
      ai_feedback: {
        Row: {
          id: string;
          document_id?: string;
          user_id: string;
          input_text: string;
          overall_score: number;
          argument_strength: number;
          research_depth: number;
          policy_alignment: number;
          writing_clarity: number;
          format_adherence: number;
          diplomatic_language: number;
          persuasiveness: number;
          ai_detection_score: number;
          ai_detection_phrases: string[];
          summary: string;
          strengths: string[];
          weaknesses: string[];
          suggestions: string[];
          annotated_segments: any;
          generated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ai_feedback']['Row'], 'id' | 'generated_at'>;
        Update: Partial<Database['public']['Tables']['ai_feedback']['Insert']>;
      };
      chair_ai_runs: {
        Row: {
          id: string;
          chair_id: string;
          committee_id: string;
          tool: string;
          input_text: string;
          score?: number;
          summary?: string;
          sections?: any;
          suggestions?: string[];
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['chair_ai_runs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['chair_ai_runs']['Insert']>;
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          body: string;
          author_id: string;
          is_pinned: boolean;
          target_roles: string[];
          committee_id?: string;
          scheduled_for?: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['announcements']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['announcements']['Insert']>;
      };
      user_announcement_dismissals: {
        Row: {
          id: string;
          announcement_id: string;
          user_id: string;
          dismissed_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_announcement_dismissals']['Row'], 'id' | 'dismissed_at'>;
        Update: Partial<Database['public']['Tables']['user_announcement_dismissals']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          is_read: boolean;
          link?: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
      schedule_events: {
        Row: {
          id: string;
          day_label: string;
          event_name: string;
          location: string;
          start_time: string;
          end_time: string;
          description?: string;
          applicable_roles: string[];
          order_index: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['schedule_events']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['schedule_events']['Insert']>;
      };
      speeches: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          notes?: string;
          word_count: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['speeches']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['speeches']['Insert']>;
      };
      country_research: {
        Row: {
          id: string;
          user_id: string;
          country_notes?: string;
          previous_resolutions?: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['country_research']['Row'], 'id' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['country_research']['Insert']>;
      };
      stance_notes: {
        Row: {
          id: string;
          user_id: string;
          sub_topic: string;
          stance: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['stance_notes']['Row'], 'id' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['stance_notes']['Insert']>;
      };
      personal_tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          notes?: string;
          due_at?: string;
          is_completed: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['personal_tasks']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['personal_tasks']['Insert']>;
      };
      blocs: {
        Row: {
          id: string;
          name: string;
          description?: string;
          invite_code: string;
          creator_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['blocs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['blocs']['Insert']>;
      };
      bloc_members: {
        Row: {
          id: string;
          bloc_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: Omit<Database['public']['Tables']['bloc_members']['Row'], 'id' | 'joined_at'>;
        Update: Partial<Database['public']['Tables']['bloc_members']['Insert']>;
      };
      bloc_messages: {
        Row: {
          id: string;
          bloc_id: string;
          user_id: string;
          content: string;
          file_url?: string;
          file_name?: string;
          reply_to_id?: string;
          reactions?: any;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['bloc_messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['bloc_messages']['Insert']>;
      };
      bloc_documents: {
        Row: {
          id: string;
          bloc_id: string;
          uploader_id: string;
          title: string;
          file_url: string;
          file_size: number;
          uploaded_at: string;
        };
        Insert: Omit<Database['public']['Tables']['bloc_documents']['Row'], 'id' | 'uploaded_at'>;
        Update: Partial<Database['public']['Tables']['bloc_documents']['Insert']>;
      };
      strategy_board: {
        Row: {
          id: string;
          bloc_id: string;
          shared_content?: string;
          last_edited_by_id?: string;
          last_edited_at: string;
        };
        Insert: Omit<Database['public']['Tables']['strategy_board']['Row'], 'id' | 'last_edited_at'>;
        Update: Partial<Database['public']['Tables']['strategy_board']['Insert']>;
      };
      strategy_board_private: {
        Row: {
          id: string;
          bloc_id: string;
          user_id: string;
          content?: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['strategy_board_private']['Row'], 'id' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['strategy_board_private']['Insert']>;
      };
      resolutions: {
        Row: {
          id: string;
          user_id: string;
          committee_id: string;
          title: string;
          topic?: string;
          co_sponsors?: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['resolutions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['resolutions']['Insert']>;
      };
      resolution_clauses: {
        Row: {
          id: string;
          resolution_id: string;
          type: 'PREAMBULATORY' | 'OPERATIVE';
          opening_phrase: string;
          content: string;
          order_index: number;
          parent_clause_id?: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['resolution_clauses']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['resolution_clauses']['Insert']>;
      };
      roll_call_records: {
        Row: {
          id: string;
          committee_id: string;
          session_id: string;
          started_at: string;
          completed_at?: string;
          quorum_established: boolean;
          created_by: string;
        };
        Insert: Omit<Database['public']['Tables']['roll_call_records']['Row'], 'id' | 'started_at'>;
        Update: Partial<Database['public']['Tables']['roll_call_records']['Insert']>;
      };
      roll_call_entries: {
        Row: {
          id: string;
          roll_call_id: string;
          delegate_id: string;
          assignment_id: string;
          status: string;
        };
        Insert: Omit<Database['public']['Tables']['roll_call_entries']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['roll_call_entries']['Insert']>;
      };
      speakers_list: {
        Row: {
          id: string;
          committee_id: string;
          session_id: string;
          delegate_id: string;
          position: number;
          status: string;
          speaking_time_limit: number;
          actual_speaking_time?: number;
          yield_type?: string;
          yield_to_id?: string;
          started_at?: string;
          completed_at?: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['speakers_list']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['speakers_list']['Insert']>;
      };
      points_and_motions: {
        Row: {
          id: string;
          committee_id: string;
          session_id: string;
          delegate_id?: string;
          type: string;
          description?: string;
          outcome: string;
          votes_for?: number;
          votes_against?: number;
          votes_abstain?: number;
          created_at: string;
          created_by: string;
        };
        Insert: Omit<Database['public']['Tables']['points_and_motions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['points_and_motions']['Insert']>;
      };
      timer_logs: {
        Row: {
          id: string;
          committee_id: string;
          session_id: string;
          label: string;
          set_duration: number;
          actual_duration?: number;
          started_at: string;
          completed_at?: string;
          created_by: string;
        };
        Insert: Omit<Database['public']['Tables']['timer_logs']['Row'], 'id' | 'started_at'>;
        Update: Partial<Database['public']['Tables']['timer_logs']['Insert']>;
      };
      session_events: {
        Row: {
          id: string;
          committee_id: string;
          session_id: string;
          event_type: string;
          title: string;
          description?: string;
          metadata?: any;
          created_at: string;
          created_by: string;
        };
        Insert: Omit<Database['public']['Tables']['session_events']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['session_events']['Insert']>;
      };
      delegate_ratings: {
        Row: {
          id: string;
          committee_id: string;
          delegate_id: string;
          rated_by: string;
          argumentation_quality: number;
          diplomacy: number;
          preparation: number;
          private_notes?: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['delegate_ratings']['Row'], 'id' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['delegate_ratings']['Insert']>;
      };
      best_delegate_nominees: {
        Row: {
          id: string;
          committee_id: string;
          delegate_id: string;
          nominated_by: string;
          justification: string;
          is_winner: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['best_delegate_nominees']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['best_delegate_nominees']['Insert']>;
      };
      chair_preparation: {
        Row: {
          id: string;
          committee_id: string;
          chair_id: string;
          checklist?: any;
          research_notes?: string;
          country_positions?: any;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['chair_preparation']['Row'], 'id' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['chair_preparation']['Insert']>;
      };
      delegate_presence_statuses: {
        Row: {
          id: string;
          committee_id: string;
          user_id: string;
          current_status: string;
          last_changed_by: string;
          last_changed_at: string;
          note?: string;
        };
        Insert: Omit<Database['public']['Tables']['delegate_presence_statuses']['Row'], 'id' | 'last_changed_at'>;
        Update: Partial<Database['public']['Tables']['delegate_presence_statuses']['Insert']>;
      };
      delegate_presence_history: {
        Row: {
          id: string;
          committee_id: string;
          user_id: string;
          status: string;
          changed_by: string;
          changed_at: string;
          note?: string;
        };
        Insert: Omit<Database['public']['Tables']['delegate_presence_history']['Row'], 'id' | 'changed_at'>;
        Update: Partial<Database['public']['Tables']['delegate_presence_history']['Insert']>;
      };
      attendance_records: {
        Row: {
          id: string;
          committee_id: string;
          user_id: string;
          session_start: string;
          session_end?: string;
          status: string;
          corrected_by?: string;
          correction_note?: string;
          corrected_at?: string;
        };
        Insert: Omit<Database['public']['Tables']['attendance_records']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['attendance_records']['Insert']>;
      };
      committee_resources: {
        Row: {
          id: string;
          committee_id: string;
          title: string;
          description?: string;
          file_url: string;
          uploaded_by: string;
          archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['committee_resources']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['committee_resources']['Insert']>;
      };
      committee_vote_records: {
        Row: {
          id: string;
          committee_id: string;
          motion_type: string;
          outcome: string;
          votes_for: number;
          votes_against: number;
          abstentions: number;
          recorded_votes?: any;
          recorded_by: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['committee_vote_records']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['committee_vote_records']['Insert']>;
      };
      committee_seating_assignments: {
        Row: {
          id: string;
          committee_id: string;
          user_id: string;
          seat_label: string;
          updated_by: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['committee_seating_assignments']['Row'], 'id' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['committee_seating_assignments']['Insert']>;
      };
      admin_chair_notes: {
        Row: {
          id: string;
          committee_id: string;
          admin_user_id: string;
          chair_user_id: string;
          note_text: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['admin_chair_notes']['Row'], 'id' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['admin_chair_notes']['Insert']>;
      };
      committee_admin_tasks: {
        Row: {
          id: string;
          committee_id: string;
          created_by: string;
          assigned_admin_id?: string;
          title: string;
          description?: string;
          priority: string;
          status: string;
          due_at?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['committee_admin_tasks']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['committee_admin_tasks']['Insert']>;
      };
      user_notes: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          author_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_notes']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['user_notes']['Insert']>;
      };
      user_field_history: {
        Row: {
          id: string;
          user_id: string;
          field_name: string;
          old_value: string;
          new_value: string;
          changed_by_id: string;
          changed_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_field_history']['Row'], 'id' | 'changed_at'>;
        Update: Partial<Database['public']['Tables']['user_field_history']['Insert']>;
      };
      delegate_status_log: {
        Row: {
          id: string;
          user_id: string;
          status: string;
          logged_by: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['delegate_status_log']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['delegate_status_log']['Insert']>;
      };
      eb_tasks: {
        Row: {
          id: string;
          title: string;
          description?: string;
          status: string;
          priority: string;
          assigned_to?: string;
          created_by: string;
          due_at?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['eb_tasks']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['eb_tasks']['Insert']>;
      };
      mass_emails: {
        Row: {
          id: string;
          subject: string;
          body_html: string;
          recipient_count: number;
          sent_by: string;
          sent_at: string;
        };
        Insert: Omit<Database['public']['Tables']['mass_emails']['Row'], 'id' | 'sent_at'>;
        Update: Partial<Database['public']['Tables']['mass_emails']['Insert']>;
      };
      security_access_zones: {
        Row: {
          id: string;
          name: string;
          description?: string;
          capacity?: number;
          authorized_roles: string[];
          status: string;
          is_active: boolean;
          restricted_reason?: string;
          updated_by?: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['security_access_zones']['Row'], 'id' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['security_access_zones']['Insert']>;
      };
      security_incidents: {
        Row: {
          id: string;
          incident_type: string;
          location: string;
          involved_parties?: any;
          description: string;
          severity: string;
          immediate_action?: string;
          requires_eb_notification: boolean;
          status: string;
          resolution_note?: string;
          assigned_to?: string;
          reported_by?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['security_incidents']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['security_incidents']['Insert']>;
      };
      security_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_number: string;
          badge_status: string;
          flagged_reason?: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['security_badges']['Row'], 'id' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['security_badges']['Insert']>;
      };
      security_badge_events: {
        Row: {
          id: string;
          user_id: string;
          badge_id?: string;
          action: string;
          location?: string;
          reason?: string;
          officer_id?: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['security_badge_events']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['security_badge_events']['Insert']>;
      };
      security_zone_logs: {
        Row: {
          id: string;
          zone_id: string;
          user_id: string;
          action: string;
          officer_id?: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['security_zone_logs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['security_zone_logs']['Insert']>;
      };
      security_delegate_locations: {
        Row: {
          id: string;
          user_id: string;
          zone_id?: string;
          last_seen_at: string;
          last_seen_by?: string;
          missing: boolean;
          missing_note?: string;
        };
        Insert: Omit<Database['public']['Tables']['security_delegate_locations']['Row'], 'id' | 'last_seen_at'>;
        Update: Partial<Database['public']['Tables']['security_delegate_locations']['Insert']>;
      };
      missing_persons: {
        Row: {
          id: string;
          user_id: string;
          last_known_location?: string;
          reported_by?: string;
          resolved: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['missing_persons']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['missing_persons']['Insert']>;
      };
      security_alerts: {
        Row: {
          id: string;
          severity: string;
          message: string;
          sent_by: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['security_alerts']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['security_alerts']['Insert']>;
      };
      security_briefings: {
        Row: {
          id: string;
          title: string;
          body: string;
          created_by?: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['security_briefings']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['security_briefings']['Insert']>;
      };
      security_briefing_reads: {
        Row: {
          id: string;
          briefing_id: string;
          user_id: string;
          read_at: string;
        };
        Insert: Omit<Database['public']['Tables']['security_briefing_reads']['Row'], 'id' | 'read_at'>;
        Update: Partial<Database['public']['Tables']['security_briefing_reads']['Insert']>;
      };
      media_gallery: {
        Row: {
          id: string;
          uploader_id?: string;
          title?: string;
          media_url: string;
          media_type: 'image' | 'video';
          mime_type?: string;
          file_size?: number;
          caption?: string;
          committee_tag?: string;
          event_tag?: string;
          status: 'PENDING' | 'APPROVED' | 'REJECTED';
          approved_at?: string;
          rejection_reason?: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['media_gallery']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['media_gallery']['Insert']>;
      };
      press_releases: {
        Row: {
          id: string;
          author_id: string;
          title: string;
          body: string;
          target_committee_id?: string;
          status: string;
          eb_notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['press_releases']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['press_releases']['Insert']>;
      };
      channels: {
        Row: {
          id: string;
          name: string;
          type: string;
          committee_id?: string;
          bloc_id?: string;
          is_read_only: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['channels']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['channels']['Insert']>;
      };
      channel_members: {
        Row: {
          id: string;
          channel_id: string;
          user_id: string;
          role: string;
          last_read_at: string;
          joined_at: string;
        };
        Insert: Omit<Database['public']['Tables']['channel_members']['Row'], 'id' | 'joined_at'>;
        Update: Partial<Database['public']['Tables']['channel_members']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          channel_id: string;
          sender_id: string;
          content: string;
          type: string;
          file_url?: string;
          is_announcement: boolean;
          is_pinned: boolean;
          pinned_at?: string;
          pinned_by_id?: string;
          reply_to_id?: string;
          reactions?: any;
          created_at: string;
          edited_at?: string;
          deleted_at?: string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
      message_reactions: {
        Row: {
          id: string;
          message_id: string;
          user_id: string;
          emoji: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['message_reactions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['message_reactions']['Insert']>;
      };
      message_attachments: {
        Row: {
          id: string;
          message_id: string;
          file_url: string;
          file_name: string;
          file_size: number;
          mime_type: string;
          uploaded_at: string;
        };
        Insert: Omit<Database['public']['Tables']['message_attachments']['Row'], 'id' | 'uploaded_at'>;
        Update: Partial<Database['public']['Tables']['message_attachments']['Insert']>;
      };
      channel_message_dismissals: {
        Row: {
          id: string;
          channel_id: string;
          message_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['channel_message_dismissals']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['channel_message_dismissals']['Insert']>;
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id?: string;
          action: string;
          target_type: string;
          target_id: string;
          metadata?: any;
          ip_address?: string;
          performed_at: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'performed_at'>;
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>;
      };
      password_reset_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          expires_at: string;
          used_at?: string;
        };
        Insert: Omit<Database['public']['Tables']['password_reset_tokens']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['password_reset_tokens']['Insert']>;
      };
      emergency_sessions: {
        Row: {
          id: string;
          expires_at: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['emergency_sessions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['emergency_sessions']['Insert']>;
      };
      conference_settings: {
        Row: {
          id: string;
          conference_name: string;
          conference_date: string;
          conference_location: string;
          registration_open: boolean;
          auto_approve_registrations: boolean;
          portal_message?: string;
          updated_at: string;
          updated_by_id?: string;
          maintenance_mode: boolean;
          ai_analysis_enabled: boolean;
          max_file_upload_mb: number;
          emergency_contact_phone?: string;
        };
        Insert: Omit<Database['public']['Tables']['conference_settings']['Row'], 'id' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['conference_settings']['Insert']>;
      };
    };
  };
};
