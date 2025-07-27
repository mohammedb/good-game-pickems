-- Add season_id column to matches table
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS season_id text;

-- Add foreign key constraint to seasons table
ALTER TABLE matches
ADD CONSTRAINT fk_matches_season
FOREIGN KEY (season_id)
REFERENCES seasons(season_id)
ON DELETE RESTRICT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_matches_season_id ON matches(season_id);

-- Update existing matches to belong to the current season
UPDATE matches
SET season_id = '13162'
WHERE season_id IS NULL;

-- Make season_id NOT NULL after updating existing data
ALTER TABLE matches
ALTER COLUMN season_id SET NOT NULL;