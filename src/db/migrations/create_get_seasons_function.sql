-- Create function to get all seasons with match counts
CREATE OR REPLACE FUNCTION get_seasons()
RETURNS TABLE (
  id uuid,
  season_id text,
  name text,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  is_active boolean,
  match_count bigint,
  user_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.season_id,
    s.name,
    s.start_date,
    s.end_date,
    s.is_active,
    COUNT(DISTINCT m.id)::bigint as match_count,
    COUNT(DISTINCT p.user_id)::bigint as user_count
  FROM seasons s
  LEFT JOIN matches m ON m.season_id = s.season_id
  LEFT JOIN picks p ON p.season_id = s.season_id
  GROUP BY s.id, s.season_id, s.name, s.start_date, s.end_date, s.is_active
  ORDER BY s.start_date DESC;
END;
$$;

-- Create function to get the current active season
CREATE OR REPLACE FUNCTION get_current_season()
RETURNS TABLE (
  id uuid,
  season_id text,
  name text,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  is_active boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.season_id,
    s.name,
    s.start_date,
    s.end_date,
    s.is_active
  FROM seasons s
  WHERE s.is_active = true
  LIMIT 1;
END;
$$;