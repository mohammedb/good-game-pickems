-- Drop the existing function first
DROP FUNCTION IF EXISTS get_leaderboard(text);

-- Update the leaderboard function to include usernames and both types of points
CREATE OR REPLACE FUNCTION get_leaderboard(time_filter text)
RETURNS TABLE (
  user_id uuid,
  email text,
  username text,
  correct_picks bigint,
  total_picks bigint,
  map_score_points bigint,
  total_points bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('
    WITH filtered_picks AS (
      SELECT 
        p.*,
        u.email,
        u.username
      FROM picks p
      INNER JOIN users u ON u.id = p.user_id
      WHERE 1=1 %s
    )
    SELECT 
      p.user_id,
      p.email,
      p.username,
      COUNT(*) FILTER (WHERE is_correct = true)::bigint as correct_picks,
      COUNT(*)::bigint as total_picks,
      COALESCE(SUM(map_score_points), 0)::bigint as map_score_points,
      (COUNT(*) FILTER (WHERE is_correct = true) + COALESCE(SUM(map_score_points), 0))::bigint as total_points
    FROM filtered_picks p
    GROUP BY p.user_id, p.email, p.username
    ORDER BY total_points DESC, correct_picks DESC
  ', time_filter);
END;
$$; 