-- Add stream_link column to matches table
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS stream_link TEXT; 