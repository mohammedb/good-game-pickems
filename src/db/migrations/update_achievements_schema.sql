-- Update achievements table to match PRD requirements
ALTER TABLE achievements 
ADD COLUMN IF NOT EXISTS code text UNIQUE,
ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'prediction',
ADD COLUMN IF NOT EXISTS requirement_type text NOT NULL DEFAULT 'count',
ADD COLUMN IF NOT EXISTS requirement_value integer,
ADD COLUMN IF NOT EXISTS game_type text,
ADD COLUMN IF NOT EXISTS icon_url text;

-- Update existing achievements with codes
UPDATE achievements SET code = name WHERE code IS NULL;

-- Add check constraint for categories
ALTER TABLE achievements 
ADD CONSTRAINT achievements_category_check 
CHECK (category IN ('prediction', 'streak', 'participation', 'social'));

-- Add progress tracking to user_achievements if not exists
ALTER TABLE user_achievements
ADD COLUMN IF NOT EXISTS progress integer DEFAULT 0;

-- Create a table for tracking achievement progress that doesn't result in immediate unlock
CREATE TABLE IF NOT EXISTS achievement_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE,
  progress_value integer DEFAULT 0,
  last_updated timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Add RLS policies for achievement_progress
ALTER TABLE achievement_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own progress
CREATE POLICY "Users can view their own achievement progress" ON achievement_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_achievement_progress_user_id ON achievement_progress(user_id);

-- Insert new achievements based on PRD categories
INSERT INTO achievements (code, name, title, description, icon, rarity, points, category, requirement_type, requirement_value, criteria) VALUES
  -- Prediction Achievements
  ('first_correct', 'first_correct', 'First Blood', 'Get your first correct prediction', 'trophy', 'common', 10, 'prediction', 'count', 1, '{"type": "correct_predictions", "value": 1}'),
  ('correct_10', 'correct_10', 'Sharp Eye', 'Get 10 correct predictions', 'eye', 'common', 20, 'prediction', 'count', 10, '{"type": "correct_predictions", "value": 10}'),
  ('correct_25', 'correct_25', 'Analyst', 'Get 25 correct predictions', 'chart-line', 'rare', 40, 'prediction', 'count', 25, '{"type": "correct_predictions", "value": 25}'),
  ('correct_50', 'correct_50', 'Expert Analyst', 'Get 50 correct predictions', 'medal', 'epic', 75, 'prediction', 'count', 50, '{"type": "correct_predictions", "value": 50}'),
  ('correct_100', 'correct_100', 'Master Predictor', 'Get 100 correct predictions', 'crown', 'legendary', 150, 'prediction', 'count', 100, '{"type": "correct_predictions", "value": 100}'),
  ('perfect_round', 'perfect_round', 'Perfect Round', 'Get all predictions correct in a single round', 'star', 'epic', 100, 'prediction', 'special', NULL, '{"type": "perfect_round"}'),
  ('perfect_month', 'perfect_month', 'Oracle', 'Get all predictions correct in a month', 'sparkles', 'legendary', 500, 'prediction', 'special', NULL, '{"type": "perfect_month"}'),
  
  -- Streak Achievements
  ('streak_3', 'streak_3', 'Warming Up', 'Get 3 correct predictions in a row', 'flame', 'common', 15, 'streak', 'streak', 3, '{"type": "streak", "value": 3}'),
  ('streak_20', 'streak_20', 'Legendary Streak', 'Get 20 correct predictions in a row', 'fire', 'legendary', 200, 'streak', 'streak', 20, '{"type": "streak", "value": 20}'),
  ('comeback_kid', 'comeback_kid', 'Comeback Kid', 'Get a correct prediction after 5 wrong ones', 'trending-up', 'rare', 50, 'streak', 'special', NULL, '{"type": "comeback"}'),
  
  -- Participation Achievements
  ('early_bird', 'early_bird', 'Early Bird', 'Be among the first 10 to predict in a round', 'clock', 'common', 15, 'participation', 'special', NULL, '{"type": "early_bird", "value": 10}'),
  ('dedicated_10', 'dedicated_10', 'Regular Fan', 'Make predictions in 10 different rounds', 'calendar', 'common', 20, 'participation', 'count', 10, '{"type": "rounds_participated", "value": 10}'),
  ('dedicated_25', 'dedicated_25', 'Dedicated Fan', 'Make predictions in 25 different rounds', 'calendar-check', 'rare', 50, 'participation', 'count', 25, '{"type": "rounds_participated", "value": 25}'),
  ('dedicated_50', 'dedicated_50', 'Super Fan', 'Make predictions in 50 different rounds', 'heart', 'epic', 100, 'participation', 'count', 50, '{"type": "rounds_participated", "value": 50}'),
  ('multi_game_master', 'multi_game_master', 'Multi-Game Master', 'Make predictions in both CS2 and LoL', 'gamepad', 'rare', 75, 'participation', 'special', NULL, '{"type": "multi_game"}'),
  
  -- Social Achievements
  ('social_butterfly', 'social_butterfly', 'Social Butterfly', 'Share your predictions 10 times', 'share', 'rare', 30, 'social', 'count', 10, '{"type": "shares", "value": 10}'),
  ('trendsetter', 'trendsetter', 'Trendsetter', 'Have a shared prediction viewed by 50+ people', 'trending-up', 'epic', 100, 'social', 'special', NULL, '{"type": "viral_share", "value": 50}')
ON CONFLICT (code) DO NOTHING;

-- Function to check for comeback kid achievement
CREATE OR REPLACE FUNCTION check_comeback_achievement(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_last_six_picks boolean[];
BEGIN
  -- Get the last 6 picks for the user
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
  
  -- Check if we have exactly 6 picks and the pattern matches (latest is correct, previous 5 are wrong)
  IF array_length(v_last_six_picks, 1) = 6 
     AND v_last_six_picks[1] = true 
     AND v_last_six_picks[2] = false 
     AND v_last_six_picks[3] = false 
     AND v_last_six_picks[4] = false 
     AND v_last_six_picks[5] = false 
     AND v_last_six_picks[6] = false THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Function to check for perfect round achievement
CREATE OR REPLACE FUNCTION check_perfect_round_achievement(p_user_id uuid, p_round_id text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_matches integer;
  v_correct_picks integer;
BEGIN
  -- Count total matches in the round
  SELECT COUNT(*)
  INTO v_total_matches
  FROM matches
  WHERE round = p_round_id
  AND status = 'finished';
  
  -- Count correct picks by the user in this round
  SELECT COUNT(*)
  INTO v_correct_picks
  FROM picks p
  JOIN matches m ON p.match_id = m.id
  WHERE p.user_id = p_user_id
  AND m.round = p_round_id
  AND p.is_correct = true;
  
  -- Check if all picks are correct
  RETURN v_total_matches > 0 AND v_total_matches = v_correct_picks;
END;
$$;