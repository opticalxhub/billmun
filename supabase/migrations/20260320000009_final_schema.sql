
-- Onboarding tracking
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT false;

-- Messaging schema
CREATE TABLE IF NOT EXISTS public.channels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'COMMITTEE', -- 'COMMITTEE', 'ROLE', 'BLOC', 'GLOBAL', 'DIRECT'
    committee_id UUID REFERENCES public.committees(id) ON DELETE CASCADE,
    bloc_id UUID REFERENCES public.blocs(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.channel_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(channel_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT,
    file_url TEXT,
    is_announcement BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Turn on realtime for messaging
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;
