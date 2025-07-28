-- Add additional streak achievements
INSERT INTO achievements (name, title, description, icon, rarity, points, criteria) VALUES
  ('streak_3', 'Getting Warm', 'Get 3 correct predictions in a row', 'target', 'common', 15, '{"type": "streak", "value": 3}'),
  ('streak_20', 'Legendary Streak', 'Get 20 correct predictions in a row', 'crown', 'legendary', 100, '{"type": "streak", "value": 20}'),
  ('comeback_kid', 'Comeback Kid', 'Get a correct prediction after 5 wrong ones', 'sparkles', 'rare', 30, '{"type": "comeback", "value": 5}')
ON CONFLICT (name) DO NOTHING;

-- Create function to check and award streak achievements
CREATE OR REPLACE FUNCTION check_and_award_streak_achievements(
  p_user_id UUID,
  p_new_streak INTEGER
)
RETURNS TABLE (
  achievement_id UUID,
  achievement_name TEXT,
  achievement_title TEXT,
  newly_unlocked BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_achievement RECORD;
  v_already_unlocked BOOLEAN;
BEGIN
  -- Check all streak achievements
  FOR v_achievement IN 
    SELECT id, name, title, criteria
    FROM achievements
    WHERE criteria->>'type' = 'streak'
  LOOP
    -- Check if user already has this achievement
    SELECT EXISTS(
      SELECT 1 FROM user_achievements 
      WHERE user_id = p_user_id 
      AND achievement_id = v_achievement.id
    ) INTO v_already_unlocked;
    
    -- If streak meets or exceeds achievement requirement and not already unlocked
    IF p_new_streak >= (v_achievement.criteria->>'value')::INTEGER AND NOT v_already_unlocked THEN
      -- Award the achievement
      INSERT INTO user_achievements (user_id, achievement_id)
      VALUES (p_user_id, v_achievement.id)
      ON CONFLICT DO NOTHING;
      
      -- Return this achievement as newly unlocked
      RETURN QUERY SELECT 
        v_achievement.id,
        v_achievement.name,
        v_achievement.title,
        true;
    ELSIF p_new_streak >= (v_achievement.criteria->>'value')::INTEGER THEN
      -- Return this achievement as already unlocked
      RETURN QUERY SELECT 
        v_achievement.id,
        v_achievement.name,
        v_achievement.title,
        false;
    END IF;
  END LOOP;
END;
$$;

-- Update the streak tracking trigger to check achievements
CREATE OR REPLACE FUNCTION check_streak_achievements()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_achievements RECORD;
BEGIN
  -- Only check if streak increased
  IF NEW.current_streak > COALESCE(OLD.current_streak, 0) THEN
    -- Check and award streak achievements
    FOR v_new_achievements IN 
      SELECT * FROM check_and_award_streak_achievements(NEW.id, NEW.current_streak)
      WHERE newly_unlocked = true
    LOOP
      -- Log the achievement unlock
      INSERT INTO admin_logs (action, details, created_at)
      VALUES (
        'achievement_unlocked',
        jsonb_build_object(
          'user_id', NEW.id,
          'achievement_name', v_new_achievements.achievement_name,
          'achievement_title', v_new_achievements.achievement_title,
          'streak', NEW.current_streak
        ),
        NOW()
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Replace the existing trigger
DROP TRIGGER IF EXISTS check_streak_achievements_trigger ON users;
CREATE TRIGGER check_streak_achievements_trigger
AFTER UPDATE OF current_streak ON users
FOR EACH ROW
EXECUTE FUNCTION check_streak_achievements();

-- Create function to check comeback kid achievement
CREATE OR REPLACE FUNCTION check_comeback_achievement(
  p_user_id UUID,
  p_is_correct BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_six_picks BOOLEAN[];
  v_already_has BOOLEAN;
BEGIN
  -- Only check if this pick is correct
  IF NOT p_is_correct THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user already has the achievement
  SELECT EXISTS(
    SELECT 1 FROM user_achievements ua
    JOIN achievements a ON ua.achievement_id = a.id
    WHERE ua.user_id = p_user_id
    AND a.name = 'comeback_kid'
  ) INTO v_already_has;
  
  IF v_already_has THEN
    RETURN FALSE;
  END IF;
  
  -- Get the last 6 picks (including this one)
  SELECT ARRAY_AGG(is_correct ORDER BY created_at DESC)
  INTO v_last_six_picks
  FROM (
    SELECT is_correct
    FROM picks
    WHERE user_id = p_user_id
    AND is_correct IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 6
  ) AS recent_picks;
  
  -- Check if pattern matches: latest is correct (true), previous 5 are wrong (false)
  IF array_length(v_last_six_picks, 1) = 6 
     AND v_last_six_picks[1] = true 
     AND v_last_six_picks[2] = false
     AND v_last_six_picks[3] = false
     AND v_last_six_picks[4] = false
     AND v_last_six_picks[5] = false
     AND v_last_six_picks[6] = false THEN
    
    -- Award the achievement
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT p_user_id, id
    FROM achievements
    WHERE name = 'comeback_kid';
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Update the match points function to check comeback achievement
CREATE OR REPLACE FUNCTION update_match_points_with_streaks_and_achievements(match_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pick RECORD;
  v_streak_result RECORD;
  v_base_points INTEGER;
  v_final_points INTEGER;
  v_is_comeback BOOLEAN;
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
    
    -- Check for comeback achievement
    v_is_comeback := check_comeback_achievement(
      v_pick.user_id,
      (v_pick.predicted_winner = v_pick.winner_id)
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

-- Update the wrapper function
DROP FUNCTION IF EXISTS update_match_points_with_streaks(UUID);
CREATE OR REPLACE FUNCTION update_match_points_with_streaks(match_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delegate to the new function that includes achievements
  PERFORM update_match_points_with_streaks_and_achievements(match_id_param);
END;
$$;