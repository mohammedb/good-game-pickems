-- Season management functions for admin operations

-- Function to activate a season (deactivates all others)
CREATE OR REPLACE FUNCTION activate_season(season_id_param text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  activated_season record;
  deactivated_count integer;
BEGIN
  -- Check if season exists
  SELECT * INTO activated_season
  FROM seasons
  WHERE season_id = season_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Season not found'
    );
  END IF;
  
  -- Check if already active
  IF activated_season.is_active THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Season is already active'
    );
  END IF;
  
  -- Deactivate all other seasons
  UPDATE seasons
  SET is_active = false,
      updated_at = now()
  WHERE is_active = true
    AND season_id != season_id_param;
  
  GET DIAGNOSTICS deactivated_count = ROW_COUNT;
  
  -- Activate the specified season
  UPDATE seasons
  SET is_active = true,
      updated_at = now()
  WHERE season_id = season_id_param;
  
  -- Return success with details
  RETURN json_build_object(
    'success', true,
    'activated_season', json_build_object(
      'season_id', activated_season.season_id,
      'name', activated_season.name
    ),
    'deactivated_count', deactivated_count
  );
END;
$$;

-- Function to end a season with a specific end date
CREATE OR REPLACE FUNCTION end_season(season_id_param text, end_date_param timestamp with time zone DEFAULT now())
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_season record;
BEGIN
  -- Update the season with end date and deactivate
  UPDATE seasons
  SET end_date = end_date_param,
      is_active = false,
      updated_at = now()
  WHERE season_id = season_id_param
  RETURNING * INTO updated_season;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Season not found'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'season', json_build_object(
      'season_id', updated_season.season_id,
      'name', updated_season.name,
      'end_date', updated_season.end_date
    )
  );
END;
$$;

-- Function to get detailed season statistics
CREATE OR REPLACE FUNCTION get_season_stats(season_id_param text DEFAULT NULL)
RETURNS TABLE (
  season_id text,
  name text,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  is_active boolean,
  total_matches bigint,
  finished_matches bigint,
  total_users bigint,
  total_picks bigint,
  correct_picks bigint,
  avg_accuracy numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.season_id,
    s.name,
    s.start_date,
    s.end_date,
    s.is_active,
    COUNT(DISTINCT m.id)::bigint as total_matches,
    COUNT(DISTINCT m.id) FILTER (WHERE m.is_finished = true)::bigint as finished_matches,
    COUNT(DISTINCT p.user_id)::bigint as total_users,
    COUNT(DISTINCT p.id)::bigint as total_picks,
    COUNT(DISTINCT p.id) FILTER (WHERE p.is_correct = true)::bigint as correct_picks,
    CASE 
      WHEN COUNT(p.id) > 0 
      THEN ROUND((COUNT(p.id) FILTER (WHERE p.is_correct = true)::numeric / COUNT(p.id)::numeric) * 100, 2)
      ELSE 0
    END as avg_accuracy
  FROM seasons s
  LEFT JOIN matches m ON m.season_id = s.season_id
  LEFT JOIN picks p ON p.season_id = s.season_id
  WHERE (season_id_param IS NULL OR s.season_id = season_id_param)
  GROUP BY s.season_id, s.name, s.start_date, s.end_date, s.is_active
  ORDER BY s.start_date DESC;
END;
$$;

-- Function to check if a season can be deleted
CREATE OR REPLACE FUNCTION can_delete_season(season_id_param text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  match_count integer;
  pick_count integer;
  season_exists boolean;
BEGIN
  -- Check if season exists
  SELECT EXISTS(SELECT 1 FROM seasons WHERE season_id = season_id_param) INTO season_exists;
  
  IF NOT season_exists THEN
    RETURN json_build_object(
      'can_delete', false,
      'reason', 'Season not found'
    );
  END IF;
  
  -- Count related data
  SELECT COUNT(*) INTO match_count FROM matches WHERE season_id = season_id_param;
  SELECT COUNT(*) INTO pick_count FROM picks WHERE season_id = season_id_param;
  
  IF match_count > 0 OR pick_count > 0 THEN
    RETURN json_build_object(
      'can_delete', false,
      'reason', format('Season has %s matches and %s picks', match_count, pick_count),
      'match_count', match_count,
      'pick_count', pick_count
    );
  END IF;
  
  RETURN json_build_object(
    'can_delete', true,
    'reason', 'Season can be safely deleted'
  );
END;
$$;

-- Function to create a new season with validation
CREATE OR REPLACE FUNCTION create_season(
  p_season_id text,
  p_name text,
  p_start_date timestamp with time zone,
  p_end_date timestamp with time zone DEFAULT NULL,
  p_activate boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_season_id uuid;
  result json;
BEGIN
  -- Validate inputs
  IF p_season_id IS NULL OR p_name IS NULL OR p_start_date IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Season ID, name, and start date are required'
    );
  END IF;
  
  -- Check if season_id already exists
  IF EXISTS(SELECT 1 FROM seasons WHERE season_id = p_season_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Season ID already exists'
    );
  END IF;
  
  -- Insert new season
  INSERT INTO seasons (season_id, name, start_date, end_date, is_active)
  VALUES (p_season_id, p_name, p_start_date, p_end_date, false)
  RETURNING id INTO new_season_id;
  
  -- Activate if requested
  IF p_activate THEN
    SELECT activate_season(p_season_id) INTO result;
    IF NOT (result->>'success')::boolean THEN
      -- Rollback the insert if activation fails
      DELETE FROM seasons WHERE id = new_season_id;
      RETURN result;
    END IF;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'season_id', p_season_id,
    'id', new_season_id,
    'activated', p_activate
  );
END;
$$;