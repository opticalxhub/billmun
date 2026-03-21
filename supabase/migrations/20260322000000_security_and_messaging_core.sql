-- Security operations + messaging core schema

-- =========================
-- Security tables
-- =========================
CREATE TABLE IF NOT EXISTS public.security_incidents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    incident_type TEXT NOT NULL,
    location TEXT NOT NULL,
    involved_parties JSONB DEFAULT '[]'::jsonb,
    description TEXT NOT NULL,
    severity TEXT NOT NULL,
    immediate_action TEXT,
    requires_eb_notification BOOLEAN DEFAULT false,
    status TEXT NOT NULL DEFAULT 'OPEN',
    resolution_note TEXT,
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reported_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.security_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    badge_number TEXT NOT NULL UNIQUE,
    badge_status TEXT NOT NULL DEFAULT 'ACTIVE',
    flagged_reason TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.security_badge_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES public.security_badges(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    location TEXT,
    reason TEXT,
    officer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.security_access_zones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    capacity INT DEFAULT 0,
    authorized_roles TEXT[] DEFAULT ARRAY[]::TEXT[],
    status TEXT NOT NULL DEFAULT 'OPEN',
    restricted_reason TEXT,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.security_zone_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    zone_id UUID NOT NULL REFERENCES public.security_access_zones(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    officer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.security_delegate_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    zone_id UUID REFERENCES public.security_access_zones(id) ON DELETE SET NULL,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_seen_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    missing BOOLEAN DEFAULT false,
    missing_note TEXT
);

CREATE TABLE IF NOT EXISTS public.security_briefings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.security_briefing_reads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    briefing_id UUID NOT NULL REFERENCES public.security_briefings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(briefing_id, user_id)
);

-- =========================
-- Messaging core tables
-- =========================
ALTER TABLE public.channels
    ADD COLUMN IF NOT EXISTS is_read_only BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(message_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS public.message_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.channel_message_dismissals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(channel_id, message_id, user_id)
);

ALTER TABLE public.channel_members
    ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'MEMBER',
    ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON public.security_incidents(status, severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_badge_events_user ON public.security_badge_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_zone_logs_zone ON public.security_zone_logs(zone_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_channel_created ON public.messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_channel_members_user ON public.channel_members(user_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_attachments_message ON public.message_attachments(message_id);

ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_badge_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_access_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_zone_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_delegate_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_briefing_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_message_dismissals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for now" ON public.security_incidents;
CREATE POLICY "Enable all access for now" ON public.security_incidents FOR ALL USING (true);
DROP POLICY IF EXISTS "Enable all access for now" ON public.security_badges;
CREATE POLICY "Enable all access for now" ON public.security_badges FOR ALL USING (true);
DROP POLICY IF EXISTS "Enable all access for now" ON public.security_badge_events;
CREATE POLICY "Enable all access for now" ON public.security_badge_events FOR ALL USING (true);
DROP POLICY IF EXISTS "Enable all access for now" ON public.security_access_zones;
CREATE POLICY "Enable all access for now" ON public.security_access_zones FOR ALL USING (true);
DROP POLICY IF EXISTS "Enable all access for now" ON public.security_zone_logs;
CREATE POLICY "Enable all access for now" ON public.security_zone_logs FOR ALL USING (true);
DROP POLICY IF EXISTS "Enable all access for now" ON public.security_delegate_locations;
CREATE POLICY "Enable all access for now" ON public.security_delegate_locations FOR ALL USING (true);
DROP POLICY IF EXISTS "Enable all access for now" ON public.security_briefings;
CREATE POLICY "Enable all access for now" ON public.security_briefings FOR ALL USING (true);
DROP POLICY IF EXISTS "Enable all access for now" ON public.security_briefing_reads;
CREATE POLICY "Enable all access for now" ON public.security_briefing_reads FOR ALL USING (true);
DROP POLICY IF EXISTS "Enable all access for now" ON public.message_reactions;
CREATE POLICY "Enable all access for now" ON public.message_reactions FOR ALL USING (true);
DROP POLICY IF EXISTS "Enable all access for now" ON public.message_attachments;
CREATE POLICY "Enable all access for now" ON public.message_attachments FOR ALL USING (true);
DROP POLICY IF EXISTS "Enable all access for now" ON public.channel_message_dismissals;
CREATE POLICY "Enable all access for now" ON public.channel_message_dismissals FOR ALL USING (true);
