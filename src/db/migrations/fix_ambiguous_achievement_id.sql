-- Fix ambiguous achievement_id references in functions

-- Fix check_and_award_streak_achievements function
CREATE OR REPLACE FUNCTION check_and_award_streak_achievements(
  p_user_id UUID,
  p_new_streak INTEGER
)
RETURNS TABLE(
  achievement_id UUID,
  achievement_name TEXT,
  achievement_title TEXT,
  newly_unlocked BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_achievement RECORD;
  v_already_unlocked BOOLEAN;
BEGIN
  -- Check each streak achievement
  FOR v_achievement IN 
    SELECT id, name, title, criteria 
    FROM achievements 
    WHERE criteria->>'type' = 'streak'
  LOOP
    -- Check if user already has this achievement
    -- Fix: Explicitly qualify achievement_id with table alias
    SELECT EXISTS(
      SELECT 1 FROM user_achievements ua
      WHERE ua.user_id = p_user_id 
      AND ua.achievement_id = v_achievement.id
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

-- Fix check_user_achievements function
CREATE OR REPLACE FUNCTION check_user_achievements(p_user_id uuid)
RETURNS TABLE (
  achievement_id uuid,
  achievement_name text,
  unlocked boolean
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_achievement record;
  v_stats record;
  v_criteria jsonb;
BEGIN
  -- Get user stats
  SELECT * INTO v_stats FROM user_stats WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Check each achievement
  FOR v_achievement IN SELECT * FROM achievements LOOP
    v_criteria := v_achievement.criteria;
    
    -- Check if already unlocked
    -- Fix: Explicitly qualify achievement_id with table alias
    IF EXISTS (
      SELECT 1 FROM user_achievements ua
      WHERE ua.user_id = p_user_id 
      AND ua.achievement_id = v_achievement.id
    ) THEN
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
        IF (SELECT COUNT(*) FROM picks p
            WHERE p.user_id = p_user_id 
            AND p.is_correct = true 
            AND p.map_score_points > 0) >= (v_criteria->>'value')::integer THEN
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

-- Fix check_comeback_achievement function
CREATE OR REPLACE FUNCTION check_comeback_achievement(
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_last_six_picks BOOLEAN[];
  v_already_has_achievement BOOLEAN;
BEGIN
  -- Check if user already has the comeback achievement
  SELECT EXISTS(
    SELECT 1 FROM user_achievements ua
    JOIN achievements a ON ua.achievement_id = a.id
    WHERE ua.user_id = p_user_id
    AND a.name = 'comeback_kid'
  ) INTO v_already_has_achievement;
  
  IF v_already_has_achievement THEN
    RETURN FALSE;
  END IF;
  
  -- Get last 6 picks (ordered by match start time, most recent first)
  SELECT array_agg(p.is_correct ORDER BY m.start_time DESC)
  INTO v_last_six_picks
  FROM (
    SELECT p.is_correct, m.start_time
    FROM picks p
    JOIN matches m ON p.match_id = m.id
    WHERE p.user_id = p_user_id
    AND p.is_correct IS NOT NULL
    ORDER BY m.start_time DESC
    LIMIT 6
  ) AS subquery
  JOIN matches m ON true;
  
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

-- Also ensure all queries that join achievements and user_achievements use proper aliases
-- This will help prevent any other ambiguous column references
-- Run this migration to update all functions with potential ambiguity issues