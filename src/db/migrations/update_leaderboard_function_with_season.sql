-- Drop the existing function
DROP FUNCTION IF EXISTS get_leaderboard(text);

-- Create updated leaderboard function with season support
CREATE OR REPLACE FUNCTION get_leaderboard(time_filter text DEFAULT '', season_id_param text DEFAULT NULL)
RETURNS TABLE (
  user_id uuid,
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
        u.username
      FROM picks p
      INNER JOIN users u ON u.id = p.user_id
      WHERE 1=1 
      %s -- time filter
      %s -- season filter
    )
    SELECT 
      p.user_id,
      p.username,
      COUNT(*) FILTER (WHERE is_correct = true)::bigint as correct_picks,
      COUNT(*)::bigint as total_picks,
      COALESCE(SUM(map_score_points), 0)::bigint as map_score_points,
      (COALESCE(SUM(points_awarded), 0) + COALESCE(SUM(map_score_points), 0))::bigint as total_points
    FROM filtered_picks p
    GROUP BY p.user_id, p.username
    ORDER BY total_points DESC, correct_picks DESC
  ', 
  time_filter,
  CASE 
    WHEN season_id_param IS NOT NULL 
    THEN format('AND p.season_id = %L', season_id_param)
    ELSE ''
  END
  );
END;
$$;

-- Create a convenience function to get leaderboard for current season
CREATE OR REPLACE FUNCTION get_current_season_leaderboard(time_filter text DEFAULT '')
RETURNS TABLE (
  user_id uuid,
  username text,
  correct_picks bigint,
  total_picks bigint,
  map_score_points bigint,
  total_points bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_season_id text;
BEGIN
  -- Get the current active season
  SELECT season_id INTO current_season_id
  FROM seasons
  WHERE is_active = true
  LIMIT 1;
  
  -- If no active season found, use the latest season
  IF current_season_id IS NULL THEN
    SELECT season_id INTO current_season_id
    FROM seasons
    ORDER BY start_date DESC
    LIMIT 1;
  END IF;
  
  -- Return leaderboard for the current season
  RETURN QUERY SELECT * FROM get_leaderboard(time_filter, current_season_id);
END;
$$;