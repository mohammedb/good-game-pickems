-- Create achievements table
CREATE TABLE achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  rarity text NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  points integer NOT NULL DEFAULT 0,
  criteria jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Create user_achievements table for tracking unlocked achievements
CREATE TABLE user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at timestamp with time zone DEFAULT now(),
  progress integer DEFAULT 100,
  UNIQUE(user_id, achievement_id)
);

-- Create leaderboard_history table for tracking rank changes
CREATE TABLE leaderboard_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  rank integer NOT NULL,
  points integer NOT NULL,
  correct_picks integer NOT NULL,
  total_picks integer NOT NULL,
  map_score_points integer NOT NULL,
  time_range text NOT NULL CHECK (time_range IN ('all', 'weekly', 'monthly')),
  recorded_at timestamp with time zone DEFAULT now()
);

-- Create user_stats table for cached statistics
CREATE TABLE user_stats (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_predictions integer DEFAULT 0,
  correct_predictions integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  total_points integer DEFAULT 0,
  map_score_points integer DEFAULT 0,
  last_prediction_date timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX idx_leaderboard_history_user_id ON leaderboard_history(user_id);
CREATE INDEX idx_leaderboard_history_recorded_at ON leaderboard_history(recorded_at);
CREATE INDEX idx_leaderboard_history_time_range ON leaderboard_history(time_range);

-- Add RLS policies for achievements
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Everyone can view achievements
CREATE POLICY "Achievements are viewable by everyone" ON achievements
  FOR SELECT TO authenticated USING (true);

-- Users can view their own unlocked achievements
CREATE POLICY "Users can view their own achievements" ON user_achievements
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Users can view everyone's achievements (for leaderboard/profile viewing)
CREATE POLICY "Users can view all user achievements" ON user_achievements
  FOR SELECT TO authenticated USING (true);

-- Users can view leaderboard history
CREATE POLICY "Leaderboard history is viewable by everyone" ON leaderboard_history
  FOR SELECT TO authenticated USING (true);

-- Users can view their own stats
CREATE POLICY "Users can view their own stats" ON user_stats
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Users can view everyone's stats (for leaderboard)
CREATE POLICY "Users can view all user stats" ON user_stats
  FOR SELECT TO authenticated USING (true);

-- Insert some initial achievements
INSERT INTO achievements (name, title, description, icon, rarity, points, criteria) VALUES
  ('first_prediction', 'First Steps', 'Make your first prediction', 'trophy', 'common', 10, '{"type": "predictions_count", "value": 1}'),
  ('streak_5', 'On Fire', 'Get 5 correct predictions in a row', 'target', 'rare', 25, '{"type": "streak", "value": 5}'),
  ('streak_10', 'Unstoppable', 'Get 10 correct predictions in a row', 'sparkles', 'epic', 50, '{"type": "streak", "value": 10}'),
  ('predictions_25', 'Regular', 'Make 25 predictions', 'medal', 'common', 15, '{"type": "predictions_count", "value": 25}'),
  ('predictions_50', 'Dedicated', 'Make 50 predictions', 'medal', 'rare', 30, '{"type": "predictions_count", "value": 50}'),
  ('predictions_100', 'Veteran', 'Make 100 predictions', 'crown', 'epic', 75, '{"type": "predictions_count", "value": 100}'),
  ('perfect_week', 'Perfect Week', 'Get all predictions correct in a week', 'crown', 'legendary', 100, '{"type": "perfect_period", "value": "week"}'),
  ('map_prophet', 'Map Prophet', 'Correctly predict 10 exact map scores', 'target', 'epic', 60, '{"type": "map_scores", "value": 10}'),
  ('underdog_caller', 'Underdog Caller', 'Correctly predict 5 upsets', 'sparkles', 'rare', 40, '{"type": "upsets", "value": 5}'),
  ('top_3_finish', 'Podium Finish', 'Finish in top 3 of monthly leaderboard', 'trophy', 'legendary', 150, '{"type": "leaderboard_position", "value": 3, "period": "monthly"}');