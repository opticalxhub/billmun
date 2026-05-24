-- Delete assignments
DELETE FROM public.committee_assignments WHERE committee_id = '550e8400-e29b-41d4-a716-446655440000';

-- Delete users
DELETE FROM public.users WHERE email IN (
    'test_delegate@nxtmun.sa',
    'test_chair@nxtmun.sa',
    'test_admin@nxtmun.sa',
    'test_security@nxtmun.sa',
    'test_media@nxtmun.sa',
    'test_executive_board@nxtmun.sa'
);

-- Delete committee
DELETE FROM public.committees WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- Delete zone if exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'access_zones') THEN
    DELETE FROM public.access_zones WHERE name = 'Test Zone';
  END IF;
END $$;
