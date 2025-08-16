import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/utils/supabase-server'
import { AuthContext } from './api-middleware'
import { getClientIP } from './api-validation'

interface ApiLog {
  method: string
  path: string
  status: number
  duration: number
  ip_address: string | null
  user_agent: string | null
  user_id?: string
  api_key_id?: string
  error_message?: string
  request_size: number
  response_size: number
}

// Log API requests to database
async function logApiRequest(log: ApiLog) {
  try {
    const supabase = await createServerClient()

    // Try to insert, but don't fail the request if table doesn't exist
    const { error } = await supabase.from('api_logs').insert({
      ...log,
      created_at: new Date().toISOString(),
    })

    if (error && error.code === '42P01') {
      // Table doesn't exist yet
      console.warn('API logs table does not exist yet')
    } else if (error) {
      console.error('Failed to log API request:', error)
    }
  } catch (error) {
    console.error('Failed to log API request:', error)
  }
}

// Calculate content length
function getContentLength(headers: Headers): number {
  const contentLength = headers.get('content-length')
  return contentLength ? parseInt(contentLength, 10) : 0
}

// Logging middleware
export function withLogging(
  handler: (
    request: NextRequest,
    context?: AuthContext,
  ) => Promise<NextResponse>,
) {
  return async (request: NextRequest, context?: AuthContext) => {
    const startTime = Date.now()
    const method = request.method
    const path = request.nextUrl.pathname
    const ip = getClientIP(request)
    const userAgent = request.headers.get('user-agent')
    const requestSize = getContentLength(request.headers)

    let response: NextResponse
    let errorMessage: string | undefined

    try {
      response = await handler(request, context)
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unknown error'
      response = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 },
      )
    }

    const duration = Date.now() - startTime
    const status = response.status
    const responseSize = getContentLength(response.headers)

    // Log the request
    await logApiRequest({
      method,
      path,
      status,
      duration,
      ip_address: ip,
      user_agent: userAgent,
      user_id: context?.user?.id,
      api_key_id: context?.apiKey?.id,
      error_message:
        errorMessage || (status >= 400 ? 'Request failed' : undefined),
      request_size: requestSize,
      response_size: responseSize,
    })

    // Add timing header
    response.headers.set('X-Response-Time', `${duration}ms`)

    return response
  }
}

// Monitor endpoint performance
export async function getEndpointMetrics(
  endpoint: string,
  timeRange: { start: Date; end: Date },
) {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('api_logs')
      .select('status, duration')
      .eq('path', endpoint)
      .gte('created_at', timeRange.start.toISOString())
      .lte('created_at', timeRange.end.toISOString())

    if (error) throw error

    const metrics = {
      totalRequests: data.length,
      successRate: data.filter((r) => r.status < 400).length / data.length,
      averageResponseTime:
        data.reduce((sum, r) => sum + r.duration, 0) / data.length,
      p95ResponseTime: calculatePercentile(
        data.map((r) => r.duration),
        95,
      ),
      p99ResponseTime: calculatePercentile(
        data.map((r) => r.duration),
        99,
      ),
      errorRate: data.filter((r) => r.status >= 500).length / data.length,
    }

    return metrics
  } catch (error) {
    console.error('Failed to get endpoint metrics:', error)
    return null
  }
}

// Calculate percentile
function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0

  const sorted = values.sort((a, b) => a - b)
  const index = Math.ceil((percentile / 100) * sorted.length) - 1
  return sorted[index]
}

// Create API logs table schema
export const apiLogsSchema = `
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

-- Function to clean up old logs
CREATE OR REPLACE FUNCTION cleanup_api_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM api_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
`

// Alert configuration for monitoring
export interface AlertConfig {
  errorRateThreshold: number // Percentage
  responseTimeThreshold: number // Milliseconds
  requestRateThreshold: number // Requests per minute
}

// Check if alerts should be triggered
export async function checkAlerts(
  endpoint: string,
  config: AlertConfig,
): Promise<string[]> {
  const alerts: string[] = []
  const now = new Date()
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)

  const metrics = await getEndpointMetrics(endpoint, {
    start: oneMinuteAgo,
    end: now,
  })

  if (!metrics) return alerts

  if (metrics.errorRate * 100 > config.errorRateThreshold) {
    alerts.push(`High error rate: ${(metrics.errorRate * 100).toFixed(1)}%`)
  }

  if (metrics.p95ResponseTime > config.responseTimeThreshold) {
    alerts.push(`Slow response time: ${metrics.p95ResponseTime}ms (p95)`)
  }

  if (metrics.totalRequests > config.requestRateThreshold) {
    alerts.push(`High request rate: ${metrics.totalRequests} requests/minute`)
  }

  return alerts
}
