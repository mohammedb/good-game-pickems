-- Create function to reset streak freezes weekly
CREATE OR REPLACE FUNCTION reset_weekly_streak_freezes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Reset streak freezes to 1 for all users
  UPDATE users 
  SET streak_freezes = 1
  WHERE streak_freezes < 1;
  
  -- Log the reset
  INSERT INTO admin_logs (action, details, created_at)
  VALUES (
    'weekly_streak_freeze_reset',
    jsonb_build_object(
      'users_reset', (SELECT COUNT(*) FROM users WHERE streak_freezes < 1),
      'timestamp', NOW()
    ),
    NOW()
  );
END;
$$;

-- Create cron job to run every Monday at midnight UTC
SELECT cron.schedule(
  'reset-streak-freezes',     -- name of the cron job
  '0 0 * * 1',               -- run every Monday at 00:00 UTC
  'SELECT reset_weekly_streak_freezes();'
);