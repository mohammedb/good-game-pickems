-- Create admin_logs table
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  details TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_logs_type ON admin_logs(type);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_logs_user_id ON admin_logs(user_id);

-- Enable RLS
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Allow admins to view logs" ON admin_logs;
  DROP POLICY IF EXISTS "Allow admins to insert logs" ON admin_logs;
  
  -- Create new policies
  CREATE POLICY "Allow admins to view logs" ON admin_logs
    FOR SELECT
    USING (
      auth.uid() IN (
        SELECT id FROM users WHERE is_admin = true
      )
    );

  CREATE POLICY "Allow admins to insert logs" ON admin_logs
    FOR INSERT
    WITH CHECK (
      auth.uid() IN (
        SELECT id FROM users WHERE is_admin = true
      )
    );
END $$;

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS update_admin_logs_updated_at ON admin_logs;
CREATE TRIGGER update_admin_logs_updated_at
    BEFORE UPDATE ON admin_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Drop existing foreign key if it exists
ALTER TABLE admin_logs
  DROP CONSTRAINT IF EXISTS fk_admin_logs_user;

-- Add foreign key relationship to auth.users table
ALTER TABLE admin_logs
  ADD CONSTRAINT fk_admin_logs_user
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT SELECT ON auth.users TO postgres, authenticated, service_role;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_admin_logs;

-- Create function to get admin logs with user emails
CREATE OR REPLACE FUNCTION get_admin_logs(
  search_query TEXT DEFAULT '',
  type_filter TEXT DEFAULT NULL,
  from_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  to_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  message TEXT,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  user_id UUID,
  user_email VARCHAR(255)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.type,
    al.message,
    al.details,
    al.created_at,
    al.user_id,
    au.email as user_email
  FROM admin_logs al
  LEFT JOIN auth.users au ON al.user_id = au.id
  WHERE
    (search_query = '' OR 
     al.message ILIKE '%' || search_query || '%' OR 
     al.details ILIKE '%' || search_query || '%' OR
     au.email ILIKE '%' || search_query || '%')
    AND (type_filter IS NULL OR al.type = type_filter)
    AND (from_date IS NULL OR al.created_at >= from_date)
    AND (to_date IS NULL OR al.created_at <= to_date)
  ORDER BY al.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER; 