import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/utils/supabase-server'
import { AuthContext } from './api-middleware'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  keyPrefix?: string // Optional prefix for rate limit key
}

interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  reset: Date
  retryAfter?: number
}

// Default rate limits by tier
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  free: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
  pro: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 1000,
  },
  enterprise: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10000,
  },
  admin: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10000,
  },
}

// Check rate limit for API key
async function checkApiKeyRateLimit(
  apiKeyId: string,
  tier: string = 'free',
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[tier] || RATE_LIMITS.free
  const now = new Date()
  const windowStart = new Date(now.getTime() - config.windowMs)

  try {
    const supabase = await createServerClient()

    // Try to use the RPC function first
    try {
      const { data, error } = (await supabase
        .rpc('check_api_rate_limit', {
          p_api_key_id: apiKeyId,
          p_window_start: windowStart.toISOString(),
        })
        .single()) as { data: { current_count?: number } | null; error: any }

      if (!error && data) {
        const currentCount = data.current_count || 0
        const allowed = currentCount < config.maxRequests
        const remaining = Math.max(0, config.maxRequests - currentCount)
        const reset = new Date(windowStart.getTime() + config.windowMs)

        return {
          allowed,
          limit: config.maxRequests,
          remaining,
          reset,
          retryAfter: allowed
            ? undefined
            : Math.ceil((reset.getTime() - now.getTime()) / 1000),
        }
      }
    } catch (rpcError) {
      // RPC function might not exist, fall back to direct query
      console.warn('RPC rate limit check failed, using fallback:', rpcError)
    }

    // Fallback: count api_key_logs directly
    const { count } = await supabase
      .from('api_key_logs')
      .select('*', { count: 'exact', head: true })
      .eq('api_key_id', apiKeyId)
      .gte('created_at', windowStart.toISOString())

    const currentCount = count || 0
    const allowed = currentCount < config.maxRequests
    const remaining = Math.max(0, config.maxRequests - currentCount)
    const reset = new Date(windowStart.getTime() + config.windowMs)

    return {
      allowed,
      limit: config.maxRequests,
      remaining,
      reset,
      retryAfter: allowed
        ? undefined
        : Math.ceil((reset.getTime() - now.getTime()) / 1000),
    }
  } catch (error) {
    console.error('Rate limit check error:', error)
    // On error, allow the request but with conservative limits
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      reset: new Date(now.getTime() + config.windowMs),
    }
  }
}

// Check rate limit for authenticated user
async function checkUserRateLimit(
  userId: string,
  endpoint: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const now = new Date()
  const windowStart = new Date(now.getTime() - config.windowMs)
  const rateLimitKey = `user:${userId}:${config.keyPrefix || endpoint}`

  try {
    const supabase = await createServerClient()

    // Check current usage (skip if table doesn't exist)
    let currentCount = 0
    try {
      const { count } = await supabase
        .from('rate_limit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('key', rateLimitKey)
        .gte('created_at', windowStart.toISOString())

      currentCount = count || 0
    } catch (error) {
      console.warn('Rate limit logs table might not exist:', error)
    }

    const allowed = currentCount < config.maxRequests
    const remaining = Math.max(0, config.maxRequests - currentCount)
    const reset = new Date(windowStart.getTime() + config.windowMs)

    if (allowed) {
      // Log this request (skip if table doesn't exist)
      try {
        await supabase.from('rate_limit_logs').insert({
          key: rateLimitKey,
          endpoint,
          user_id: userId,
        })
      } catch (error) {
        console.warn('Failed to log rate limit:', error)
      }
    }

    return {
      allowed,
      limit: config.maxRequests,
      remaining,
      reset,
      retryAfter: allowed
        ? undefined
        : Math.ceil((reset.getTime() - now.getTime()) / 1000),
    }
  } catch (error) {
    console.error('User rate limit check error:', error)
    // On error, allow the request but with conservative limits
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: 1,
      reset: new Date(now.getTime() + config.windowMs),
    }
  }
}

// Check rate limit by IP address
async function checkIPRateLimit(
  ip: string,
  endpoint: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const now = new Date()
  const windowStart = new Date(now.getTime() - config.windowMs)
  const rateLimitKey = `ip:${ip}:${config.keyPrefix || endpoint}`

  try {
    const supabase = await createServerClient()

    // Check current usage (skip if table doesn't exist)
    let currentCount = 0
    try {
      const { count } = await supabase
        .from('rate_limit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('key', rateLimitKey)
        .gte('created_at', windowStart.toISOString())

      currentCount = count || 0
    } catch (error) {
      console.warn('Rate limit logs table might not exist:', error)
    }

    const allowed = currentCount < config.maxRequests
    const remaining = Math.max(0, config.maxRequests - currentCount)
    const reset = new Date(windowStart.getTime() + config.windowMs)

    if (allowed) {
      // Log this request (skip if table doesn't exist)
      try {
        await supabase.from('rate_limit_logs').insert({
          key: rateLimitKey,
          endpoint,
          ip_address: ip,
        })
      } catch (error) {
        console.warn('Failed to log rate limit:', error)
      }
    }

    return {
      allowed,
      limit: config.maxRequests,
      remaining,
      reset,
      retryAfter: allowed
        ? undefined
        : Math.ceil((reset.getTime() - now.getTime()) / 1000),
    }
  } catch (error) {
    console.error('IP rate limit check error:', error)
    // On error, allow the request but with conservative limits
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: 1,
      reset: new Date(now.getTime() + config.windowMs),
    }
  }
}

// Rate limit middleware
export function withRateLimit(
  handler: (
    request: NextRequest,
    context: AuthContext,
  ) => Promise<NextResponse>,
  customConfig?: Partial<RateLimitConfig>,
) {
  return async (request: NextRequest, context: AuthContext) => {
    const endpoint = request.nextUrl.pathname
    let rateLimitResult: RateLimitResult

    // Check rate limit based on auth type
    if (context.authType === 'apiKey' && context.apiKey) {
      rateLimitResult = await checkApiKeyRateLimit(
        context.apiKey.id,
        context.apiKey.rate_limit_tier,
      )
    } else if (context.authType === 'user' && context.user) {
      const config = {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 60, // 60 requests per minute for authenticated users
        ...customConfig,
      }
      rateLimitResult = await checkUserRateLimit(
        context.user.id,
        endpoint,
        config,
      )
    } else {
      // For unauthenticated requests, rate limit by IP
      const ip = getClientIP(request) || 'unknown'
      const config = {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 20, // 20 requests per minute for unauthenticated
        ...customConfig,
      }
      rateLimitResult = await checkIPRateLimit(ip, endpoint, config)
    }

    // Set rate limit headers
    const response = await (async () => {
      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: `Too many requests. Please retry after ${rateLimitResult.retryAfter} seconds.`,
          },
          { status: 429 },
        )
      }

      return handler(request, context)
    })()

    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
    response.headers.set(
      'X-RateLimit-Remaining',
      rateLimitResult.remaining.toString(),
    )
    response.headers.set(
      'X-RateLimit-Reset',
      rateLimitResult.reset.toISOString(),
    )

    if (rateLimitResult.retryAfter) {
      response.headers.set('Retry-After', rateLimitResult.retryAfter.toString())
    }

    return response
  }
}

// Helper to get client IP
function getClientIP(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  return realIP
}

// Create rate limit tables if they don't exist
export const rateLimitSchema = `
-- Rate limit logs table
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

-- Cleanup old rate limit logs (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_rate_limit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limit_logs 
  WHERE created_at < NOW() - INTERVAL '1 hour';
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
`
