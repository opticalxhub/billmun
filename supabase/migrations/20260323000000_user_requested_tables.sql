-- Fix Schema for the User's exact table names

-- incidents table
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    incident_type TEXT NOT NULL,
    location TEXT NOT NULL,
    involved_parties JSONB DEFAULT '[]'::jsonb,
    description TEXT NOT NULL,
    severity TEXT NOT NULL,
    immediate_action TEXT,
    notify_eb BOOLEAN DEFAULT false,
    status TEXT NOT NULL DEFAULT 'OPEN',
    resolution_note TEXT,
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reported_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- badge_checkins table
CREATE TABLE IF NOT EXISTS public.badge_checkins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    checked_in_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- users badge_status field
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS badge_status TEXT DEFAULT 'ACTIVE';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS current_zone_id UUID;

-- badge_events table
CREATE TABLE IF NOT EXISTS public.badge_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    location TEXT,
    reason TEXT,
    officer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- access_zones table
CREATE TABLE IF NOT EXISTS public.access_zones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    capacity INT DEFAULT 0,
    authorized_roles TEXT[] DEFAULT ARRAY[]::TEXT[],
    status TEXT NOT NULL DEFAULT 'OPEN',
    is_active BOOLEAN DEFAULT true,
    restricted_reason TEXT,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.users ADD CONSTRAINT fk_current_zone FOREIGN KEY (current_zone_id) REFERENCES public.access_zones(id) ON DELETE SET NULL;

-- missing_persons table
CREATE TABLE IF NOT EXISTS public.missing_persons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    last_known_location TEXT,
    reported_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- security_alerts table (already exists in migrations but let's ensure it)
CREATE TABLE IF NOT EXISTS public.security_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    severity TEXT NOT NULL,
    message TEXT NOT NULL,
    sent_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- security_briefings table
CREATE TABLE IF NOT EXISTS public.security_briefings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- briefing_reads table
CREATE TABLE IF NOT EXISTS public.briefing_reads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    briefing_id UUID NOT NULL REFERENCES public.security_briefings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(briefing_id, user_id)
);

-- delegate_status_log table
CREATE TABLE IF NOT EXISTS public.delegate_status_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    logged_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- user_notes table
CREATE TABLE IF NOT EXISTS public.user_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    is_pinned BOOLEAN DEFAULT false,
    target_roles TEXT[] DEFAULT ARRAY[]::TEXT[],
    committee_id UUID REFERENCES public.committees(id) ON DELETE SET NULL,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- user_announcement_dismissals table
CREATE TABLE IF NOT EXISTS public.user_announcement_dismissals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(announcement_id, user_id)
);

-- eb_tasks table
CREATE TABLE IF NOT EXISTS public.eb_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missing_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefing_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delegate_status_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_announcement_dismissals ENABLE ROW LEVEL SECURITY;

-- Allow all for now
CREATE POLICY "Enable all access for now" ON public.incidents FOR ALL USING (true);
CREATE POLICY "Enable all access for now" ON public.badge_checkins FOR ALL USING (true);
CREATE POLICY "Enable all access for now" ON public.badge_events FOR ALL USING (true);
CREATE POLICY "Enable all access for now" ON public.access_zones FOR ALL USING (true);
CREATE POLICY "Enable all access for now" ON public.missing_persons FOR ALL USING (true);
CREATE POLICY "Enable all access for now" ON public.security_alerts FOR ALL USING (true);
CREATE POLICY "Enable all access for now" ON public.security_briefings FOR ALL USING (true);
CREATE POLICY "Enable all access for now" ON public.briefing_reads FOR ALL USING (true);
CREATE POLICY "Enable all access for now" ON public.delegate_status_log FOR ALL USING (true);
CREATE POLICY "Enable all access for now" ON public.user_notes FOR ALL USING (true);
CREATE POLICY "Enable all access for now" ON public.notifications FOR ALL USING (true);
CREATE POLICY "Enable all access for now" ON public.announcements FOR ALL USING (true);
CREATE POLICY "Enable all access for now" ON public.user_announcement_dismissals FOR ALL USING (true);

-- force reload schema cache
NOTIFY pgrst, 'reload schema';
