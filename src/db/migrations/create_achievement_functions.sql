-- Function to check and award achievements for a user
CREATE OR REPLACE FUNCTION check_user_achievements(p_user_id uuid)
RETURNS TABLE (
  achievement_id uuid,
  achievement_name text,
  unlocked boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stats user_stats%ROWTYPE;
  v_achievement achievements%ROWTYPE;
  v_criteria jsonb;
BEGIN
  -- Get user stats
  SELECT * INTO v_stats FROM user_stats WHERE user_id = p_user_id;
  
  -- If no stats exist, create them
  IF NOT FOUND THEN
    INSERT INTO user_stats (user_id) VALUES (p_user_id);
    SELECT * INTO v_stats FROM user_stats WHERE user_id = p_user_id;
  END IF;
  
  -- Check each achievement
  FOR v_achievement IN SELECT * FROM achievements LOOP
    v_criteria := v_achievement.criteria;
    
    -- Check if already unlocked
    IF EXISTS (SELECT 1 FROM user_achievements WHERE user_id = p_user_id AND achievement_id = v_achievement.id) THEN
      RETURN QUERY SELECT v_achievement.id, v_achievement.name, true;
      CONTINUE;
    END IF;
    
    -- Check criteria
    CASE v_criteria->>'type'
      WHEN 'predictions_count' THEN
        IF v_stats.total_predictions >= (v_criteria->>'value')::integer THEN
          INSERT INTO user_achievements (user_id, achievement_id) 
          VALUES (p_user_id, v_achievement.id)
          ON CONFLICT DO NOTHING;
          RETURN QUERY SELECT v_achievement.id, v_achievement.name, true;
        ELSE
          RETURN QUERY SELECT v_achievement.id, v_achievement.name, false;
        END IF;
        
      WHEN 'streak' THEN
        IF v_stats.longest_streak >= (v_criteria->>'value')::integer THEN
          INSERT INTO user_achievements (user_id, achievement_id) 
          VALUES (p_user_id, v_achievement.id)
          ON CONFLICT DO NOTHING;
          RETURN QUERY SELECT v_achievement.id, v_achievement.name, true;
        ELSE
          RETURN QUERY SELECT v_achievement.id, v_achievement.name, false;
        END IF;
        
      WHEN 'map_scores' THEN
        -- Count exact map score predictions
        IF (SELECT COUNT(*) FROM picks 
            WHERE user_id = p_user_id 
            AND is_correct = true 
            AND map_score_points > 0) >= (v_criteria->>'value')::integer THEN
          INSERT INTO user_achievements (user_id, achievement_id) 
          VALUES (p_user_id, v_achievement.id)
          ON CONFLICT DO NOTHING;
          RETURN QUERY SELECT v_achievement.id, v_achievement.name, true;
        ELSE
          RETURN QUERY SELECT v_achievement.id, v_achievement.name, false;
        END IF;
        
      ELSE
        RETURN QUERY SELECT v_achievement.id, v_achievement.name, false;
    END CASE;
  END LOOP;
END;
$$;

-- Function to update user stats after a pick
CREATE OR REPLACE FUNCTION update_user_stats_after_pick()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_streak integer;
  v_last_pick_correct boolean;
BEGIN
  -- Initialize stats if not exists
  INSERT INTO user_stats (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Update basic counts
  UPDATE user_stats
  SET 
    total_predictions = total_predictions + 1,
    correct_predictions = correct_predictions + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    total_points = total_points + COALESCE(NEW.points_awarded, 0),
    map_score_points = map_score_points + COALESCE(NEW.map_score_points, 0),
    last_prediction_date = NOW(),
    updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  -- Update streak
  IF NEW.is_correct IS NOT NULL THEN
    -- Get the last pick before this one
    SELECT is_correct INTO v_last_pick_correct
    FROM picks
    WHERE user_id = NEW.user_id
    AND id != NEW.id
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF NEW.is_correct THEN
      -- Correct pick
      IF v_last_pick_correct IS NULL OR v_last_pick_correct = true THEN
        -- Continue or start streak
        UPDATE user_stats
        SET 
          current_streak = current_streak + 1,
          longest_streak = GREATEST(longest_streak, current_streak + 1)
        WHERE user_id = NEW.user_id;
      ELSE
        -- Start new streak
        UPDATE user_stats
        SET 
          current_streak = 1,
          longest_streak = GREATEST(longest_streak, 1)
        WHERE user_id = NEW.user_id;
      END IF;
    ELSE
      -- Incorrect pick - reset streak
      UPDATE user_stats
      SET current_streak = 0
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  
  -- Check achievements
  PERFORM check_user_achievements(NEW.user_id);
  
  RETURN NEW;
END;
$$;

-- Create trigger for updating stats
CREATE TRIGGER update_user_stats_after_pick_trigger
AFTER INSERT OR UPDATE OF is_correct, points_awarded, map_score_points
ON picks
FOR EACH ROW
EXECUTE FUNCTION update_user_stats_after_pick();

-- Function to record leaderboard history (to be called periodically)
CREATE OR REPLACE FUNCTION record_leaderboard_snapshot(p_time_range text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO leaderboard_history (user_id, rank, points, correct_picks, total_picks, map_score_points, time_range)
  SELECT 
    user_id,
    ROW_NUMBER() OVER (ORDER BY total_points DESC, correct_picks DESC) as rank,
    total_points,
    correct_picks,
    total_picks,
    map_score_points,
    p_time_range
  FROM get_leaderboard(
    CASE 
      WHEN p_time_range = 'weekly' THEN 'and p.created_at >= now() - interval ''7 days'''
      WHEN p_time_range = 'monthly' THEN 'and p.created_at >= now() - interval ''30 days'''
      ELSE ''
    END
  );
END;
$$;