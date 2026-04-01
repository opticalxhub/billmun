-- BILLMUN Conference Schedule Migration
-- Matches the official BILLMUN AGENDA exactly
-- All times in KSA (UTC+3) — April 3 = Friday (Day 1), April 4 = Saturday (Day 2)
-- Safe to run multiple times (clears old data first)

-- Clear any existing schedule data
DELETE FROM schedule_events;
DELETE FROM committee_schedules;

-- Committee IDs (from DB):
-- CRISIS:  1662389a-2647-4deb-be8f-38ed0aa89a5d
-- DISEC:   b4c4065c-978d-49c0-9090-b2c35f77c447
-- ECOSOC:  2e4ff931-0923-453f-81ab-a87f396d8788
-- ICJ:     173de8ef-9309-4219-897e-cbb262aa8b71
-- SPECIAL: 18b4925e-910d-4b3e-9c8f-12178572c9b0
-- UNESCO:  a6e67726-dc1d-4061-a29a-a20e1a217c5c
-- UNHC:    4665cf02-3b8d-4cd9-883d-812a40134423
-- UNSC:    cc182006-8fd6-42bb-9c20-f1ada87fd197

-- ============================================
-- DAY 1 — Friday, April 3rd, 2026
-- ============================================

INSERT INTO schedule_events (event_name, location, start_time, end_time, description, day_label, applicable_roles) VALUES
('Registration',            'Main Lobby',           '2026-04-03T12:30:00+03:00', '2026-04-03T14:00:00+03:00', 'Check-in, badge collection, and orientation', 'Day 1', ARRAY['DELEGATE','CHAIR','CO_CHAIR','EXECUTIVE_BOARD','SECRETARY_GENERAL','DEPUTY_SECRETARY_GENERAL','SECURITY','PRESS','MEDIA','ADMIN']),
('Opening Ceremony',        'Main Hall',            '2026-04-03T14:00:00+03:00', '2026-04-03T15:00:00+03:00', 'Welcome address and keynote speeches', 'Day 1', ARRAY['DELEGATE','CHAIR','CO_CHAIR','EXECUTIVE_BOARD','SECRETARY_GENERAL','DEPUTY_SECRETARY_GENERAL','SECURITY','PRESS','MEDIA','ADMIN']),
('Transition Into Committee','',                    '2026-04-03T15:00:00+03:00', '2026-04-03T15:10:00+03:00', 'Move to committee rooms', 'Day 1', ARRAY['DELEGATE','CHAIR','CO_CHAIR','EXECUTIVE_BOARD','SECRETARY_GENERAL','DEPUTY_SECRETARY_GENERAL']),
('Committee Session I',     'Committee Rooms',      '2026-04-03T15:10:00+03:00', '2026-04-03T16:40:00+03:00', 'Roll call, agenda setting, opening speeches', 'Day 1', ARRAY['DELEGATE','CHAIR','CO_CHAIR','EXECUTIVE_BOARD','SECRETARY_GENERAL','DEPUTY_SECRETARY_GENERAL']),
('In-Committee Break',      'Refreshment Area',     '2026-04-03T16:40:00+03:00', '2026-04-03T17:00:00+03:00', 'Refreshments and networking', 'Day 1', ARRAY['DELEGATE','CHAIR','CO_CHAIR','EXECUTIVE_BOARD','SECRETARY_GENERAL','DEPUTY_SECRETARY_GENERAL','SECURITY','PRESS','MEDIA','ADMIN']),
('Committee Session II',    'Committee Rooms',      '2026-04-03T17:00:00+03:00', '2026-04-03T18:30:00+03:00', 'Moderated and unmoderated caucuses', 'Day 1', ARRAY['DELEGATE','CHAIR','CO_CHAIR','EXECUTIVE_BOARD','SECRETARY_GENERAL','DEPUTY_SECRETARY_GENERAL']),
('Lunch & Prayer Break',    'Dining Hall / Prayer Room','2026-04-03T18:30:00+03:00', '2026-04-03T19:50:00+03:00', 'Dinner, Maghrib prayer, and refreshments', 'Day 1', ARRAY['DELEGATE','CHAIR','CO_CHAIR','EXECUTIVE_BOARD','SECRETARY_GENERAL','DEPUTY_SECRETARY_GENERAL','SECURITY','PRESS','MEDIA','ADMIN']),
('Committee Session III',   'Committee Rooms',      '2026-04-03T19:50:00+03:00', '2026-04-03T21:00:00+03:00', 'Continued debate, draft resolutions', 'Day 1', ARRAY['DELEGATE','CHAIR','CO_CHAIR','EXECUTIVE_BOARD','SECRETARY_GENERAL','DEPUTY_SECRETARY_GENERAL']),
('Dismissal',               'Main Lobby',           '2026-04-03T21:05:00+03:00', '2026-04-03T21:30:00+03:00', 'End of Day 1', 'Day 1', ARRAY['DELEGATE','CHAIR','CO_CHAIR','EXECUTIVE_BOARD','SECRETARY_GENERAL','DEPUTY_SECRETARY_GENERAL','SECURITY','PRESS','MEDIA','ADMIN']);

-- ============================================
-- DAY 2 — Saturday, April 4th, 2026
-- ============================================

INSERT INTO schedule_events (event_name, location, start_time, end_time, description, day_label, applicable_roles) VALUES
('Arrival',                         'Main Lobby',           '2026-04-04T07:00:00+03:00', '2026-04-04T08:00:00+03:00', 'Check-in and preparation for Day 2', 'Day 2', ARRAY['DELEGATE','CHAIR','CO_CHAIR','EXECUTIVE_BOARD','SECRETARY_GENERAL','DEPUTY_SECRETARY_GENERAL','SECURITY','PRESS','MEDIA','ADMIN']),
('Committee Session IV',            'Committee Rooms',      '2026-04-04T08:00:00+03:00', '2026-04-04T09:30:00+03:00', 'Resume debate, working papers and amendments', 'Day 2', ARRAY['DELEGATE','CHAIR','CO_CHAIR','EXECUTIVE_BOARD','SECRETARY_GENERAL','DEPUTY_SECRETARY_GENERAL']),
('In-Committee Break & Breakfast',  'Refreshment Area',     '2026-04-04T09:30:00+03:00', '2026-04-04T09:50:00+03:00', 'Breakfast and refreshments', 'Day 2', ARRAY['DELEGATE','CHAIR','CO_CHAIR','EXECUTIVE_BOARD','SECRETARY_GENERAL','DEPUTY_SECRETARY_GENERAL','SECURITY','PRESS','MEDIA','ADMIN']),
('Committee Session V',             'Committee Rooms',      '2026-04-04T09:50:00+03:00', '2026-04-04T11:45:00+03:00', 'Continued debate and resolution drafting', 'Day 2', ARRAY['DELEGATE','CHAIR','CO_CHAIR','EXECUTIVE_BOARD','SECRETARY_GENERAL','DEPUTY_SECRETARY_GENERAL']),
('Prayer Break',                    'Prayer Room',          '2026-04-04T11:45:00+03:00', '2026-04-04T12:25:00+03:00', 'Dhuhr prayer and break', 'Day 2', ARRAY['DELEGATE','CHAIR','CO_CHAIR','EXECUTIVE_BOARD','SECRETARY_GENERAL','DEPUTY_SECRETARY_GENERAL','SECURITY','PRESS','MEDIA','ADMIN']),
('Committee Session VI',            'Committee Rooms',      '2026-04-04T12:25:00+03:00', '2026-04-04T13:45:00+03:00', 'Resolution presentations and voting procedures', 'Day 2', ARRAY['DELEGATE','CHAIR','CO_CHAIR','EXECUTIVE_BOARD','SECRETARY_GENERAL','DEPUTY_SECRETARY_GENERAL']),
('Lunch Break',                     'Dining Hall',          '2026-04-04T13:45:00+03:00', '2026-04-04T15:15:00+03:00', 'Lunch break', 'Day 2', ARRAY['DELEGATE','CHAIR','CO_CHAIR','EXECUTIVE_BOARD','SECRETARY_GENERAL','DEPUTY_SECRETARY_GENERAL','SECURITY','PRESS','MEDIA','ADMIN']),
('Committee Session VII',           'Committee Rooms',      '2026-04-04T15:15:00+03:00', '2026-04-04T16:30:00+03:00', 'Final voting on resolutions', 'Day 2', ARRAY['DELEGATE','CHAIR','CO_CHAIR','EXECUTIVE_BOARD','SECRETARY_GENERAL','DEPUTY_SECRETARY_GENERAL']),
('In-Committee Break',              'Refreshment Area',     '2026-04-04T16:30:00+03:00', '2026-04-04T16:50:00+03:00', 'Short break before final session', 'Day 2', ARRAY['DELEGATE','CHAIR','CO_CHAIR','EXECUTIVE_BOARD','SECRETARY_GENERAL','DEPUTY_SECRETARY_GENERAL','SECURITY','PRESS','MEDIA','ADMIN']),
('Committee Session VIII',          'Committee Rooms',      '2026-04-04T16:50:00+03:00', '2026-04-04T17:15:00+03:00', 'Final committee session, closing remarks by chairs', 'Day 2', ARRAY['DELEGATE','CHAIR','CO_CHAIR','EXECUTIVE_BOARD','SECRETARY_GENERAL','DEPUTY_SECRETARY_GENERAL']),
('Transition Into Closing Ceremony','',                     '2026-04-04T17:15:00+03:00', '2026-04-04T17:30:00+03:00', 'Move to main hall', 'Day 2', ARRAY['DELEGATE','CHAIR','CO_CHAIR','EXECUTIVE_BOARD','SECRETARY_GENERAL','DEPUTY_SECRETARY_GENERAL','SECURITY','PRESS','MEDIA','ADMIN']),
('Closing Ceremony',                'Main Hall',            '2026-04-04T17:30:00+03:00', '2026-04-04T19:30:00+03:00', 'Closing remarks, best delegate awards, acknowledgements, and group photos', 'Day 2', ARRAY['DELEGATE','CHAIR','CO_CHAIR','EXECUTIVE_BOARD','SECRETARY_GENERAL','DEPUTY_SECRETARY_GENERAL','SECURITY','PRESS','MEDIA','ADMIN']);

-- ============================================
-- COMMITTEE SCHEDULES (per-committee sessions)
-- Each committee gets all 8 sessions matching the agenda
-- ============================================

DO $$
DECLARE
  cid UUID;
  committees UUID[] := ARRAY[
    '1662389a-2647-4deb-be8f-38ed0aa89a5d'::uuid,
    'b4c4065c-978d-49c0-9090-b2c35f77c447'::uuid,
    '2e4ff931-0923-453f-81ab-a87f396d8788'::uuid,
    '173de8ef-9309-4219-897e-cbb262aa8b71'::uuid,
    '18b4925e-910d-4b3e-9c8f-12178572c9b0'::uuid,
    'a6e67726-dc1d-4061-a29a-a20e1a217c5c'::uuid,
    '4665cf02-3b8d-4cd9-883d-812a40134423'::uuid,
    'cc182006-8fd6-42bb-9c20-f1ada87fd197'::uuid
  ];
BEGIN
  FOREACH cid IN ARRAY committees LOOP
    INSERT INTO committee_schedules (committee_id, event_name, start_time, end_time, location, description) VALUES
    -- Day 1
    (cid, 'Committee Session I',    '2026-04-03T15:10:00+03:00', '2026-04-03T16:40:00+03:00', 'Committee Room', 'Roll call, agenda setting, opening speeches'),
    (cid, 'Committee Session II',   '2026-04-03T17:00:00+03:00', '2026-04-03T18:30:00+03:00', 'Committee Room', 'Moderated and unmoderated caucuses'),
    (cid, 'Committee Session III',  '2026-04-03T19:50:00+03:00', '2026-04-03T21:00:00+03:00', 'Committee Room', 'Continued debate, draft resolutions'),
    -- Day 2
    (cid, 'Committee Session IV',   '2026-04-04T08:00:00+03:00', '2026-04-04T09:30:00+03:00', 'Committee Room', 'Resume debate, working papers and amendments'),
    (cid, 'Committee Session V',    '2026-04-04T09:50:00+03:00', '2026-04-04T11:45:00+03:00', 'Committee Room', 'Continued debate and resolution drafting'),
    (cid, 'Committee Session VI',   '2026-04-04T12:25:00+03:00', '2026-04-04T13:45:00+03:00', 'Committee Room', 'Resolution presentations and voting procedures'),
    (cid, 'Committee Session VII',  '2026-04-04T15:15:00+03:00', '2026-04-04T16:30:00+03:00', 'Committee Room', 'Final voting on resolutions'),
    (cid, 'Committee Session VIII', '2026-04-04T16:50:00+03:00', '2026-04-04T17:15:00+03:00', 'Committee Room', 'Final committee session, closing remarks');
  END LOOP;
END $$;

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
