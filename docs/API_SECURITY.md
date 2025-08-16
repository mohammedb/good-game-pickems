# API Security Implementation Guide

This document outlines the comprehensive security measures implemented for the Good Game Pickems API.

## Overview

The API security implementation includes:
- Centralized authentication middleware
- Input validation and sanitization
- Rate limiting with proper headers
- CORS and security headers
- Request logging and monitoring
- Environment variable validation

## Authentication Middleware

### Available Authentication Methods

1. **User Authentication** (`withAuth`)
   - Uses Supabase Auth to verify user sessions
   - Automatically fetches user details including admin status

2. **Admin Authentication** (`withAdminAuth`)
   - Extends user authentication with admin check
   - Returns 403 Forbidden for non-admin users

3. **API Key Authentication** (`withApiKeyAuth`)
   - Validates API keys with SHA-256 hashing
   - Supports scope-based permissions
   - Tracks usage and enforces rate limits

4. **Cron Authentication** (`withCronAuth`)
   - Uses secure token comparison
   - Protects scheduled task endpoints

### Usage Examples

```typescript
// User authentication
export const GET = withAuth(async (request, context) => {
  // context.user contains user details
})

// Admin authentication
export const POST = withAdminAuth(async (request, context) => {
  // Only admins can access this endpoint
})

// API key authentication with scopes
export const GET = withApiKeyAuth(async (request, context) => {
  // context.apiKey contains API key details
}, ['read', 'write'])

// Cron authentication
export const POST = withCronAuth(async (request, context) => {
  // Protected cron endpoint
})
```

## Input Validation

### Validation Schemas

Pre-defined schemas for common operations:

```typescript
// API key creation
schemas.createApiKey = {
  name: string (required, max 50 chars),
  description: string (optional, max 200 chars),
  scopes: array of ['read', 'write', 'admin']
}

// Pagination
schemas.pagination = {
  limit: number (1-100, default 20),
  offset: number (min 0, default 0)
}

// Game types
schemas.gameType = enum(['csgo', 'lol', 'valorant'])
```

### Usage

```typescript
const { data, error } = await validateRequestBody(request, schemas.createApiKey)
if (error) {
  return NextResponse.json({ error }, { status: 400 })
}
```

## Rate Limiting

### Configuration by Tier

- **Free**: 100 requests/minute
- **Pro**: 1,000 requests/minute
- **Enterprise**: 10,000 requests/minute
- **Admin**: 10,000 requests/minute

### Custom Rate Limits

```typescript
withRateLimit(handler, {
  maxRequests: 10,
  windowMs: 60 * 1000 // 1 minute
})
```

### Response Headers

All rate-limited endpoints return:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Reset time (ISO 8601)
- `Retry-After`: Seconds until retry (when rate limited)

## Security Headers

### Automatic Headers

All API responses include:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security` (production only)

### CORS Configuration

Default CORS settings:
- Allowed Origins: App URL + Vercel domains
- Allowed Methods: GET, POST, PUT, DELETE, OPTIONS
- Allowed Headers: Content-Type, Authorization, X-API-Key
- Exposed Headers: Rate limit headers
- Credentials: true

## Request Logging

### Logged Information

- HTTP method and path
- Response status and duration
- Client IP address
- User agent
- User ID or API key ID
- Error messages (if any)
- Request/response sizes

### Monitoring Metrics

Available metrics per endpoint:
- Total requests
- Success rate
- Average response time
- P95/P99 response times
- Error rate

## Environment Variables

### Required Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Good Game Ligaen API
GOOD_GAME_LIGAEN_TOKEN=xxx
GOOD_GAME_LOL_DIVISION_ID=12518
GOOD_GAME_VALORANT_DIVISION_ID=13601

# Security
CRON_SECRET_KEY=xxx (min 32 chars)
```

### Validation on Startup

The application validates all required environment variables on startup. In production, missing variables will cause the process to exit.

## Complete Implementation Example

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-middleware'
import { withRateLimit } from '@/lib/api-rate-limit'
import { withLogging } from '@/lib/api-logging'
import { validateRequestBody, schemas } from '@/lib/api-validation'
import { secureApiEndpoint } from '@/lib/api-security'

export const POST = secureApiEndpoint(
  withAuth(
    withLogging(
      withRateLimit(async (request: NextRequest, context) => {
        // Validate input
        const { data, error } = await validateRequestBody(
          request,
          schemas.createPick
        )
        
        if (error) {
          return NextResponse.json({ error }, { status: 400 })
        }

        // Process request...
        
        return NextResponse.json({ success: true })
      }, { maxRequests: 30, windowMs: 60 * 1000 })
    )
  )
)
```

## Database Migrations

Run the security tables migration:

```bash
psql $DATABASE_URL < src/db/migrations/add_security_tables.sql
```

## Security Best Practices

1. **Never expose sensitive tokens** in client-side code
2. **Always validate input** before processing
3. **Use appropriate rate limits** for each endpoint
4. **Log all API activity** for monitoring
5. **Implement proper CORS** for cross-origin requests
6. **Use HTTPS only** in production
7. **Rotate API keys** regularly
8. **Monitor for anomalies** in API usage

## Monitoring and Alerts

Set up monitoring for:
- High error rates (> 5%)
- Slow response times (> 1000ms P95)
- Unusual request patterns
- Failed authentication attempts
- Rate limit violations

## Testing

```typescript
// Test authentication
const response = await fetch('/api/endpoint', {
  headers: {
    'Authorization': 'Bearer xxx'
  }
})

// Test API key
const response = await fetch('/api/endpoint', {
  headers: {
    'X-API-Key': 'ggp_live_xxx'
  }
})

// Test rate limiting
for (let i = 0; i < 150; i++) {
  const response = await fetch('/api/endpoint')
  console.log(response.headers.get('X-RateLimit-Remaining'))
}
```