import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/utils/supabase-server'
import crypto from 'crypto'

// Types
export interface AuthContext {
  user?: {
    id: string
    email: string
    is_admin: boolean
  }
  apiKey?: {
    id: string
    user_id: string
    scopes: string[]
    rate_limit_tier: string
  }
  authType: 'user' | 'apiKey' | 'cron' | 'none'
}

// Environment validation
export function validateEnvironment() {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GOOD_GAME_LIGAEN_TOKEN',
    'CRON_SECRET_KEY',
  ]

  const missing = requiredVars.filter((v) => !process.env[v])
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    )
  }
}

// Secure string comparison to prevent timing attacks
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

// Auth middleware for user authentication
export async function withAuth(
  handler: (
    request: NextRequest,
    context: AuthContext,
  ) => Promise<NextResponse>,
) {
  return async (request: NextRequest) => {
    try {
      const supabase = await createServerClient()
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Get user details
      const { data: userDetails } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      const context: AuthContext = {
        user: {
          id: user.id,
          email: user.email!,
          is_admin: userDetails?.is_admin || false,
        },
        authType: 'user',
      }

      return handler(request, context)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 },
      )
    }
  }
}

// Admin auth middleware
export async function withAdminAuth(
  handler: (
    request: NextRequest,
    context: AuthContext,
  ) => Promise<NextResponse>,
) {
  return withAuth(async (request, context) => {
    if (!context.user?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return handler(request, context)
  })
}

// API key auth middleware
export async function withApiKeyAuth(
  handler: (
    request: NextRequest,
    context: AuthContext,
  ) => Promise<NextResponse>,
  requiredScopes?: string[],
) {
  return async (request: NextRequest) => {
    try {
      const apiKey = request.headers.get('X-API-Key')

      if (!apiKey) {
        return NextResponse.json({ error: 'Missing API key' }, { status: 401 })
      }

      if (!apiKey.startsWith('ggp_')) {
        return NextResponse.json(
          { error: 'Invalid API key format' },
          { status: 401 },
        )
      }

      // Hash the provided key
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex')
      const keyPrefix = apiKey.substring(0, 12)

      const supabase = await createServerClient()

      // Look up the API key
      const { data: apiKeyData, error } = await supabase
        .from('api_keys')
        .select('id, user_id, scopes, rate_limit_tier, is_active, expires_at')
        .eq('key_prefix', keyPrefix)
        .eq('key_hash', keyHash)
        .eq('is_active', true)
        .single()

      if (error || !apiKeyData) {
        return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
      }

      // Check if key is expired
      if (
        apiKeyData.expires_at &&
        new Date(apiKeyData.expires_at) < new Date()
      ) {
        return NextResponse.json({ error: 'API key expired' }, { status: 401 })
      }

      // Check required scopes
      if (requiredScopes && requiredScopes.length > 0) {
        const hasRequiredScope = requiredScopes.every(
          (scope) =>
            apiKeyData.scopes.includes(scope) ||
            apiKeyData.scopes.includes('admin'),
        )
        if (!hasRequiredScope) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 },
          )
        }
      }

      const context: AuthContext = {
        apiKey: {
          id: apiKeyData.id,
          user_id: apiKeyData.user_id,
          scopes: apiKeyData.scopes,
          rate_limit_tier: apiKeyData.rate_limit_tier,
        },
        authType: 'apiKey',
      }

      return handler(request, context)
    } catch (error) {
      console.error('API key auth error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 },
      )
    }
  }
}

// Cron auth middleware
export async function withCronAuth(
  handler: (
    request: NextRequest,
    context: AuthContext,
  ) => Promise<NextResponse>,
) {
  return async (request: NextRequest) => {
    try {
      const authHeader = request.headers.get('authorization')
      const expectedToken = `Bearer ${process.env.CRON_SECRET_KEY}`

      if (!authHeader || !secureCompare(authHeader, expectedToken)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const context: AuthContext = {
        authType: 'cron',
      }

      return handler(request, context)
    } catch (error) {
      console.error('Cron auth error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 },
      )
    }
  }
}

// Combined auth middleware (allows multiple auth methods)
export async function withMultiAuth(
  handler: (
    request: NextRequest,
    context: AuthContext,
  ) => Promise<NextResponse>,
  options: {
    allowUser?: boolean
    allowApiKey?: boolean
    allowCron?: boolean
    requiredScopes?: string[]
  } = {},
) {
  return async (request: NextRequest) => {
    const {
      allowUser = true,
      allowApiKey = true,
      allowCron = false,
      requiredScopes,
    } = options

    // Try API key first
    if (allowApiKey && request.headers.get('X-API-Key')) {
      const apiKeyHandler = await withApiKeyAuth(handler, requiredScopes)
      return apiKeyHandler(request)
    }

    // Try cron auth
    if (
      allowCron &&
      request.headers.get('authorization')?.startsWith('Bearer')
    ) {
      const cronHandler = await withCronAuth(handler)
      return cronHandler(request)
    }

    // Try user auth
    if (allowUser) {
      const authHandler = await withAuth(handler)
      return authHandler(request)
    }

    return NextResponse.json(
      { error: 'No valid authentication provided' },
      { status: 401 },
    )
  }
}
