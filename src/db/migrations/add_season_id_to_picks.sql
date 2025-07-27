-- Add season_id column to picks table for query optimization
ALTER TABLE picks
ADD COLUMN IF NOT EXISTS season_id text;

-- Update picks with season_id from their associated matches
UPDATE picks p
SET season_id = m.season_id
FROM matches m
WHERE p.match_id = m.id
AND p.season_id IS NULL;

-- Add foreign key constraint
ALTER TABLE picks
ADD CONSTRAINT fk_picks_season
FOREIGN KEY (season_id)
REFERENCES seasons(season_id)
ON DELETE RESTRICT;

-- Create composite index for efficient season-based queries
CREATE INDEX IF NOT EXISTS idx_picks_season_user ON picks(season_id, user_id);
CREATE INDEX IF NOT EXISTS idx_picks_season_correct ON picks(season_id, is_correct);

-- Make season_id NOT NULL after updating existing data
ALTER TABLE picks
ALTER COLUMN season_id SET NOT NULL;

-- Create a trigger to automatically set season_id from match when inserting picks
CREATE OR REPLACE FUNCTION set_pick_season_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Get season_id from the associated match
  SELECT season_id INTO NEW.season_id
  FROM matches
  WHERE id = NEW.match_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS set_pick_season_id_trigger ON picks;
CREATE TRIGGER set_pick_season_id_trigger
BEFORE INSERT ON picks
FOR EACH ROW
EXECUTE FUNCTION set_pick_season_id();