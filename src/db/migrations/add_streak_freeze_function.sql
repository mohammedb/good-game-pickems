-- Create function to use a streak freeze
CREATE OR REPLACE FUNCTION use_streak_freeze(p_user_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  freezes_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_freezes INTEGER;
  v_last_freeze_used TIMESTAMP WITH TIME ZONE;
  v_current_streak INTEGER;
BEGIN
  -- Get current user data
  SELECT 
    streak_freezes,
    last_freeze_used,
    current_streak
  INTO 
    v_current_freezes,
    v_last_freeze_used,
    v_current_streak
  FROM users
  WHERE id = p_user_id;

  -- Check if user exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'User not found', 0;
    RETURN;
  END IF;

  -- Check if user has freezes available
  IF v_current_freezes <= 0 THEN
    RETURN QUERY SELECT false, 'No streak freezes available', 0;
    RETURN;
  END IF;

  -- Check if user has a streak to protect
  IF v_current_streak <= 0 THEN
    RETURN QUERY SELECT false, 'No active streak to protect', v_current_freezes;
    RETURN;
  END IF;

  -- Use the freeze
  UPDATE users
  SET 
    streak_freezes = streak_freezes - 1,
    last_freeze_used = NOW()
  WHERE id = p_user_id;

  -- Log the freeze usage
  INSERT INTO admin_logs (action, details, created_at)
  VALUES (
    'streak_freeze_used',
    jsonb_build_object(
      'user_id', p_user_id,
      'streak_protected', v_current_streak,
      'freezes_remaining', v_current_freezes - 1
    ),
    NOW()
  );

  RETURN QUERY SELECT true, 'Streak freeze used successfully', v_current_freezes - 1;
END;
$$;

-- Create an enhanced streak update function that considers freezes
CREATE OR REPLACE FUNCTION update_user_streak_with_freeze(
  p_user_id UUID,
  p_is_correct BOOLEAN,
  p_match_id UUID DEFAULT NULL,
  p_use_freeze BOOLEAN DEFAULT false
)
RETURNS TABLE (
  new_streak INTEGER,
  best_streak INTEGER,
  streak_multiplier NUMERIC,
  freeze_used BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_streak INTEGER;
  v_best_streak INTEGER;
  v_streak_freezes INTEGER;
  v_new_streak INTEGER;
  v_multiplier NUMERIC;
  v_freeze_used BOOLEAN := false;
BEGIN
  -- Get current user streak data
  SELECT 
    current_streak,
    users.best_streak,
    streak_freezes
  INTO 
    v_current_streak,
    v_best_streak,
    v_streak_freezes
  FROM users
  WHERE id = p_user_id;

  -- Calculate new streak
  IF p_is_correct THEN
    -- Correct prediction: increment streak
    v_new_streak := COALESCE(v_current_streak, 0) + 1;
  ELSE
    -- Incorrect prediction
    IF p_use_freeze AND v_streak_freezes > 0 AND v_current_streak > 0 THEN
      -- Use freeze to maintain streak
      v_new_streak := v_current_streak;
      v_freeze_used := true;
      
      -- Deduct freeze
      UPDATE users
      SET 
        streak_freezes = streak_freezes - 1,
        last_freeze_used = NOW()
      WHERE id = p_user_id;
      
      -- Log freeze usage
      INSERT INTO admin_logs (action, details, created_at)
      VALUES (
        'streak_freeze_auto_used',
        jsonb_build_object(
          'user_id', p_user_id,
          'match_id', p_match_id,
          'streak_protected', v_current_streak
        ),
        NOW()
      );
    ELSE
      -- No freeze available or not requested: reset streak
      v_new_streak := 0;
    END IF;
  END IF;

  -- Update best streak if necessary
  IF v_new_streak > COALESCE(v_best_streak, 0) THEN
    v_best_streak := v_new_streak;
  END IF;

  -- Calculate streak multiplier
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
  SELECT v_new_streak, v_best_streak, v_multiplier, v_freeze_used;
END;
$$;

-- Update the original function to delegate to the new one
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
BEGIN
  RETURN QUERY
  SELECT 
    new_streak,
    best_streak,
    streak_multiplier
  FROM update_user_streak_with_freeze(p_user_id, p_is_correct, p_match_id, false);
END;
$$;