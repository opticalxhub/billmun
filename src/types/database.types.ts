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
          role: 'DELEGATE' | 'CHAIR' | 'MEDIA' | 'EXECUTIVE_BOARD' | 'ADMIN' | 'SECURITY' | 'SECRETARY_GENERAL' | 'DEPUTY_SECRETARY_GENERAL';
          status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
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
          max_delegates: number;
          difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
          is_active: boolean;
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
      documents: {
        Row: {
          id: string;
          user_id: string;
          committee_id?: string;
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
      ai_feedback: {
        Row: {
          id: string;
          document_id: string;
          user_id: string;
          overall_score: number;
          argument_strength: number;
          research_depth: number;
          policy_alignment: number;
          writing_clarity: number;
          format_adherence: number;
          summary: string;
          strengths: string[];
          weaknesses: string[];
          suggestions: string[];
          annotated_segments: any;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ai_feedback']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['ai_feedback']['Insert']>;
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          body: string;
          author_id: string;
          is_pinned: boolean;
          target_roles: string[];
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['announcements']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['announcements']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
          is_read: boolean;
          link?: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id?: string;
          action: string;
          target_type: string;
          target_id: string;
          metadata?: any;
          performed_at: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'performed_at'>;
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>;
      };
      conference_settings: {
        Row: {
          id: '1';
          conference_name: string;
          conference_date: string;
          conference_location: string;
          registration_open: boolean;
          portal_message?: string;
          updated_at: string;
          updated_by_id?: string;
        };
        Insert: Database['public']['Tables']['conference_settings']['Row'];
        Update: Partial<Database['public']['Tables']['conference_settings']['Insert']>;
      };
    };
  };
};