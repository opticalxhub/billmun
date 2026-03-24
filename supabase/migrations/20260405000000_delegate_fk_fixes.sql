-- Migration: Fix foreign keys pointing to missing/deprecated delegate_profiles

-- 1. speeches
ALTER TABLE public.speeches DROP CONSTRAINT IF EXISTS speeches_user_id_fkey;
ALTER TABLE public.speeches ADD CONSTRAINT speeches_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 2. resolutions
ALTER TABLE public.resolutions DROP CONSTRAINT IF EXISTS resolutions_user_id_fkey;
ALTER TABLE public.resolutions DROP CONSTRAINT IF EXISTS resolutions_creator_id_fkey;
ALTER TABLE public.resolutions ADD CONSTRAINT resolutions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 3. blocs
ALTER TABLE public.blocs DROP CONSTRAINT IF EXISTS blocs_creator_id_fkey;
ALTER TABLE public.blocs ADD CONSTRAINT blocs_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- 4. bloc_members
ALTER TABLE public.bloc_members DROP CONSTRAINT IF EXISTS bloc_members_user_id_fkey;
ALTER TABLE public.bloc_members ADD CONSTRAINT bloc_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 5. strategy_board_private
ALTER TABLE public.strategy_board_private DROP CONSTRAINT IF EXISTS strategy_board_private_user_id_fkey;
ALTER TABLE public.strategy_board_private ADD CONSTRAINT strategy_board_private_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 6. bloc_documents
ALTER TABLE public.bloc_documents DROP CONSTRAINT IF EXISTS bloc_documents_uploader_id_fkey;
ALTER TABLE public.bloc_documents ADD CONSTRAINT bloc_documents_uploader_id_fkey FOREIGN KEY (uploader_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- 7. bloc_messages
ALTER TABLE public.bloc_messages DROP CONSTRAINT IF EXISTS bloc_messages_user_id_fkey;
ALTER TABLE public.bloc_messages ADD CONSTRAINT bloc_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 8. country_research
ALTER TABLE public.country_research DROP CONSTRAINT IF EXISTS country_research_user_id_fkey;
ALTER TABLE public.country_research ADD CONSTRAINT country_research_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
