CREATE OR REPLACE FUNCTION get_user_recent_correct_picks(user_id_param uuid)
RETURNS TABLE (
  id uuid,
  match_id uuid,
  predicted_winner text,
  team1 text,
  team2 text,
  team1_logo text,
  team2_logo text,
  created_at timestamptz
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
      p.created_at
    FROM picks p
    JOIN matches m ON p.match_id = m.id
    WHERE p.user_id = user_id_param
    AND p.is_correct = true
    ORDER BY p.created_at DESC
    LIMIT 5;
END;
$$; 