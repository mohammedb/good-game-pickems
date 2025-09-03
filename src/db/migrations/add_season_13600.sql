-- Add the current active season that matches the environment variables
-- This fixes the sync issue where matches can't be inserted due to missing season

-- First, deactivate the old season
UPDATE seasons 
SET is_active = false 
WHERE season_id = '13162';

-- Insert the new season (13600) that matches GOOD_GAME_SEASON_ID env variable
INSERT INTO seasons (season_id, name, start_date, end_date, is_active)
VALUES (
  '13600', 
  'Good Game Ligaen 2025', 
  '2025-01-01'::timestamp with time zone,
  '2025-12-31'::timestamp with time zone,
  true
)
ON CONFLICT (season_id) 
DO UPDATE SET 
  is_active = true,
  updated_at = now();

-- Optionally migrate existing matches to the new season
-- Uncomment if you want to move existing matches to the new season
-- UPDATE matches 
-- SET season_id = '13600' 
-- WHERE season_id = '13162';