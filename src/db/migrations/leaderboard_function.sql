-- Create or replace the leaderboard function
CREATE OR REPLACE FUNCTION get_leaderboard(time_filter text)
RETURNS TABLE (
  user_id uuid,
  email text,
  correct_picks bigint,
  total_picks bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('
    SELECT 
      p.user_id,
      u.email,
      COUNT(*) FILTER (WHERE is_correct = true)::bigint as correct_picks,
      COUNT(*)::bigint as total_picks
    FROM picks p
    INNER JOIN users u ON u.id = p.user_id
    WHERE 1=1 %s
    GROUP BY p.user_id, u.email
    ORDER BY correct_picks DESC
  ', time_filter);
END;
$$; 