-- Add League of Legends support to the platform
-- This migration adds game_type field and game_data JSONB field for storing game-specific data

-- Add game_type column to matches table with default value for existing matches
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS game_type text DEFAULT 'csgo';

-- Add game_data column for storing game-specific data (champions, objectives, etc.)
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS game_data jsonb;

-- Create index on game_type for performance
CREATE INDEX IF NOT EXISTS idx_matches_game_type ON matches(game_type);

-- Add prediction_type to picks table for future game-specific predictions
ALTER TABLE picks
ADD COLUMN IF NOT EXISTS prediction_type text DEFAULT 'match_winner';

-- Add prediction_data for storing game-specific prediction data
ALTER TABLE picks
ADD COLUMN IF NOT EXISTS prediction_data jsonb;

-- Update existing matches to ensure they have the correct game_type
UPDATE matches
SET game_type = 'csgo'
WHERE game_type IS NULL;

-- Add NOT NULL constraint after updating existing data
ALTER TABLE matches
ALTER COLUMN game_type SET NOT NULL;

-- Add check constraint to ensure only valid game types
ALTER TABLE matches
ADD CONSTRAINT check_game_type CHECK (game_type IN ('csgo', 'lol'));

-- Add comment for documentation
COMMENT ON COLUMN matches.game_type IS 'Type of game: csgo for CS2/CS:GO, lol for League of Legends';
COMMENT ON COLUMN matches.game_data IS 'Game-specific data stored as JSONB (e.g., champions for LoL, maps for CS2)';
COMMENT ON COLUMN picks.prediction_type IS 'Type of prediction: match_winner, map_score, etc.';
COMMENT ON COLUMN picks.prediction_data IS 'Game-specific prediction data stored as JSONB';