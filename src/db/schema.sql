-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table (Extended from Supabase Auth)
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  username text,
  is_admin boolean DEFAULT false,
  total_points integer DEFAULT 0,
  rank integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Matches Table
CREATE TABLE matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gg_ligaen_api_id text NOT NULL,
  team1_id text NOT NULL,
  team2_id text NOT NULL,
  team1 text NOT NULL,
  team2 text NOT NULL,
  team1_logo text,
  team2_logo text,
  start_time timestamp with time zone NOT NULL,
  division_id text NOT NULL,
  is_finished boolean DEFAULT false,
  winner_id text,
  best_of integer NOT NULL,
  round text,
  points_processed boolean DEFAULT false,
  synced_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Picks Table
CREATE TABLE picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE,
  predicted_winner text NOT NULL,
  points_awarded integer DEFAULT 0,
  is_correct boolean DEFAULT false,
  manual_adjustment_reason text,
  adjusted_by uuid REFERENCES users(id),
  adjusted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, match_id)
);

-- Sync Logs Table
CREATE TABLE sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  synced_by uuid REFERENCES users(id),
  matches_synced integer,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Users
CREATE POLICY "Users can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (is_admin = true);

-- RLS Policies for Matches
CREATE POLICY "Anyone can view matches"
  ON matches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify matches"
  ON matches FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- RLS Policies for Picks
CREATE POLICY "Users can view all picks"
  ON picks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own picks"
  ON picks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own picks"
  ON picks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Only admins can update any pick"
  ON picks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- RLS Policies for Sync Logs
CREATE POLICY "Anyone can view sync logs"
  ON sync_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert sync logs"
  ON sync_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Indexes
CREATE INDEX idx_matches_start_time ON matches(start_time);
CREATE INDEX idx_matches_division_id ON matches(division_id);
CREATE INDEX idx_picks_user_id ON picks(user_id);
CREATE INDEX idx_picks_match_id ON picks(match_id);
CREATE INDEX idx_picks_created_at ON picks(created_at);
CREATE INDEX idx_users_rank ON users(rank);
CREATE INDEX idx_users_total_points ON users(total_points);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
    BEFORE UPDATE ON matches
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_picks_updated_at
    BEFORE UPDATE ON picks
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column(); 