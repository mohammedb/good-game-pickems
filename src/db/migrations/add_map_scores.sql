-- Add map score columns to matches table
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS team1_map_score INTEGER,
ADD COLUMN IF NOT EXISTS team2_map_score INTEGER;

-- Add map score prediction columns to picks table
ALTER TABLE picks
ADD COLUMN IF NOT EXISTS predicted_team1_maps INTEGER,
ADD COLUMN IF NOT EXISTS predicted_team2_maps INTEGER,
ADD COLUMN IF NOT EXISTS map_score_correct BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS map_score_points INTEGER DEFAULT 0;

-- Create or replace function to update points
CREATE OR REPLACE FUNCTION update_match_points(match_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update points for all picks for this match
  UPDATE picks
  SET 
    is_correct = (
      predicted_winner = (
        SELECT winner_id FROM matches WHERE id = match_id_param
      )
    ),
    map_score_correct = (
      predicted_team1_maps = (SELECT team1_map_score FROM matches WHERE id = match_id_param) AND
      predicted_team2_maps = (SELECT team2_map_score FROM matches WHERE id = match_id_param)
    ),
    points_awarded = 
      CASE 
        -- 10 points for correct winner prediction
        WHEN predicted_winner = (SELECT winner_id FROM matches WHERE id = match_id_param) THEN 10
        ELSE 0
      END +
      -- 2 points for correct map score
      CASE 
        WHEN 
          predicted_team1_maps = (SELECT team1_map_score FROM matches WHERE id = match_id_param) AND
          predicted_team2_maps = (SELECT team2_map_score FROM matches WHERE id = match_id_param)
        THEN 2
        ELSE 0
      END,
    map_score_points = 
      CASE 
        WHEN 
          predicted_team1_maps = (SELECT team1_map_score FROM matches WHERE id = match_id_param) AND
          predicted_team2_maps = (SELECT team2_map_score FROM matches WHERE id = match_id_param)
        THEN 2
        ELSE 0
      END
  WHERE match_id = match_id_param;

  -- Update the match to mark points as processed
  UPDATE matches
  SET points_processed = true
  WHERE id = match_id_param;
END;
$$; 