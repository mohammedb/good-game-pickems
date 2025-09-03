-- Add game_type to seasons table to support multiple concurrent seasons (one per game)
ALTER TABLE seasons
ADD COLUMN IF NOT EXISTS game_type text;

-- Create index for game_type lookups
CREATE INDEX IF NOT EXISTS idx_seasons_game_type ON seasons(game_type);

-- Create unique constraint to ensure only one active season per game type
CREATE UNIQUE INDEX IF NOT EXISTS idx_seasons_active_game_type 
ON seasons(game_type, is_active) 
WHERE is_active = true;

-- Insert seasons for each game type
INSERT INTO seasons (season_id, name, start_date, end_date, is_active, game_type)
VALUES 
  ('13599', 'Good Game CS2 - Høsten 2025', '2025-08-01'::timestamp with time zone, '2025-12-31'::timestamp with time zone, true, 'csgo'),
  ('13600', 'Good Game LoL - Høsten 2025', '2025-08-01'::timestamp with time zone, '2025-12-31'::timestamp with time zone, true, 'lol'),
  ('13601', 'Good Game Valorant - Høsten 2025', '2025-08-01'::timestamp with time zone, '2025-12-31'::timestamp with time zone, true, 'valorant')
ON CONFLICT (season_id) 
DO UPDATE SET 
  game_type = EXCLUDED.game_type,
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Update the old season 13162 if it exists to be inactive
UPDATE seasons 
SET is_active = false 
WHERE season_id = '13162';