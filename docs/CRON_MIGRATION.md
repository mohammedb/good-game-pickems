# CRON Job Migration Guide

## Overview

This guide helps you migrate from the legacy database-based CRON job to the new API-based CRON system for match synchronization.

## Why Migrate?

### Old System (Database CRON)
- ❌ Uses placeholder `sync_match_results()` function
- ❌ Doesn't actually fetch from Good Game Ligaen API
- ❌ Hardcoded to old API structure
- ❌ No multi-game support
- ❌ Limited error handling

### New System (API CRON)
- ✅ Uses updated Good Game Ligaen API (gamer.no)
- ✅ Supports all three games (CS:GO, LoL, Valorant)
- ✅ Uses service role client (bypasses RLS)
- ✅ Proper error handling and logging
- ✅ Same code as admin sync functionality

## Migration Steps

### 1. Disable Legacy Database CRON

**In Supabase SQL Editor**, run:

```sql
-- Check if the cron job exists
SELECT * FROM cron.job WHERE jobname = 'sync-matches';

-- Remove the legacy cron job
SELECT cron.unschedule('sync-matches');

-- Verify it's removed
SELECT * FROM cron.job WHERE jobname = 'sync-matches';

-- Mark function as deprecated (optional)
COMMENT ON FUNCTION sync_match_results() IS 'DEPRECATED: Use /api/cron/sync-matches endpoint instead.';
```

### 2. Set Up API-based CRON

**Configure your hosting platform** (Vercel, Railway, etc.) to call:

```bash
# Match Sync CRON
URL: POST https://your-domain.com/api/cron/sync-matches
Headers: 
  Authorization: Bearer YOUR_CRON_SECRET_KEY
  Content-Type: application/json
Schedule: Every 30 minutes (*/30 * * * *)
Body: {} 
# Or specify specific games: {"gameTypes": ["lol"]}
```

### 3. Environment Variables

Ensure these are set in your deployment:

```bash
# Required for API CRON authentication
CRON_SECRET_KEY=your_secure_random_key

# Good Game Ligaen API configuration
GOOD_GAME_LIGAEN_TOKEN=your_bearer_token
GOOD_GAME_SEASON_ID=13600
GOOD_GAME_CS_DIVISION_ID=18351
GOOD_GAME_LOL_DIVISION_ID=18353
GOOD_GAME_VALORANT_DIVISION_ID=18355

# Supabase configuration
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Test the New System

**Manual test**:
```bash
curl -X POST "https://your-domain.com/api/cron/sync-matches" \
  -H "Authorization: Bearer YOUR_CRON_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected response**:
```json
{
  "success": true,
  "synced_matches": 21,
  "matches": [...],
  "timestamp": "2025-08-16T14:30:00.000Z"
}
```

## Platform-Specific Setup

### Vercel
1. Go to your project dashboard
2. Settings → Functions → Cron Jobs
3. Add new cron job:
   - **Path**: `/api/cron/sync-matches`
   - **Schedule**: `*/30 * * * *` (every 30 minutes)
   - **Headers**: `Authorization: Bearer YOUR_CRON_SECRET_KEY`

### Railway
1. Go to your project
2. Variables → Add `CRON_SECRET_KEY`
3. Use a service like GitHub Actions or external cron service

### Supabase Edge Functions (Alternative)
If you prefer to keep everything in Supabase:

```typescript
// supabase/functions/sync-matches-new/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // Call your API endpoint
  const response = await fetch(`${Deno.env.get('SITE_URL')}/api/cron/sync-matches`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('CRON_SECRET_KEY')}`,
      'Content-Type': 'application/json'
    }
  })
  
  return new Response(await response.text(), {
    status: response.status,
    headers: { 'Content-Type': 'application/json' }
  })
})
```

## Verification

### Check CRON Status
```sql
-- In Supabase SQL Editor
SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 5;
```

### Monitor Logs
Check your deployment logs for:
- `Good Game API Configuration: { ... }`
- `Starting sync process...`
- `Synced X matches successfully`

### Admin Dashboard
Use the admin panel at `/admin` to:
- Manually trigger sync
- View sync statistics
- Monitor recent activity

## Rollback Plan

If you need to rollback:

```sql
-- Re-enable the old cron job
SELECT cron.schedule(
  'sync-matches',
  '0 */4 * * *',
  'SELECT sync_match_results();'
);
```

**Note**: The old system won't fetch real data, but it won't break anything.

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check `CRON_SECRET_KEY` environment variable
   - Ensure header format: `Authorization: Bearer YOUR_KEY`

2. **No matches synced**
   - Verify season exists in database: `SELECT * FROM seasons WHERE season_id = '13600'`
   - Check API token: `GOOD_GAME_LIGAEN_TOKEN`
   - Confirm environment variables match current season

3. **RLS Policy Errors**
   - Ensure using API endpoints, not direct database calls
   - Service role key should be set: `SUPABASE_SERVICE_ROLE_KEY`

### Support
If you encounter issues, check:
- Deployment logs
- Admin dashboard at `/admin`
- API response at `/api/cron/sync-matches` (with proper auth)

---

**Migration Benefits**:
- ✅ Real match data from all three games
- ✅ Automatic multi-season support
- ✅ Better error handling
- ✅ Consistent with admin functionality
- ✅ Future-proof for new games/seasons