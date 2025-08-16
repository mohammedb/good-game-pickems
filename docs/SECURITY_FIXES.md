# Security Fixes - Quick Start Guide

## Immediate Fix for 401 Errors

The API routes are now more secure, but the security tables need to be created in your database. The code has been updated to handle missing tables gracefully, so your API should work immediately.

## What Was Secured

1. **API Key Authentication** - Enhanced with proper rate limiting and logging
2. **Admin Routes** - Now require proper authentication
3. **Cron Endpoints** - Protected with secure token validation
4. **Input Validation** - All inputs are validated and sanitized
5. **Rate Limiting** - Prevents API abuse
6. **Security Headers** - CORS, XSS protection, etc.

## To Enable Full Security Features

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and run the SQL from: `src/db/migrations/add_security_tables.sql`

### Option 2: Using Supabase CLI

```bash
supabase db push --file src/db/migrations/add_security_tables.sql
```

### Option 3: Using the Migration Script

```bash
node scripts/run-security-migration.js
```

## What Happens Without the Migration?

Your API will still work! The security middleware gracefully handles missing tables:
- Rate limiting will be skipped (but API keys still validated)
- Request logging will be skipped
- All authentication still works

## Environment Variables

Make sure you have these security-related environment variables set:

```env
# Required for cron endpoints
CRON_SECRET_KEY=your-secret-key-at-least-32-chars

# Optional but recommended
NEXT_PUBLIC_APP_URL=https://your-app-url.com
```

## Testing the API

Your overlay should work immediately. Test it:

```bash
# Test with your API key
curl -H "X-API-Key: your-api-key" http://localhost:3000/api/v1/overlay
```

## Security Features Added

- **Authentication**: User, Admin, API Key, and Cron auth
- **Rate Limiting**: 100 req/min (free), 1000 req/min (pro)
- **Input Validation**: Zod schemas with sanitization
- **Logging**: All API requests logged for monitoring
- **Security Headers**: XSS, CSRF, clickjacking protection

## Need Help?

If you're still seeing 401 errors:
1. Check that your API key is valid and active
2. Make sure you're including the `X-API-Key` header
3. Check the browser console for specific error messages

The security improvements are designed to fail gracefully, so your app should continue working while you set up the database tables.