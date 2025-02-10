-- Add needs_points_processing column to matches table
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS needs_points_processing BOOLEAN DEFAULT false;

-- Update existing matches
UPDATE matches
SET needs_points_processing = (
  is_finished = true 
  AND winner_id IS NOT NULL 
  AND (points_processed = false OR points_processed IS NULL)
);

-- Add comment
COMMENT ON COLUMN matches.needs_points_processing IS 'Indicates if this match needs points to be processed. Set to true when a match is finished with a winner but points have not been processed.'; 