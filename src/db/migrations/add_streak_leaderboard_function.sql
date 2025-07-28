-- Create function for streak leaderboard
CREATE OR REPLACE FUNCTION get_streak_leaderboard(
  p_type TEXT DEFAULT 'current', -- 'current' or 'all_time'
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  email TEXT,
  streak INTEGER,
  total_points INTEGER,
  rank INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  IF p_type = 'current' THEN
    -- Current streaks leaderboard
    RETURN QUERY
    SELECT 
      u.id AS user_id,
      u.username,
      u.email,
      u.current_streak AS streak,
      u.total_points,
      RANK() OVER (ORDER BY u.current_streak DESC, u.total_points DESC) AS rank
    FROM users u
    WHERE u.current_streak > 0
    ORDER BY u.current_streak DESC, u.total_points DESC
    LIMIT p_limit;
  ELSE
    -- All-time best streaks leaderboard
    RETURN QUERY
    SELECT 
      u.id AS user_id,
      u.username,
      u.email,
      u.best_streak AS streak,
      u.total_points,
      RANK() OVER (ORDER BY u.best_streak DESC, u.total_points DESC) AS rank
    FROM users u
    WHERE u.best_streak > 0
    ORDER BY u.best_streak DESC, u.total_points DESC
    LIMIT p_limit;
  END IF;
END;
$$;

-- Create a view for easy access to user streak stats
CREATE OR REPLACE VIEW user_streak_stats AS
SELECT 
  u.id,
  u.username,
  u.email,
  u.current_streak,
  u.best_streak,
  u.streak_freezes,
  u.last_freeze_used,
  u.total_points,
  -- Calculate current streak multiplier
  CASE
    WHEN u.current_streak >= 20 THEN 2.0
    WHEN u.current_streak >= 10 THEN 1.5
    WHEN u.current_streak >= 5 THEN 1.2
    WHEN u.current_streak >= 3 THEN 1.1
    ELSE 1.0
  END AS current_multiplier,
  -- Calculate if on fire (3+ streak)
  u.current_streak >= 3 AS on_fire,
  -- Calculate fire intensity (for UI)
  CASE
    WHEN u.current_streak >= 20 THEN 'inferno'
    WHEN u.current_streak >= 10 THEN 'blazing'
    WHEN u.current_streak >= 5 THEN 'hot'
    WHEN u.current_streak >= 3 THEN 'warm'
    ELSE 'cold'
  END AS fire_intensity,
  -- Days until next freeze (assuming weekly reset on Monday)
  EXTRACT(DAY FROM (
    date_trunc('week', CURRENT_DATE) + interval '7 days' - CURRENT_DATE
  ))::INTEGER AS days_until_freeze_reset
FROM users u;

-- Grant appropriate permissions
GRANT SELECT ON user_streak_stats TO authenticated;

-- Create RLS policy for streak stats view
ALTER VIEW user_streak_stats OWNER TO postgres;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_users_current_streak_active 
ON users(current_streak DESC, total_points DESC) 
WHERE current_streak > 0;

CREATE INDEX IF NOT EXISTS idx_users_best_streak_active 
ON users(best_streak DESC, total_points DESC) 
WHERE best_streak > 0;