-- Insert test matches for development and testing
-- This creates a mix of CS2 and LoL matches with different statuses

-- First, ensure we have a season
INSERT INTO seasons (season_id, name, start_date, is_active)
VALUES ('test-2025', 'Test Season 2025', '2025-01-01'::timestamp with time zone, true)
ON CONFLICT (season_id) DO UPDATE
SET is_active = true;

-- Insert CS2 test matches
INSERT INTO matches (
  id,
  gg_ligaen_api_id,
  team1_id,
  team2_id,
  team1,
  team2,
  team1_logo,
  team2_logo,
  start_time,
  division_id,
  season_id,
  is_finished,
  winner_id,
  team1_map_score,
  team2_map_score,
  best_of,
  round,
  game_type,
  synced_at
) VALUES
-- Match 1: Finished CS2 match (Apeks won)
(
  '11111111-1111-1111-1111-111111111111',
  'test-cs2-1',
  'apeks-id',
  'bifrost-id',
  'Apeks',
  'Bifrost',
  'https://www.goodgameligaen.no/storage/images/teams/apeks.png',
  'https://www.goodgameligaen.no/storage/images/teams/bifrost.png',
  NOW() - INTERVAL '2 days',
  '12517',
  'test-2025',
  true,
  'apeks-id',
  2,
  1,
  3,
  'Runde 1',
  'csgo',
  NOW()
),
-- Match 2: Upcoming CS2 match (tomorrow)
(
  '22222222-2222-2222-2222-222222222222',
  'test-cs2-2',
  'oilers-id',
  'foxed-id',
  'Oilers',
  'FOXED Gaming',
  'https://www.goodgameligaen.no/storage/images/teams/oilers.png',
  'https://www.goodgameligaen.no/storage/images/teams/foxed.png',
  NOW() + INTERVAL '1 day',
  '12517',
  'test-2025',
  false,
  NULL,
  NULL,
  NULL,
  3,
  'Runde 2',
  'csgo',
  NOW()
),
-- Match 3: Ongoing CS2 match (started 1 hour ago)
(
  '33333333-3333-3333-3333-333333333333',
  'test-cs2-3',
  'riddle-id',
  'nordavind-id',
  'Riddle Esports',
  'Nordavind',
  'https://www.goodgameligaen.no/storage/images/teams/riddle.png',
  'https://www.goodgameligaen.no/storage/images/teams/nordavind.png',
  NOW() - INTERVAL '1 hour',
  '12517',
  'test-2025',
  false,
  NULL,
  1,
  1,
  3,
  'Runde 2',
  'csgo',
  NOW()
);

-- Insert LoL test matches
INSERT INTO matches (
  id,
  gg_ligaen_api_id,
  team1_id,
  team2_id,
  team1,
  team2,
  team1_logo,
  team2_logo,
  start_time,
  division_id,
  season_id,
  is_finished,
  winner_id,
  team1_map_score,
  team2_map_score,
  best_of,
  round,
  game_type,
  game_data,
  synced_at
) VALUES
-- Match 4: Finished LoL match (NORA won)
(
  '44444444-4444-4444-4444-444444444444',
  'test-lol-1',
  'nora-id',
  'vanir-id',
  'NORA Esports',
  'Vanir',
  'https://www.goodgameligaen.no/storage/images/teams/nora.png',
  'https://www.goodgameligaen.no/storage/images/teams/vanir.png',
  NOW() - INTERVAL '3 days',
  '12518',
  'test-2025',
  true,
  'nora-id',
  2,
  0,
  3,
  'Uke 1',
  'lol',
  '{"patch": "14.23", "game_duration": [2145, 1823]}',
  NOW()
),
-- Match 5: Upcoming LoL match (in 3 hours)
(
  '55555555-5555-5555-5555-555555555555',
  'test-lol-2',
  'bitfix-id',
  'fotball-id',
  'Bitfix Gaming',
  'Fotball Førever',
  'https://www.goodgameligaen.no/storage/images/teams/bitfix.png',
  'https://www.goodgameligaen.no/storage/images/teams/fotball.png',
  NOW() + INTERVAL '3 hours',
  '12518',
  'test-2025',
  false,
  NULL,
  NULL,
  NULL,
  3,
  'Uke 2',
  'lol',
  '{"patch": "14.23"}',
  NOW()
);

-- Add some test picks for the finished matches (for testing points calculation)
-- This assumes you have some test users in your database
-- You can uncomment and modify these if you have test users:

/*
-- Example picks for testing (replace user_id with actual test user IDs)
INSERT INTO picks (
  user_id,
  match_id,
  predicted_winner,
  points_awarded,
  is_correct,
  created_at
) VALUES
-- Correct prediction for Match 1
('YOUR-TEST-USER-ID-1', '11111111-1111-1111-1111-111111111111', 'apeks-id', 10, true, NOW() - INTERVAL '3 days'),
-- Incorrect prediction for Match 1
('YOUR-TEST-USER-ID-2', '11111111-1111-1111-1111-111111111111', 'bifrost-id', 0, false, NOW() - INTERVAL '3 days'),
-- Correct prediction for Match 4
('YOUR-TEST-USER-ID-1', '44444444-4444-4444-4444-444444444444', 'nora-id', 10, true, NOW() - INTERVAL '4 days');
*/

-- Update match points processing for finished matches
UPDATE matches 
SET points_processed = true 
WHERE id IN ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444');

-- Log message
DO $$
BEGIN
  RAISE NOTICE 'Successfully inserted 5 test matches:';
  RAISE NOTICE '- 2 CS2 finished/ongoing matches';
  RAISE NOTICE '- 1 CS2 upcoming match';
  RAISE NOTICE '- 1 LoL finished match';
  RAISE NOTICE '- 1 LoL upcoming match';
END $$;