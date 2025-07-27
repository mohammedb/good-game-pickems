-- Create seasons table to track different Good Game Ligaen seasons
CREATE TABLE IF NOT EXISTS seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id text UNIQUE NOT NULL, -- The Good Game Ligaen season ID (e.g., '13162')
  name text NOT NULL, -- Display name (e.g., 'Spring 2024', 'Fall 2024')
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone,
  is_active boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_seasons_season_id ON seasons(season_id);
CREATE INDEX IF NOT EXISTS idx_seasons_is_active ON seasons(is_active);

-- Enable RLS
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

-- Everyone can view seasons
CREATE POLICY "Anyone can view seasons"
ON seasons FOR SELECT
TO authenticated
USING (true);

-- Only admins can modify seasons
CREATE POLICY "Only admins can modify seasons"
ON seasons FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'is_admin') = 'true')
WITH CHECK ((auth.jwt() ->> 'is_admin') = 'true');

-- Add trigger for updated_at
CREATE TRIGGER update_seasons_updated_at
BEFORE UPDATE ON seasons
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Insert the current season
INSERT INTO seasons (season_id, name, start_date, is_active)
VALUES ('13162', 'Spring 2024', '2024-01-01'::timestamp with time zone, true)
ON CONFLICT (season_id) DO NOTHING;