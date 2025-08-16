-- Create api_keys table for third-party integrations
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- API key details
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL, -- Hashed API key
  key_prefix TEXT NOT NULL, -- First 8 chars for identification (e.g., "ggp_live_")
  
  -- Permissions
  scopes TEXT[] DEFAULT ARRAY['read']::TEXT[], -- ['read', 'write', 'admin']
  
  -- Rate limiting
  rate_limit_tier TEXT DEFAULT 'free' CHECK (rate_limit_tier IN ('free', 'premium', 'unlimited')),
  
  -- Usage tracking
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  
  -- Metadata
  description TEXT,
  allowed_origins TEXT[], -- For CORS
  allowed_ips INET[], -- IP allowlist
  webhook_url TEXT, -- For event notifications
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_active_key_name UNIQUE (user_id, name)
);

-- Create index for API key lookups
CREATE INDEX idx_api_keys_key_prefix ON api_keys(key_prefix);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active);

-- Create api_key_logs table for usage tracking
CREATE TABLE IF NOT EXISTS api_key_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  
  -- Request details
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  
  -- Request metadata
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for logs
CREATE INDEX idx_api_key_logs_api_key_id ON api_key_logs(api_key_id);
CREATE INDEX idx_api_key_logs_created_at ON api_key_logs(created_at);

-- RLS Policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own API keys
CREATE POLICY "Users can view own API keys" ON api_keys
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own API keys
CREATE POLICY "Users can create own API keys" ON api_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own API keys
CREATE POLICY "Users can update own API keys" ON api_keys
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own API keys
CREATE POLICY "Users can delete own API keys" ON api_keys
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can access all API keys
CREATE POLICY "Service role full access" ON api_keys
  FOR ALL
  TO service_role
  USING (true);

-- Service role can access all logs
CREATE POLICY "Service role full access to logs" ON api_key_logs
  FOR ALL
  TO service_role
  USING (true);

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_api_key_usage(p_api_key_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE api_keys
  SET 
    usage_count = usage_count + 1,
    last_used_at = NOW()
  WHERE id = p_api_key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_api_rate_limit(p_api_key_id UUID, p_window_minutes INTEGER DEFAULT 1)
RETURNS TABLE (
  is_allowed BOOLEAN,
  current_count INTEGER,
  limit_count INTEGER
) AS $$
DECLARE
  v_rate_limit_tier TEXT;
  v_limit INTEGER;
  v_count INTEGER;
BEGIN
  -- Get the rate limit tier
  SELECT rate_limit_tier INTO v_rate_limit_tier
  FROM api_keys
  WHERE id = p_api_key_id AND is_active = true;
  
  -- Set limits based on tier
  CASE v_rate_limit_tier
    WHEN 'free' THEN v_limit := 100;
    WHEN 'premium' THEN v_limit := 1000;
    WHEN 'unlimited' THEN v_limit := 999999;
    ELSE v_limit := 0;
  END CASE;
  
  -- Count recent requests
  SELECT COUNT(*) INTO v_count
  FROM api_key_logs
  WHERE api_key_id = p_api_key_id
    AND created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  RETURN QUERY
  SELECT 
    v_count < v_limit AS is_allowed,
    v_count AS current_count,
    v_limit AS limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;