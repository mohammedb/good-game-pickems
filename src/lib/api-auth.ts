import { NextRequest } from 'next/server'
import { createServiceRoleClient } from '@/utils/supabase-server'
import crypto from 'crypto'

export interface ApiKeyData {
  id: string
  user_id: string
  scopes: string[]
  rate_limit_tier: string
}

export async function validateApiKey(request: NextRequest): Promise<{
  valid: boolean
  apiKey?: ApiKeyData
  error?: string
}> {
  const apiKey = request.headers.get('X-API-Key')

  if (!apiKey) {
    return { valid: false, error: 'Missing API key' }
  }

  if (!apiKey.startsWith('ggp_')) {
    return { valid: false, error: 'Invalid API key format' }
  }

  try {
    // Hash the provided key
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex')
    const keyPrefix = apiKey.substring(0, 12)

    // Get service role client for API key validation
    const supabase = createServiceRoleClient()

    // Look up the API key
    const { data: apiKeyData, error } = await supabase
      .from('api_keys')
      .select('id, user_id, scopes, rate_limit_tier, is_active, expires_at')
      .eq('key_prefix', keyPrefix)
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .single()

    if (error || !apiKeyData) {
      return { valid: false, error: 'Invalid API key' }
    }

    // Check if key is expired
    if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
      return { valid: false, error: 'API key expired' }
    }

    // Check rate limit (skip if function doesn't exist yet)
    try {
      const { data: rateLimitCheck } = (await supabase
        .rpc('check_api_rate_limit', { p_api_key_id: apiKeyData.id })
        .single()) as {
        data: {
          is_allowed: boolean
          current_count: number
          limit_count: number
        } | null
      }

      if (rateLimitCheck && !rateLimitCheck.is_allowed) {
        return {
          valid: false,
          error: `Rate limit exceeded. Current: ${rateLimitCheck.current_count}/${rateLimitCheck.limit_count} requests per minute`,
        }
      }
    } catch (rpcError) {
      // Rate limit function might not exist yet, allow the request
      console.warn('Rate limit check skipped:', rpcError)
    }

    // Log the API request (skip if table doesn't exist yet)
    try {
      await supabase.from('api_key_logs').insert({
        api_key_id: apiKeyData.id,
        endpoint: request.nextUrl.pathname,
        method: request.method,
        ip_address:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
      })
    } catch (logError) {
      console.warn('API key log skipped:', logError)
    }

    // Increment usage count (skip if function doesn't exist yet)
    try {
      await supabase.rpc('increment_api_key_usage', {
        p_api_key_id: apiKeyData.id,
      })
    } catch (rpcError) {
      console.warn('Usage increment skipped:', rpcError)
    }

    return {
      valid: true,
      apiKey: {
        id: apiKeyData.id,
        user_id: apiKeyData.user_id,
        scopes: apiKeyData.scopes,
        rate_limit_tier: apiKeyData.rate_limit_tier,
      },
    }
  } catch (error) {
    console.error('Error validating API key:', error)
    return { valid: false, error: 'Internal server error' }
  }
}

export function hasScope(apiKey: ApiKeyData, requiredScope: string): boolean {
  return (
    apiKey.scopes.includes(requiredScope) || apiKey.scopes.includes('admin')
  )
}

export function createApiResponse(data: any, meta?: any) {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0',
      ...meta,
    },
  }
}

export function createApiError(
  code: string,
  message: string,
  status: number,
  details?: any,
) {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  }
}
