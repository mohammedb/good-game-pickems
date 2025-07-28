-- Add prediction streak fields to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS best_streak integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_freezes integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_streak_update timestamp with time zone,
  ADD COLUMN IF NOT EXISTS last_freeze_used timestamp with time zone;

-- Create indexes for efficient streak leaderboard queries
CREATE INDEX IF NOT EXISTS idx_users_current_streak ON users(current_streak DESC) WHERE current_streak > 0;
CREATE INDEX IF NOT EXISTS idx_users_best_streak ON users(best_streak DESC) WHERE best_streak > 0;

-- Add comment for clarity
COMMENT ON COLUMN users.current_streak IS 'Current consecutive correct predictions';
COMMENT ON COLUMN users.best_streak IS 'User''s all-time highest streak';
COMMENT ON COLUMN users.streak_freezes IS 'Number of streak protection uses available (resets weekly)';
COMMENT ON COLUMN users.last_streak_update IS 'Timestamp of last streak calculation';
COMMENT ON COLUMN users.last_freeze_used IS 'Timestamp when streak freeze was last used';