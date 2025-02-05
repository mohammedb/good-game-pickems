-- Add score columns to matches table
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS team1_score INTEGER,
ADD COLUMN IF NOT EXISTS team2_score INTEGER; 