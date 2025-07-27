-- Create season audit log table
CREATE TABLE IF NOT EXISTS season_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id text NOT NULL,
  action text NOT NULL, -- 'created', 'activated', 'deactivated', 'ended', 'deleted', 'updated'
  performed_by uuid REFERENCES users(id),
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_season_audit_log_season_id ON season_audit_log(season_id);
CREATE INDEX idx_season_audit_log_action ON season_audit_log(action);
CREATE INDEX idx_season_audit_log_created_at ON season_audit_log(created_at);

-- Enable RLS
ALTER TABLE season_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view season audit logs
CREATE POLICY "Only admins can view season audit logs"
ON season_audit_log FOR SELECT
TO authenticated
USING ((auth.jwt() ->> 'is_admin') = 'true');

-- Function to log season actions
CREATE OR REPLACE FUNCTION log_season_action(
  p_season_id text,
  p_action text,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO season_audit_log (season_id, action, performed_by, details)
  VALUES (
    p_season_id, 
    p_action, 
    auth.uid(),
    p_details
  );
END;
$$;

-- Update season management functions to include audit logging
CREATE OR REPLACE FUNCTION activate_season(season_id_param text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  activated_season record;
  deactivated_count integer;
  deactivated_seasons text[];
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
  
  -- Get list of seasons that will be deactivated
  SELECT array_agg(season_id) INTO deactivated_seasons
  FROM seasons
  WHERE is_active = true
    AND season_id != season_id_param;
  
  -- Deactivate all other seasons
  UPDATE seasons
  SET is_active = false,
      updated_at = now()
  WHERE is_active = true
    AND season_id != season_id_param;
  
  GET DIAGNOSTICS deactivated_count = ROW_COUNT;
  
  -- Log deactivations
  IF deactivated_count > 0 THEN
    PERFORM log_season_action(
      unnest(deactivated_seasons),
      'deactivated',
      jsonb_build_object(
        'reason', 'Deactivated when activating season ' || season_id_param,
        'activated_season', activated_season.name
      )
    ) FROM unnest(deactivated_seasons);
  END IF;
  
  -- Activate the specified season
  UPDATE seasons
  SET is_active = true,
      updated_at = now()
  WHERE season_id = season_id_param;
  
  -- Log activation
  PERFORM log_season_action(
    season_id_param,
    'activated',
    jsonb_build_object(
      'season_name', activated_season.name,
      'deactivated_count', deactivated_count
    )
  );
  
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

-- Update create_season to include logging
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
  
  -- Log creation
  PERFORM log_season_action(
    p_season_id,
    'created',
    jsonb_build_object(
      'name', p_name,
      'start_date', p_start_date,
      'end_date', p_end_date,
      'auto_activate', p_activate
    )
  );
  
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