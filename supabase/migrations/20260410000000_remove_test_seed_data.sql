-- Remove test seed data inserted by 20260326000000_seed_test_data.sql

-- Remove test assignments
DELETE FROM public.committee_assignments WHERE id IN (
  '880e8400-e29b-41d4-a716-446655440001',
  '880e8400-e29b-41d4-a716-446655440002',
  '880e8400-e29b-41d4-a716-446655440003'
);

-- Remove test users
DELETE FROM public.users WHERE id IN (
  '770e8400-e29b-41d4-a716-446655440001',
  '770e8400-e29b-41d4-a716-446655440002',
  '770e8400-e29b-41d4-a716-446655440003',
  '770e8400-e29b-41d4-a716-446655440004',
  '770e8400-e29b-41d4-a716-446655440005',
  '770e8400-e29b-41d4-a716-446655440006'
);

-- Remove test committee
DELETE FROM public.committees WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- Remove test zone if exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'access_zones') THEN
    DELETE FROM public.access_zones WHERE id = '660e8400-e29b-41d4-a716-446655440000';
  END IF;
END $$;
