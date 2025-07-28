-- Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenged_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_type text NOT NULL CHECK (challenge_type IN ('single_match', 'round', 'custom')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'completed')),
  winner_id uuid REFERENCES users(id),
  stake_points integer DEFAULT 0 CHECK (stake_points >= 0),
  message text,
  created_at timestamp with time zone DEFAULT now(),
  accepted_at timestamp with time zone,
  completed_at timestamp with time zone,
  expires_at timestamp with time zone DEFAULT now() + interval '48 hours',
  CONSTRAINT different_users CHECK (challenger_id != challenged_id)
);

-- Create challenge_matches table to link challenges with matches
CREATE TABLE IF NOT EXISTS challenge_matches (
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  PRIMARY KEY (challenge_id, match_id)
);

-- Create challenge_picks table for predictions within challenges
CREATE TABLE IF NOT EXISTS challenge_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  predicted_winner text NOT NULL,
  is_correct boolean,
  points_earned integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(challenge_id, user_id, match_id)
);

-- Add challenge stats columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS challenge_wins integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS challenge_losses integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS challenge_draws integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS challenge_points_won integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS challenge_points_lost integer DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_challenges_challenger ON challenges(challenger_id);
CREATE INDEX IF NOT EXISTS idx_challenges_challenged ON challenges(challenged_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_created_at ON challenges(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenge_picks_user ON challenge_picks(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_picks_challenge ON challenge_picks(challenge_id);

-- Enable RLS
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_picks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for challenges table
-- Users can view challenges they're involved in or completed challenges
CREATE POLICY "Users can view their challenges" ON challenges
  FOR SELECT
  USING (
    auth.uid() IN (challenger_id, challenged_id) 
    OR status = 'completed'
  );

-- Only the challenger can create a challenge
CREATE POLICY "Users can create challenges" ON challenges
  FOR INSERT
  WITH CHECK (auth.uid() = challenger_id);

-- Only the challenged user can update status to accepted/declined
-- System can update to completed
CREATE POLICY "Users can update challenge status" ON challenges
  FOR UPDATE
  USING (
    (auth.uid() = challenged_id AND status = 'pending')
    OR (auth.uid() IN (challenger_id, challenged_id) AND status IN ('accepted', 'completed'))
  );

-- RLS Policies for challenge_matches table
-- Users can view challenge matches for challenges they're involved in
CREATE POLICY "Users can view challenge matches" ON challenge_matches
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM challenges
      WHERE challenges.id = challenge_matches.challenge_id
      AND auth.uid() IN (challenges.challenger_id, challenges.challenged_id)
    )
  );

-- Only the challenger can insert challenge matches when creating a challenge
CREATE POLICY "Challenger can insert challenge matches" ON challenge_matches
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM challenges
      WHERE challenges.id = challenge_matches.challenge_id
      AND challenges.challenger_id = auth.uid()
      AND challenges.status = 'pending'
    )
  );

-- RLS Policies for challenge_picks table
-- Users can view picks in challenges they're involved in
CREATE POLICY "Users can view challenge picks" ON challenge_picks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM challenges
      WHERE challenges.id = challenge_picks.challenge_id
      AND auth.uid() IN (challenges.challenger_id, challenges.challenged_id)
    )
  );

-- Users can only insert their own picks in accepted challenges
CREATE POLICY "Users can make challenge picks" ON challenge_picks
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM challenges
      WHERE challenges.id = challenge_picks.challenge_id
      AND auth.uid() IN (challenges.challenger_id, challenges.challenged_id)
      AND challenges.status = 'accepted'
    )
  );

-- Users can update their own picks before match starts
CREATE POLICY "Users can update their challenge picks" ON challenge_picks
  FOR UPDATE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = challenge_picks.match_id
      AND matches.start_time > now()
    )
  );

-- Create a function to check if user has enough points for stake
CREATE OR REPLACE FUNCTION check_stake_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if challenger has enough points
  IF NEW.stake_points > 0 THEN
    IF (SELECT total_points FROM users WHERE id = NEW.challenger_id) < NEW.stake_points THEN
      RAISE EXCEPTION 'Insufficient points for stake';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate stake points
CREATE TRIGGER validate_stake_points
  BEFORE INSERT ON challenges
  FOR EACH ROW
  EXECUTE FUNCTION check_stake_points();

-- Create a function to auto-decline expired challenges
CREATE OR REPLACE FUNCTION auto_decline_expired_challenges()
RETURNS void AS $$
BEGIN
  UPDATE challenges
  SET status = 'declined',
      updated_at = now()
  WHERE status = 'pending'
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Create a function to calculate challenge results
CREATE OR REPLACE FUNCTION calculate_challenge_results(challenge_id_param uuid)
RETURNS void AS $$
DECLARE
  v_challenger_id uuid;
  v_challenged_id uuid;
  v_challenger_correct int;
  v_challenged_correct int;
  v_winner_id uuid;
  v_stake_points int;
BEGIN
  -- Get challenge details
  SELECT challenger_id, challenged_id, stake_points
  INTO v_challenger_id, v_challenged_id, v_stake_points
  FROM challenges
  WHERE id = challenge_id_param AND status = 'accepted';

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Count correct predictions for each user
  SELECT COUNT(*) INTO v_challenger_correct
  FROM challenge_picks
  WHERE challenge_id = challenge_id_param
    AND user_id = v_challenger_id
    AND is_correct = true;

  SELECT COUNT(*) INTO v_challenged_correct
  FROM challenge_picks
  WHERE challenge_id = challenge_id_param
    AND user_id = v_challenged_id
    AND is_correct = true;

  -- Determine winner
  IF v_challenger_correct > v_challenged_correct THEN
    v_winner_id := v_challenger_id;
  ELSIF v_challenged_correct > v_challenger_correct THEN
    v_winner_id := v_challenged_id;
  ELSE
    v_winner_id := NULL; -- Draw
  END IF;

  -- Update challenge
  UPDATE challenges
  SET winner_id = v_winner_id,
      status = 'completed',
      completed_at = now()
  WHERE id = challenge_id_param;

  -- Update user stats
  IF v_winner_id = v_challenger_id THEN
    -- Challenger wins
    UPDATE users SET 
      challenge_wins = challenge_wins + 1,
      challenge_points_won = challenge_points_won + v_stake_points,
      total_points = total_points + v_stake_points
    WHERE id = v_challenger_id;
    
    UPDATE users SET 
      challenge_losses = challenge_losses + 1,
      challenge_points_lost = challenge_points_lost + v_stake_points,
      total_points = total_points - v_stake_points
    WHERE id = v_challenged_id;
  ELSIF v_winner_id = v_challenged_id THEN
    -- Challenged wins
    UPDATE users SET 
      challenge_wins = challenge_wins + 1,
      challenge_points_won = challenge_points_won + v_stake_points,
      total_points = total_points + v_stake_points
    WHERE id = v_challenged_id;
    
    UPDATE users SET 
      challenge_losses = challenge_losses + 1,
      challenge_points_lost = challenge_points_lost + v_stake_points,
      total_points = total_points - v_stake_points
    WHERE id = v_challenger_id;
  ELSE
    -- Draw
    UPDATE users SET challenge_draws = challenge_draws + 1
    WHERE id IN (v_challenger_id, v_challenged_id);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a function to check if all matches in a challenge are completed
CREATE OR REPLACE FUNCTION check_challenge_completion(challenge_id_param uuid)
RETURNS boolean AS $$
DECLARE
  total_matches int;
  completed_matches int;
BEGIN
  -- Count total matches in challenge
  SELECT COUNT(*) INTO total_matches
  FROM challenge_matches
  WHERE challenge_id = challenge_id_param;

  -- Count completed matches
  SELECT COUNT(*) INTO completed_matches
  FROM challenge_matches cm
  JOIN matches m ON cm.match_id = m.id
  WHERE cm.challenge_id = challenge_id_param
    AND m.status = 'finished';

  RETURN total_matches > 0 AND total_matches = completed_matches;
END;
$$ LANGUAGE plpgsql;