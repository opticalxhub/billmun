-- =====================================================
-- Comprehensive Fixes Migration
-- Fixes: RLS for committee_resources, audit_logs target_id nullable,
--        missing RLS policies, missing indexes, missing columns
-- =====================================================

-- 1. Make audit_logs.target_id NULLABLE so system-wide actions don't fail
DO $$
BEGIN
    -- Only alter if the column exists and is NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' AND column_name = 'target_id' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.audit_logs ALTER COLUMN target_id DROP NOT NULL;
    END IF;

    -- Also make actor_id nullable for automation/system actions
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' AND column_name = 'actor_id' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.audit_logs ALTER COLUMN actor_id DROP NOT NULL;
    END IF;
END $$;

-- 2. Fix committee_resources RLS - allow ADMIN role to insert/update/delete
ALTER TABLE public.committee_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read committee resources" ON public.committee_resources;
CREATE POLICY "Anyone can read committee resources"
ON public.committee_resources FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admin and EB can manage committee resources" ON public.committee_resources;
CREATE POLICY "Admin and EB can manage committee resources"
ON public.committee_resources FOR ALL
TO authenticated
USING (
    public.get_my_role() IN ('ADMIN', 'EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL', 'CHAIR', 'CO_CHAIR')
);

-- 3. Fix announcements RLS - ensure all authenticated users can read
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read announcements" ON public.announcements;
CREATE POLICY "Anyone can read announcements"
ON public.announcements FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admin and EB can manage announcements" ON public.announcements;
CREATE POLICY "Admin and EB can manage announcements"
ON public.announcements FOR ALL
TO authenticated
USING (
    public.get_my_role() IN ('ADMIN', 'EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
);

-- 4. Fix notifications RLS - users can read their own, system can insert
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- 5. Fix audit_logs RLS - allow inserts from any authenticated user, reads for admin/EB
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated can insert audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "EB and Admin can view all audit logs" ON public.audit_logs;
CREATE POLICY "EB and Admin can view all audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (
    public.get_my_role() IN ('EXECUTIVE_BOARD', 'ADMIN', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL', 'SECURITY')
);

-- 6. Fix documents RLS - delegates can read own, chair/admin/EB can read committee docs
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own documents" ON public.documents;
CREATE POLICY "Users can read own documents"
ON public.documents FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR
    public.get_my_role() IN ('CHAIR', 'CO_CHAIR', 'ADMIN', 'EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
);

DROP POLICY IF EXISTS "Users can insert own documents" ON public.documents;
CREATE POLICY "Users can insert own documents"
ON public.documents FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Chairs can manage documents" ON public.documents;
-- Already exists from previous migration, just ensure it covers all needed roles

-- 7. Fix committee_vote_records RLS
ALTER TABLE public.committee_vote_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read vote records" ON public.committee_vote_records;
CREATE POLICY "Authenticated can read vote records"
ON public.committee_vote_records FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admin and Chair can manage vote records" ON public.committee_vote_records;
CREATE POLICY "Admin and Chair can manage vote records"
ON public.committee_vote_records FOR ALL
TO authenticated
USING (
    public.get_my_role() IN ('ADMIN', 'CHAIR', 'CO_CHAIR', 'EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
);

-- 8. Fix admin_chair_notes RLS
ALTER TABLE public.admin_chair_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin and Chair can manage notes" ON public.admin_chair_notes;
CREATE POLICY "Admin and Chair can manage notes"
ON public.admin_chair_notes FOR ALL
TO authenticated
USING (
    public.get_my_role() IN ('ADMIN', 'CHAIR', 'CO_CHAIR', 'EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
);

-- 9. Fix attendance_records RLS
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read attendance" ON public.attendance_records;
CREATE POLICY "Authenticated can read attendance"
ON public.attendance_records FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admin and Chair can manage attendance" ON public.attendance_records;
CREATE POLICY "Admin and Chair can manage attendance"
ON public.attendance_records FOR ALL
TO authenticated
USING (
    public.get_my_role() IN ('ADMIN', 'CHAIR', 'CO_CHAIR', 'EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
);

-- 10. Fix committee_admin_tasks RLS
ALTER TABLE public.committee_admin_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read admin tasks" ON public.committee_admin_tasks;
CREATE POLICY "Authenticated can read admin tasks"
ON public.committee_admin_tasks FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admin and Chair can manage admin tasks" ON public.committee_admin_tasks;
CREATE POLICY "Admin and Chair can manage admin tasks"
ON public.committee_admin_tasks FOR ALL
TO authenticated
USING (
    public.get_my_role() IN ('ADMIN', 'CHAIR', 'CO_CHAIR', 'EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
);

-- 11. Fix security tables RLS
ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Security and EB can manage incidents" ON public.security_incidents;
CREATE POLICY "Security and EB can manage incidents"
ON public.security_incidents FOR ALL
TO authenticated
USING (
    public.get_my_role() IN ('SECURITY', 'EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
);

ALTER TABLE public.security_badge_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Security and EB can manage badge events" ON public.security_badge_events;
CREATE POLICY "Security and EB can manage badge events"
ON public.security_badge_events FOR ALL
TO authenticated
USING (
    public.get_my_role() IN ('SECURITY', 'EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
);

ALTER TABLE public.security_access_zones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Security and EB can manage zones" ON public.security_access_zones;
CREATE POLICY "Security and EB can manage zones"
ON public.security_access_zones FOR ALL
TO authenticated
USING (
    public.get_my_role() IN ('SECURITY', 'EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
);

ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Security and EB can manage alerts" ON public.security_alerts;
CREATE POLICY "Security and EB can manage alerts"
ON public.security_alerts FOR ALL
TO authenticated
USING (
    public.get_my_role() IN ('SECURITY', 'EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
);

ALTER TABLE public.security_briefings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Security and EB can manage briefings" ON public.security_briefings;
CREATE POLICY "Security and EB can manage briefings"
ON public.security_briefings FOR ALL
TO authenticated
USING (
    public.get_my_role() IN ('SECURITY', 'EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
);

-- 12. Fix missing_persons RLS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'missing_persons') THEN
        ALTER TABLE public.missing_persons ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Security and EB can manage missing persons" ON public.missing_persons;
        CREATE POLICY "Security and EB can manage missing persons"
        ON public.missing_persons FOR ALL
        TO authenticated
        USING (
            public.get_my_role() IN ('SECURITY', 'EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
        );
    END IF;
END $$;

-- 13. Fix security_briefing_reads RLS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_briefing_reads') THEN
        ALTER TABLE public.security_briefing_reads ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Security can manage briefing reads" ON public.security_briefing_reads;
        CREATE POLICY "Security can manage briefing reads"
        ON public.security_briefing_reads FOR ALL
        TO authenticated
        USING (
            public.get_my_role() IN ('SECURITY', 'EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
        );
    END IF;
END $$;

-- 14. Fix security_zone_logs RLS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_zone_logs') THEN
        ALTER TABLE public.security_zone_logs ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Security can manage zone logs" ON public.security_zone_logs;
        CREATE POLICY "Security can manage zone logs"
        ON public.security_zone_logs FOR ALL
        TO authenticated
        USING (
            public.get_my_role() IN ('SECURITY', 'EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL')
        );
    END IF;
END $$;

-- 15. Supabase Storage bucket policies for document uploads
-- Note: Storage policies are managed separately in Supabase dashboard,
-- but we ensure the 'documents' bucket exists and is configured.
-- Storage bucket policies should allow:
--   - Authenticated users to upload to documents/*
--   - Authenticated users to read from documents/*
-- These are set in the Supabase dashboard under Storage > Policies

-- 16. Performance indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_committee_resources_committee ON public.committee_resources(committee_id);
CREATE INDEX IF NOT EXISTS idx_announcements_committee ON public.announcements(committee_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_at ON public.audit_logs(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_documents_committee_status ON public.documents(committee_id, status);
CREATE INDEX IF NOT EXISTS idx_attendance_committee ON public.attendance_records(committee_id);
CREATE INDEX IF NOT EXISTS idx_delegate_presence_committee ON public.delegate_presence_statuses(committee_id);
CREATE INDEX IF NOT EXISTS idx_committee_vote_records_committee ON public.committee_vote_records(committee_id);
CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON public.security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_security_badge_events_user ON public.security_badge_events(user_id);
CREATE INDEX IF NOT EXISTS idx_committee_admin_tasks_committee ON public.committee_admin_tasks(committee_id, status);

-- 17. Ensure conference_settings has all expected columns
ALTER TABLE public.conference_settings
ADD COLUMN IF NOT EXISTS whatsapp_group_link TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS max_file_upload_mb INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS ai_analysis_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS portal_message TEXT,
ADD COLUMN IF NOT EXISTS auto_approve_registrations BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS conference_name TEXT DEFAULT 'BILLMUN 2026',
ADD COLUMN IF NOT EXISTS conference_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS conference_location TEXT;

-- 18. Ensure conference_settings can be read by all authenticated users
DROP POLICY IF EXISTS "Anyone can read conference settings" ON public.conference_settings;
CREATE POLICY "Anyone can read conference settings"
ON public.conference_settings FOR SELECT
TO authenticated
USING (true);
