-- Fix blocs table column names (camelCase migration missed these)
DO $$
BEGIN
    -- blocs: committeeId -> committee_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blocs' AND column_name='committeeId') THEN
        ALTER TABLE public.blocs RENAME COLUMN "committeeId" TO committee_id;
    END IF;

    -- blocs: creatorId -> creator_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blocs' AND column_name='creatorId') THEN
        ALTER TABLE public.blocs RENAME COLUMN "creatorId" TO creator_id;
    END IF;

    -- blocs: inviteCode -> invite_code
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blocs' AND column_name='inviteCode') THEN
        ALTER TABLE public.blocs RENAME COLUMN "inviteCode" TO invite_code;
    END IF;

    -- blocs: strategyBoard -> strategy_board
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blocs' AND column_name='strategyBoard') THEN
        ALTER TABLE public.blocs RENAME COLUMN "strategyBoard" TO strategy_board;
    END IF;

    -- blocs: createdAt -> created_at
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blocs' AND column_name='createdAt') THEN
        ALTER TABLE public.blocs RENAME COLUMN "createdAt" TO created_at;
    END IF;

    -- bloc_members: blocId -> bloc_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bloc_members' AND column_name='blocId') THEN
        ALTER TABLE public.bloc_members RENAME COLUMN "blocId" TO bloc_id;
    END IF;

    -- bloc_members: userId -> user_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bloc_members' AND column_name='userId') THEN
        ALTER TABLE public.bloc_members RENAME COLUMN "userId" TO user_id;
    END IF;

    -- bloc_members: joinedAt -> joined_at
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bloc_members' AND column_name='joinedAt') THEN
        ALTER TABLE public.bloc_members RENAME COLUMN "joinedAt" TO joined_at;
    END IF;

    -- bloc_members: individualContribution -> individual_contribution
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bloc_members' AND column_name='individualContribution') THEN
        ALTER TABLE public.bloc_members RENAME COLUMN "individualContribution" TO individual_contribution;
    END IF;
END $$;

-- Also ensure user_notes content column is nullable (may have failed if already nullable)
DO $$
BEGIN
    ALTER TABLE public.user_notes ALTER COLUMN content DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Create admin_chair_notes table if missing
CREATE TABLE IF NOT EXISTS public.admin_chair_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
    admin_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    chair_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    note_text TEXT DEFAULT '',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(committee_id)
);
ALTER TABLE public.admin_chair_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access admin_chair_notes" ON public.admin_chair_notes;
CREATE POLICY "Enable all access admin_chair_notes" ON public.admin_chair_notes FOR ALL USING (true) WITH CHECK (true);
