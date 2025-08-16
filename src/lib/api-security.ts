import { NextRequest, NextResponse } from 'next/server'

interface SecurityHeaders {
  [key: string]: string
}

// CORS configuration
export interface CorsConfig {
  allowedOrigins?: string[]
  allowedMethods?: string[]
  allowedHeaders?: string[]
  exposeHeaders?: string[]
  maxAge?: number
  credentials?: boolean
}

const DEFAULT_CORS_CONFIG: CorsConfig = {
  allowedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'https://good-game-pickems.vercel.app',
  ].filter(Boolean),
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  exposeHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  maxAge: 86400, // 24 hours
  credentials: true,
}

// Apply security headers to response
export function applySecurityHeaders(response: NextResponse): NextResponse {
  const headers: SecurityHeaders = {
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',

    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // Enable XSS protection
    'X-XSS-Protection': '1; mode=block',

    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions policy
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',

    // HSTS (only in production)
    ...(process.env.NODE_ENV === 'production' && {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    }),
  }

  Object.entries(headers).forEach(([key, value]) => {
    if (value) response.headers.set(key, value)
  })

  return response
}

// Apply CORS headers
export function applyCorsHeaders(
  request: NextRequest,
  response: NextResponse,
  config: CorsConfig = DEFAULT_CORS_CONFIG,
): NextResponse {
  const origin = request.headers.get('origin')

  // Check if origin is allowed
  if (origin && config.allowedOrigins) {
    const isAllowed =
      config.allowedOrigins.includes('*') ||
      config.allowedOrigins.includes(origin)

    if (isAllowed) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    }
  }

  // Set other CORS headers
  if (config.allowedMethods) {
    response.headers.set(
      'Access-Control-Allow-Methods',
      config.allowedMethods.join(', '),
    )
  }

  if (config.allowedHeaders) {
    response.headers.set(
      'Access-Control-Allow-Headers',
      config.allowedHeaders.join(', '),
    )
  }

  if (config.exposeHeaders) {
    response.headers.set(
      'Access-Control-Expose-Headers',
      config.exposeHeaders.join(', '),
    )
  }

  if (config.maxAge) {
    response.headers.set('Access-Control-Max-Age', config.maxAge.toString())
  }

  if (config.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  return response
}

// Handle preflight requests
export function handlePreflight(
  request: NextRequest,
  config?: CorsConfig,
): NextResponse {
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 })
    return applyCorsHeaders(request, response, config)
  }

  return NextResponse.next()
}

// Combined security middleware
export function withSecurity(
  handler: (request: NextRequest) => Promise<NextResponse>,
  corsConfig?: CorsConfig,
) {
  return async (request: NextRequest) => {
    // Handle preflight
    if (request.method === 'OPTIONS') {
      return handlePreflight(request, corsConfig)
    }

    // Process the request
    const response = await handler(request)

    // Apply security headers
    applySecurityHeaders(response)

    // Apply CORS headers
    applyCorsHeaders(request, response, corsConfig)

    return response
  }
}

// API endpoint security wrapper
export function secureApiEndpoint(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options?: {
    cors?: CorsConfig
    requireHttps?: boolean
  },
) {
  return async (request: NextRequest) => {
    // Enforce HTTPS in production
    if (
      options?.requireHttps !== false &&
      process.env.NODE_ENV === 'production'
    ) {
      const proto = request.headers.get('x-forwarded-proto')
      if (proto !== 'https') {
        return NextResponse.json({ error: 'HTTPS required' }, { status: 403 })
      }
    }

    return withSecurity(handler, options?.cors)(request)
  }
}
