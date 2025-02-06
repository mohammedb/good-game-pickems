-- =============================================================================
-- Rebuild Schema for GGWP.no (with RLS + JWT-based admin checks)
-- =============================================================================

-- 1. (Optional) Drop existing tables & policies for a clean slate
-- WARNING: This section destroys data! Uncomment if you want a fresh start.
--------------------------------------------------------------------------------
-- DROP TABLE IF EXISTS admin_logs CASCADE;
-- DROP TABLE IF EXISTS sync_logs CASCADE;
-- DROP TABLE IF EXISTS picks CASCADE;
-- DROP TABLE IF EXISTS matches CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- -- Drop old RLS policies
-- DROP POLICY IF EXISTS "Users can view all users" ON users;
-- DROP POLICY IF EXISTS "Users can update their own profile" ON users;
-- DROP POLICY IF EXISTS "Admins can update any user" ON users;
-- DROP POLICY IF EXISTS "Anyone can view matches" ON matches;
-- DROP POLICY IF EXISTS "Only admins can modify matches" ON matches;
-- DROP POLICY IF EXISTS "Users can view all picks" ON picks;
-- DROP POLICY IF EXISTS "Users can insert their own picks" ON picks;
-- DROP POLICY IF EXISTS "Users can update their own picks" ON picks;
-- DROP POLICY IF EXISTS "Only admins can update any pick" ON picks;
-- DROP POLICY IF EXISTS "Anyone can view sync logs" ON sync_logs;
-- DROP POLICY IF EXISTS "Only admins can insert sync logs" ON sync_logs;
-- DROP POLICY IF EXISTS "Allow admins to view logs" ON admin_logs;
-- DROP POLICY IF EXISTS "Allow admins to insert logs" ON admin_logs;

-- =============================================================================
-- 2. Enable required extensions
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS pgcrypto; -- (Optional, if needed for gen_random_uuid on older PG)

-- =============================================================================
-- 3. Users table (extends auth.users)
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
  id      uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email   text UNIQUE NOT NULL,
  username text,
  is_admin boolean DEFAULT false,
  total_points integer DEFAULT 0,
  rank integer,
  has_completed_onboarding boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Optional unique constraint on username
ALTER TABLE users
  ADD CONSTRAINT users_username_key UNIQUE (username);

-- =============================================================================
-- 4. Admin Logs table
-- =============================================================================
CREATE TABLE IF NOT EXISTS admin_logs (
  id         uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  type       text NOT NULL,         -- e.g. 'sync','points','user','match','error','success'
  message    text NOT NULL,
  details    text,
  user_id    uuid,                  -- references the admin user who did the action
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Foreign key to auth.users
ALTER TABLE admin_logs
  ADD CONSTRAINT fk_admin_logs_user
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_admin_logs_type       ON admin_logs(type);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_logs_user_id    ON admin_logs(user_id);

-- =============================================================================
-- 5. Matches table
-- =============================================================================
CREATE TABLE IF NOT EXISTS matches (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gg_ligaen_api_id  text NOT NULL UNIQUE,
  team1_id          text NOT NULL,
  team2_id          text NOT NULL,
  team1             text NOT NULL,
  team2             text NOT NULL,
  team1_logo        text,
  team2_logo        text,
  team1_score       integer,        -- overall match score
  team2_score       integer,
  team1_map_score   integer,        -- more detailed map-level scoring
  team2_map_score   integer,
  start_time        timestamp with time zone NOT NULL,
  division_id       text NOT NULL,
  is_finished       boolean DEFAULT false,
  winner_id         text,
  best_of           integer NOT NULL,
  round             text,
  points_processed  boolean DEFAULT false,
  stream_link       text,
  synced_at         timestamp with time zone,
  created_at        timestamp with time zone DEFAULT now(),
  updated_at        timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_matches_start_time  ON matches(start_time);
CREATE INDEX IF NOT EXISTS idx_matches_division_id ON matches(division_id);

-- =============================================================================
-- 6. Picks table
-- =============================================================================
CREATE TABLE IF NOT EXISTS picks (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid REFERENCES users(id) ON DELETE CASCADE,
  match_id                 uuid REFERENCES matches(id) ON DELETE CASCADE,
  predicted_winner         text NOT NULL, -- store team ID or textual reference
  predicted_team1_maps     integer,
  predicted_team2_maps     integer,
  map_score_correct        boolean DEFAULT false,
  map_score_points         integer DEFAULT 0,
  points_awarded           integer DEFAULT 0,
  is_correct               boolean DEFAULT false,
  manual_adjustment_reason text,
  adjusted_by              uuid REFERENCES users(id),
  adjusted_at              timestamp with time zone,
  created_at               timestamp with time zone DEFAULT now(),
  updated_at               timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, match_id)
);

CREATE INDEX IF NOT EXISTS idx_picks_user_id    ON picks(user_id);
CREATE INDEX IF NOT EXISTS idx_picks_match_id   ON picks(match_id);
CREATE INDEX IF NOT EXISTS idx_picks_created_at ON picks(created_at);

-- =============================================================================
-- 7. Sync Logs table
-- =============================================================================
CREATE TABLE IF NOT EXISTS sync_logs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  synced_by      uuid REFERENCES users(id),
  matches_synced integer,
  created_at     timestamp with time zone DEFAULT now()
);

-- =============================================================================
-- 8. Enable Row-Level Security
-- =============================================================================
ALTER TABLE users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches    ENABLE ROW LEVEL SECURITY;
ALTER TABLE picks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs  ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 9. RLS Policies (JWT-based admin checks, no subselect recursion)
-- =============================================================================

-- ---- USERS policies ----
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;
DROP POLICY IF EXISTS "Enable insert for users signing up" ON users;

-- 9.1 Authenticated can SELECT all users
CREATE POLICY "Users can view all users"
ON users FOR SELECT
TO authenticated
USING (true);

-- 9.2 Insert your own user row (common for signups)
CREATE POLICY "Enable insert for users signing up"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 9.3 Non-admin can update only themselves
CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 9.4 Admin can update any user (via JWT)
CREATE POLICY "Admins can update any user"
ON users FOR UPDATE
TO authenticated
USING ((auth.jwt() ->> 'is_admin') = 'true')
WITH CHECK ((auth.jwt() ->> 'is_admin') = 'true');

-- ---- ADMIN_LOGS policies ----
DROP POLICY IF EXISTS "Allow admins to view logs" ON admin_logs;
DROP POLICY IF EXISTS "Allow admins to insert logs" ON admin_logs;

-- Only admins can view logs
CREATE POLICY "Allow admins to view logs"
ON admin_logs FOR SELECT
TO authenticated
USING ((auth.jwt() ->> 'is_admin') = 'true');

-- Only admins can insert logs
CREATE POLICY "Allow admins to insert logs"
ON admin_logs FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() ->> 'is_admin') = 'true');

-- ---- MATCHES policies ----
DROP POLICY IF EXISTS "Anyone can view matches" ON matches;
DROP POLICY IF EXISTS "Only admins can modify matches" ON matches;

-- Anyone can SELECT matches
CREATE POLICY "Anyone can view matches"
ON matches FOR SELECT
TO authenticated
USING (true);

-- Only admins can modify matches
CREATE POLICY "Only admins can modify matches"
ON matches FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'is_admin') = 'true')
WITH CHECK ((auth.jwt() ->> 'is_admin') = 'true');

-- ---- PICKS policies ----
DROP POLICY IF EXISTS "Users can view all picks" ON picks;
DROP POLICY IF EXISTS "Users can insert their own picks" ON picks;
DROP POLICY IF EXISTS "Users can update their own picks" ON picks;
DROP POLICY IF EXISTS "Only admins can update any pick" ON picks;

-- Everyone can view picks
CREATE POLICY "Users can view all picks"
ON picks FOR SELECT
TO authenticated
USING (true);

-- Insert your own picks
CREATE POLICY "Users can insert their own picks"
ON picks FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Update your own picks
CREATE POLICY "Users can update their own picks"
ON picks FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admin can update any pick
CREATE POLICY "Only admins can update any pick"
ON picks FOR UPDATE
TO authenticated
USING ((auth.jwt() ->> 'is_admin') = 'true')
WITH CHECK ((auth.jwt() ->> 'is_admin') = 'true');

-- ---- SYNC_LOGS policies ----
DROP POLICY IF EXISTS "Anyone can view sync logs" ON sync_logs;
DROP POLICY IF EXISTS "Only admins can insert sync logs" ON sync_logs;

-- Anyone can view sync logs
CREATE POLICY "Anyone can view sync logs"
ON sync_logs FOR SELECT
TO authenticated
USING (true);

-- Only admins can insert sync logs
CREATE POLICY "Only admins can insert sync logs"
ON sync_logs FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() ->> 'is_admin') = 'true');

-- =============================================================================
-- 10. Updated-at triggers
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_logs_updated_at ON admin_logs;
CREATE TRIGGER update_admin_logs_updated_at
BEFORE UPDATE ON admin_logs
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_matches_updated_at ON matches;
CREATE TRIGGER update_matches_updated_at
BEFORE UPDATE ON matches
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_picks_updated_at ON picks;
CREATE TRIGGER update_picks_updated_at
BEFORE UPDATE ON picks
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- =============================================================================
-- 11. (Optional) Helper functions for points, rank, etc.
-- =============================================================================

-- Example function to recalc user total_points & rank
CREATE OR REPLACE FUNCTION update_user_total_points()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE users
  SET total_points = COALESCE((
    SELECT SUM(points_awarded)
    FROM picks
    WHERE picks.user_id = users.id
  ), 0);

  WITH ranked AS (
    SELECT
      id,
      total_points,
      RANK() OVER (ORDER BY total_points DESC) AS computed_rank
    FROM users
  )
  UPDATE users
  SET rank = ranked.computed_rank
  FROM ranked
  WHERE users.id = ranked.id;
END;
$$;

-- Example function to update match_points (2 for correct winner, +1 for map score)
CREATE OR REPLACE FUNCTION update_match_points(match_id_param uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE picks
  SET
    is_correct = (
      (SELECT CASE WHEN m.winner_id = m.team1_id THEN m.team1
                   WHEN m.winner_id = m.team2_id THEN m.team2
                   ELSE NULL
              END
       FROM matches m WHERE m.id = match_id_param)
      = predicted_winner
    ),
    map_score_correct = (
      predicted_team1_maps = (SELECT team1_map_score FROM matches WHERE id = match_id_param)
      AND predicted_team2_maps = (SELECT team2_map_score FROM matches WHERE id = match_id_param)
    ),
    points_awarded =
      CASE
        WHEN (SELECT winner_id FROM matches WHERE id = match_id_param) IS NOT NULL
        AND (
          (SELECT CASE WHEN mm.winner_id = mm.team1_id THEN mm.team1
                       WHEN mm.winner_id = mm.team2_id THEN mm.team2
                       ELSE NULL
                  END
           FROM matches mm WHERE mm.id = match_id_param)
          = predicted_winner
        )
        THEN 2
        ELSE 0
      END
      +
      CASE
        WHEN (
          predicted_team1_maps = (SELECT team1_map_score FROM matches WHERE id = match_id_param)
          AND predicted_team2_maps = (SELECT team2_map_score FROM matches WHERE id = match_id_param)
        )
        THEN 1
        ELSE 0
      END
  WHERE match_id = match_id_param;

  UPDATE matches
  SET points_processed = true
  WHERE id = match_id_param;
END;
$$;

-- (Optional) remove picks for matches that haven't started
CREATE OR REPLACE FUNCTION remove_unlocked_picks(user_id_param uuid, cutoff_time timestamptz)
RETURNS TABLE(id uuid, match_id uuid, predicted_winner text)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  DELETE FROM picks p
  USING matches m
  WHERE p.match_id = m.id
    AND p.user_id = user_id_param
    AND m.start_time > cutoff_time
  RETURNING p.id, p.match_id, p.predicted_winner;
END;
$$;

-- Drop existing get_admin_logs function first
DROP FUNCTION IF EXISTS get_admin_logs(text,text,timestamptz,timestamptz);

-- Function to get admin logs with filtering
CREATE OR REPLACE FUNCTION get_admin_logs(
  search_query text DEFAULT NULL,
  type_filter text DEFAULT NULL,
  from_date timestamptz DEFAULT NULL,
  to_date timestamptz DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  type text,
  message text,
  details text,
  created_at timestamptz,
  user_id uuid,
  user_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.type,
    l.message,
    l.details,
    l.created_at,
    l.user_id,
    u.email as user_email
  FROM admin_logs l
  LEFT JOIN users u ON u.id = l.user_id
  WHERE (
    search_query IS NULL 
    OR l.message ILIKE '%' || search_query || '%'
    OR l.details ILIKE '%' || search_query || '%'
  )
  AND (
    type_filter IS NULL 
    OR l.type = type_filter
  )
  AND (
    from_date IS NULL 
    OR l.created_at >= from_date
  )
  AND (
    to_date IS NULL 
    OR l.created_at <= to_date
  )
  ORDER BY l.created_at DESC;
END;
$$;

-- Done!
-- =============================================================================

