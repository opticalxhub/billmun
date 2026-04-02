-- Fix conference windows to match actual schedule
-- Day 1: April 3 2026, 12:00 PM – 9:15 PM (Riyadh UTC+3)
-- Day 2: April 4 2026, 6:30 AM – 7:45 PM (Riyadh UTC+3)

DELETE FROM conference_windows;

INSERT INTO conference_windows (label, start_time, end_time) VALUES
  ('Day 1 – April 3', '2026-04-03T12:00:00+03:00', '2026-04-03T21:15:00+03:00'),
  ('Day 2 – April 4', '2026-04-04T06:30:00+03:00', '2026-04-04T19:45:00+03:00');

-- Update post-conference message
UPDATE conference_config SET
  post_conference_message = 'BILLMUN I has concluded. Thank you to every delegate, chair, and member of staff who made this conference possible. It has been an honour. Stay connected — follow us @billmun.sa on Instagram for highlights, photos, and future announcements.',
  manual_override = NULL
WHERE id = '1';
