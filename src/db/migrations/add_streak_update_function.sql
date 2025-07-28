-- Create function to update user streak when a pick result is determined
CREATE OR REPLACE FUNCTION update_user_streak(
  p_user_id UUID,
  p_is_correct BOOLEAN,
  p_match_id UUID DEFAULT NULL
)
RETURNS TABLE (
  new_streak INTEGER,
  best_streak INTEGER,
  streak_multiplier NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_streak INTEGER;
  v_best_streak INTEGER;
  v_streak_freezes INTEGER;
  v_last_streak_update TIMESTAMP WITH TIME ZONE;
  v_new_streak INTEGER;
  v_multiplier NUMERIC;
BEGIN
  -- Get current user streak data
  SELECT 
    current_streak,
    users.best_streak,
    streak_freezes,
    last_streak_update
  INTO 
    v_current_streak,
    v_best_streak,
    v_streak_freezes,
    v_last_streak_update
  FROM users
  WHERE id = p_user_id;

  -- Calculate new streak
  IF p_is_correct THEN
    -- Correct prediction: increment streak
    v_new_streak := COALESCE(v_current_streak, 0) + 1;
  ELSE
    -- Incorrect prediction: reset streak to 0
    v_new_streak := 0;
  END IF;

  -- Update best streak if necessary
  IF v_new_streak > COALESCE(v_best_streak, 0) THEN
    v_best_streak := v_new_streak;
  END IF;

  -- Calculate streak multiplier based on current streak
  v_multiplier := CASE
    WHEN v_new_streak >= 20 THEN 2.0
    WHEN v_new_streak >= 10 THEN 1.5
    WHEN v_new_streak >= 5 THEN 1.2
    WHEN v_new_streak >= 3 THEN 1.1
    ELSE 1.0
  END;

  -- Update user record
  UPDATE users
  SET 
    current_streak = v_new_streak,
    best_streak = v_best_streak,
    last_streak_update = NOW()
  WHERE id = p_user_id;

  -- Return the results
  RETURN QUERY
  SELECT v_new_streak, v_best_streak, v_multiplier;
END;
$$;

-- Create an enhanced version of update_match_points that includes streak updates
CREATE OR REPLACE FUNCTION update_match_points_with_streaks(match_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pick RECORD;
  v_streak_result RECORD;
  v_base_points INTEGER;
  v_final_points INTEGER;
BEGIN
  -- Process each pick for this match
  FOR v_pick IN 
    SELECT 
      p.id,
      p.user_id,
      p.predicted_winner,
      p.predicted_team1_maps,
      p.predicted_team2_maps,
      m.winner_id,
      m.team1_map_score,
      m.team2_map_score,
      u.current_streak
    FROM picks p
    JOIN matches m ON p.match_id = m.id
    JOIN users u ON p.user_id = u.id
    WHERE p.match_id = match_id_param
  LOOP
    -- Calculate base points
    v_base_points := 0;
    
    -- Points for correct winner
    IF v_pick.predicted_winner = v_pick.winner_id THEN
      v_base_points := v_base_points + 2;
    END IF;
    
    -- Points for correct map score
    IF v_pick.predicted_team1_maps = v_pick.team1_map_score AND 
       v_pick.predicted_team2_maps = v_pick.team2_map_score THEN
      v_base_points := v_base_points + 1;
    END IF;
    
    -- Update the pick with base calculation
    UPDATE picks
    SET 
      is_correct = (v_pick.predicted_winner = v_pick.winner_id),
      map_score_correct = (
        v_pick.predicted_team1_maps = v_pick.team1_map_score AND
        v_pick.predicted_team2_maps = v_pick.team2_map_score
      ),
      map_score_points = CASE 
        WHEN v_pick.predicted_team1_maps = v_pick.team1_map_score AND
             v_pick.predicted_team2_maps = v_pick.team2_map_score
        THEN 1
        ELSE 0
      END
    WHERE id = v_pick.id;
    
    -- Update user streak and get multiplier
    SELECT * INTO v_streak_result
    FROM update_user_streak(
      v_pick.user_id, 
      (v_pick.predicted_winner = v_pick.winner_id),
      match_id_param
    );
    
    -- Apply streak multiplier to points (use current streak for multiplier, not new streak)
    v_final_points := CASE
      WHEN v_pick.current_streak >= 20 THEN v_base_points * 2.0
      WHEN v_pick.current_streak >= 10 THEN v_base_points * 1.5
      WHEN v_pick.current_streak >= 5 THEN v_base_points * 1.2
      WHEN v_pick.current_streak >= 3 THEN v_base_points * 1.1
      ELSE v_base_points * 1.0
    END;
    
    -- Update points with multiplier applied
    UPDATE picks
    SET points_awarded = v_final_points::INTEGER
    WHERE id = v_pick.id;
  END LOOP;

  -- Mark the match as processed
  UPDATE matches
  SET points_processed = true
  WHERE id = match_id_param;
  
  -- Update total points for all affected users
  UPDATE users u
  SET total_points = (
    SELECT COALESCE(SUM(points_awarded), 0)
    FROM picks
    WHERE user_id = u.id
  )
  WHERE id IN (
    SELECT DISTINCT user_id 
    FROM picks 
    WHERE match_id = match_id_param
  );
END;
$$;

-- Create trigger to track achievement checking for streaks
CREATE OR REPLACE FUNCTION check_streak_achievements()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- This will be integrated with the achievement system
  -- Check for streak-based achievements:
  -- - 3/5/10/20 prediction streak achievements
  
  -- Log streak milestones for now
  IF NEW.current_streak IN (3, 5, 10, 20) THEN
    INSERT INTO admin_logs (action, details, created_at)
    VALUES (
      'streak_milestone',
      jsonb_build_object(
        'user_id', NEW.id,
        'streak', NEW.current_streak,
        'achievement_trigger', true
      ),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for streak achievement checking
DROP TRIGGER IF EXISTS check_streak_achievements_trigger ON users;
CREATE TRIGGER check_streak_achievements_trigger
AFTER UPDATE OF current_streak ON users
FOR EACH ROW
WHEN (NEW.current_streak > OLD.current_streak)
EXECUTE FUNCTION check_streak_achievements();

-- Update existing update_match_points calls to use the new function
-- This ensures backward compatibility
DROP FUNCTION IF EXISTS update_match_points(UUID);
CREATE OR REPLACE FUNCTION update_match_points(match_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delegate to the new function that includes streak updates
  PERFORM update_match_points_with_streaks(match_id_param);
END;
$$;