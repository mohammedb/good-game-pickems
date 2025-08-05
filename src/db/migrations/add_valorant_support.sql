-- Add Valorant support to the platform
-- This migration updates the check constraint to include 'valorant' as a valid game type

-- Drop the existing check constraint
ALTER TABLE matches
DROP CONSTRAINT IF EXISTS check_game_type;

-- Add the new check constraint with 'valorant'
ALTER TABLE matches
ADD CONSTRAINT check_game_type CHECK (game_type IN ('csgo', 'lol', 'valorant'));

-- Update the comment for documentation
COMMENT ON COLUMN matches.game_type IS 'Type of game: csgo for CS2/CS:GO, lol for League of Legends, valorant for Valorant';
