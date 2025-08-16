-- Rate limit logs table for tracking API rate limits
CREATE TABLE IF NOT EXISTS rate_limit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(255) NOT NULL,
  endpoint VARCHAR(255),
  user_id UUID REFERENCES users(id),
  api_key_id UUID REFERENCES api_keys(id),
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient rate limit checks
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_lookup 
ON rate_limit_logs(key, created_at DESC);

-- API logs table for request logging and monitoring
CREATE TABLE IF NOT EXISTS api_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  method VARCHAR(10) NOT NULL,
  path VARCHAR(255) NOT NULL,
  status INTEGER NOT NULL,
  duration INTEGER NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  user_id UUID REFERENCES users(id),
  api_key_id UUID REFERENCES api_keys(id),
  error_message TEXT,
  request_size INTEGER DEFAULT 0,
  response_size INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_api_logs_path_created 
ON api_logs(path, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_logs_user_created 
ON api_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_logs_api_key_created 
ON api_logs(api_key_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_logs_status_created 
ON api_logs(status, created_at DESC);

-- Function to clean up old rate limit logs (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_rate_limit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limit_logs 
  WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old API logs (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_api_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM api_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Updated rate limit check function
CREATE OR REPLACE FUNCTION check_api_rate_limit(
  p_api_key_id UUID,
  p_window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '1 minute'
)
RETURNS TABLE(
  is_allowed BOOLEAN,
  current_count INTEGER,
  limit_count INTEGER
) AS $$
DECLARE
  v_rate_limit_tier VARCHAR;
  v_limit INTEGER;
  v_current_count INTEGER;
BEGIN
  -- Get the API key's rate limit tier
  SELECT rate_limit_tier INTO v_rate_limit_tier
  FROM api_keys
  WHERE id = p_api_key_id AND is_active = true;

  -- Set limit based on tier
  v_limit := CASE v_rate_limit_tier
    WHEN 'free' THEN 100
    WHEN 'pro' THEN 1000
    WHEN 'enterprise' THEN 10000
    ELSE 100
  END;

  -- Count requests in the window
  SELECT COUNT(*) INTO v_current_count
  FROM api_key_logs
  WHERE api_key_id = p_api_key_id
    AND created_at >= p_window_start;

  RETURN QUERY
  SELECT 
    v_current_count < v_limit AS is_allowed,
    v_current_count AS current_count,
    v_limit AS limit_count;
END;
$$ LANGUAGE plpgsql;

-- RLS policies for rate_limit_logs
ALTER TABLE rate_limit_logs ENABLE ROW LEVEL SECURITY;

-- Only allow service role to insert/delete rate limit logs
CREATE POLICY "Service role manages rate limit logs" ON rate_limit_logs
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- RLS policies for api_logs
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

-- Only allow service role to manage API logs
CREATE POLICY "Service role manages API logs" ON api_logs
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Users can view their own API logs
CREATE POLICY "Users can view own API logs" ON api_logs
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() IN (
      SELECT user_id FROM api_keys WHERE id = api_logs.api_key_id
    )
  );

-- Schedule cleanup jobs (if using pg_cron extension)
-- SELECT cron.schedule('cleanup-rate-limits', '0 * * * *', 'SELECT cleanup_rate_limit_logs();');
-- SELECT cron.schedule('cleanup-api-logs', '0 0 * * *', 'SELECT cleanup_api_logs();');