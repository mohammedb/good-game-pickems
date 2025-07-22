-- Update the function to include more match details
CREATE OR REPLACE FUNCTION get_user_recent_correct_picks(user_id_param uuid)
RETURNS TABLE (
  id uuid,
  match_id uuid,
  predicted_winner text,
  team1 text,
  team2 text,
  team1_logo text,
  team2_logo text,
  team1_score integer,
  team2_score integer,
  team1_map_score integer,
  team2_map_score integer,
  points_earned integer,
  map_score_points integer,
  match_date timestamptz,
  created_at timestamptz,
  round text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY 
    SELECT 
      p.id,
      p.match_id,
      p.predicted_winner,
      m.team1,
      m.team2,
      m.team1_logo,
      m.team2_logo,
      m.team1_score,
      m.team2_score,
      m.team1_map_score,
      m.team2_map_score,
      p.points_awarded AS points_earned,
      p.map_score_points,
      m.start_time AS match_date,
      p.created_at,
      m.round
    FROM picks p
    JOIN matches m ON p.match_id = m.id
    WHERE p.user_id = user_id_param
    AND p.is_correct = true
    ORDER BY m.start_time DESC
    LIMIT 5;
END;
$$;