-- Function to update points for a completed match
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
        SELECT 
          CASE 
            WHEN winner_id = team1_id THEN team1
            WHEN winner_id = team2_id THEN team2
            ELSE NULL
          END
        FROM matches
        WHERE id = match_id_param
      )
    ),
    map_score_correct = (
      predicted_team1_maps = (SELECT team1_map_score FROM matches WHERE id = match_id_param) AND
      predicted_team2_maps = (SELECT team2_map_score FROM matches WHERE id = match_id_param)
    ),
    points_awarded = 
      CASE 
        -- 2 points for correct winner prediction
        WHEN predicted_winner = (
          SELECT 
            CASE 
              WHEN winner_id = team1_id THEN team1
              WHEN winner_id = team2_id THEN team2
              ELSE NULL
            END
          FROM matches
          WHERE id = match_id_param
        ) THEN 2
        ELSE 0
      END +
      -- 1 point for correct map score
      CASE 
        WHEN 
          predicted_team1_maps = (SELECT team1_map_score FROM matches WHERE id = match_id_param) AND
          predicted_team2_maps = (SELECT team2_map_score FROM matches WHERE id = match_id_param)
        THEN 1
        ELSE 0
      END,
    map_score_points = 
      CASE 
        WHEN 
          predicted_team1_maps = (SELECT team1_map_score FROM matches WHERE id = match_id_param) AND
          predicted_team2_maps = (SELECT team2_map_score FROM matches WHERE id = match_id_param)
        THEN 1
        ELSE 0
      END
  WHERE match_id = match_id_param;

  -- Update the match to mark points as processed
  UPDATE matches
  SET points_processed = true
  WHERE id = match_id_param;
END;
$$; 