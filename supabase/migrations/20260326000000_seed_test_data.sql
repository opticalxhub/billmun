-- Insert test committee
INSERT INTO public.committees (id, name, abbreviation, topic, description, max_delegates, is_active, created_at, updated_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000', 
    'Test Security Council', 
    'TSC', 
    'Test Topic', 
    'A test committee for dashboard testing', 
    50, 
    true, 
    now(), 
    now()
) ON CONFLICT (id) DO NOTHING;

-- Create access zone if table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'access_zones') THEN
    INSERT INTO public.access_zones (id, name, description, capacity, status, is_active, authorized_roles)
    VALUES (
        '660e8400-e29b-41d4-a716-446655440000',
        'Test Zone',
        'Test zone description',
        100,
        'OPEN',
        true,
        ARRAY['DELEGATE', 'CHAIR', 'ADMIN', 'SECURITY', 'MEDIA', 'EXECUTIVE_BOARD']
    ) ON CONFLICT (name) DO NOTHING;
  END IF;
END $$;

-- Insert test users
INSERT INTO public.users (
    id, email, full_name, role, status, password_hash, 
    has_completed_onboarding, badge_status, created_at, updated_at
)
VALUES 
-- Delegate
('770e8400-e29b-41d4-a716-446655440001', 'test_delegate@billmun.sa', 'Test Delegate', 'DELEGATE', 'APPROVED', '$2a$10$xyz...', true, 'ACTIVE', now(), now()),
-- Chair
('770e8400-e29b-41d4-a716-446655440002', 'test_chair@billmun.sa', 'Test Chair', 'CHAIR', 'APPROVED', '$2a$10$xyz...', true, 'ACTIVE', now(), now()),
-- Admin
('770e8400-e29b-41d4-a716-446655440003', 'test_admin@billmun.sa', 'Test Admin', 'ADMIN', 'APPROVED', '$2a$10$xyz...', true, 'ACTIVE', now(), now()),
-- Security
('770e8400-e29b-41d4-a716-446655440004', 'test_security@billmun.sa', 'Test Security', 'SECURITY', 'APPROVED', '$2a$10$xyz...', true, 'ACTIVE', now(), now()),
-- Media
('770e8400-e29b-41d4-a716-446655440005', 'test_media@billmun.sa', 'Test Media', 'MEDIA', 'APPROVED', '$2a$10$xyz...', true, 'ACTIVE', now(), now()),
-- EB
('770e8400-e29b-41d4-a716-446655440006', 'test_executive_board@billmun.sa', 'Test EB', 'EXECUTIVE_BOARD', 'APPROVED', '$2a$10$xyz...', true, 'ACTIVE', now(), now())
ON CONFLICT (email) DO NOTHING;

-- Note: In a real environment, you should use an actual bcrypt hash for 'password123'. 
-- We recommend using the provided src/scripts/seed.ts instead to ensure passwords hash properly for NextAuth.

-- Insert assignments
INSERT INTO public.committee_assignments (id, user_id, committee_id, country)
VALUES 
('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Test Country'),
('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', NULL),
('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', NULL)
ON CONFLICT DO NOTHING;
