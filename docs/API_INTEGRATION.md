# Good Game Ligaen API Integration Guide

## Overview

The Good Game Pickems platform integrates with the Good Game Ligaen API (now hosted at gamer.no) to automatically sync match data for CS:GO, League of Legends, and Valorant competitions.

## API Configuration

### Base URL
```
https://www.gamer.no/api/paradise
```

### Environment Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `GOOD_GAME_LIGAEN_TOKEN` | Bearer token for API authentication | `28\|abc123...` | ✅ |
| `GOOD_GAME_SEASON_ID` | Current active season ID | `13600` | ✅ |
| `GOOD_GAME_CS_DIVISION_ID` | CS:GO division ID | `18351` | ✅ |
| `GOOD_GAME_LOL_DIVISION_ID` | League of Legends division ID | `18353` | ✅ |
| `GOOD_GAME_VALORANT_DIVISION_ID` | Valorant division ID | `18355` | ✅ |

### Current Season Configuration (as of August 2025)

```bash
GOOD_GAME_SEASON_ID=13600           # LoL Season - Currently Active
GOOD_GAME_CS_DIVISION_ID=18351      # CS:GO Division
GOOD_GAME_LOL_DIVISION_ID=18353     # LoL Division - Currently Active
GOOD_GAME_VALORANT_DIVISION_ID=18355 # Valorant Division
```

## API Endpoints

### Match Fetching
```
GET /competition/{season_id}/matchups?status={status}&relation=all&division_id={division_id}&limit=100
```

**Parameters:**
- `season_id`: The competition season ID
- `status`: `finished` or `unfinished`
- `division_id`: Game-specific division ID
- `relation`: Set to `all` to include team details
- `limit`: Maximum matches to fetch (default: 100)

**Example:**
```
https://www.gamer.no/api/paradise/competition/13600/matchups?status=unfinished&relation=all&division_id=18353&limit=100
```

## Multi-Game Support

### How It Works

The sync system automatically fetches matches for all three supported games:

1. **CS:GO Matches** - Uses `GOOD_GAME_CS_DIVISION_ID` (18351)
2. **LoL Matches** - Uses `GOOD_GAME_LOL_DIVISION_ID` (18353) 
3. **Valorant Matches** - Uses `GOOD_GAME_VALORANT_DIVISION_ID` (18355)

### Game Type Detection

Each match is tagged with a `game_type` field:
- `'csgo'` - Counter-Strike 2
- `'lol'` - League of Legends  
- `'valorant'` - Valorant

### Seasonal Activation

Games are automatically included based on their season activity:

- **Currently Active**: LoL (season 13600 has matches)
- **Future**: CS:GO and Valorant will be included when their seasons become active
- **Inactive Seasons**: Return empty match arrays but don't break the sync

## Database Integration

### Required Database Setup

1. **Seasons Table**: Must contain the season record
```sql
INSERT INTO seasons (season_id, name, start_date, end_date, is_active) 
VALUES ('13600', 'LoL Høst 2025', '2025-08-01', '2025-12-31', true);
```

2. **Matches Table**: Stores synced match data with game_type support
3. **RLS Policies**: Admin operations use service role to bypass RLS

### Match Transformation

API response is transformed to internal format:

```typescript
{
  id: string,              // match.id.toString()
  team1: string,           // match.home_signup.team.name
  team2: string,           // match.away_signup.team.name
  team1_id: string,        // match.home_signup.team.id.toString()
  team2_id: string,        // match.away_signup.team.id.toString()
  team1_logo?: string,     // match.home_signup.team.logo?.url
  team2_logo?: string,     // match.away_signup.team.logo?.url
  start_time: string,      // match.start_time
  division_id: string,     // Based on game_type
  season_id: string,       // From environment or parameter
  game_type: GameType,     // 'csgo' | 'lol' | 'valorant'
  is_finished: boolean,    // !!match.finished_at
  winner_id: string | null, // Based on winning_side
  team1_map_score?: number, // match.home_score
  team2_map_score?: number, // match.away_score
  best_of: number,         // match.best_of || 3
  round: string,           // match.round_identifier_text
  stream_link?: string     // Twitch URL if available
}
```

## Admin Operations

### Manual Sync
- **Endpoint**: `POST /api/admin/sync`
- **Authentication**: Admin user required
- **Functionality**: Fetches and syncs matches for all game types
- **RLS**: Uses service role client to bypass restrictions

### Update Points
- **Endpoint**: `POST /api/admin/update-points`
- **Authentication**: Admin user required
- **Functionality**: Calculates and updates points for finished matches
- **RLS**: Uses service role client to bypass restrictions

## Future Season Updates

### When New Seasons Start

1. **Update Environment Variables**
   ```bash
   # Update season ID for the new season
   GOOD_GAME_SEASON_ID=13700  # Example new season
   
   # Update division IDs if they change
   GOOD_GAME_CS_DIVISION_ID=18400    # Example new CS division
   GOOD_GAME_LOL_DIVISION_ID=18401   # Example new LoL division  
   GOOD_GAME_VALORANT_DIVISION_ID=18402 # Example new Valorant division
   ```

2. **Add New Season to Database**
   ```sql
   INSERT INTO seasons (season_id, name, start_date, end_date, is_active) 
   VALUES ('13700', 'Spring 2026', '2026-01-01', '2026-06-30', true);
   ```

3. **Test Sync**
   - Run admin sync to verify matches are fetched
   - Check all three game types are working

### Finding New Season/Division IDs

1. **Monitor Good Game Ligaen Website**
   - Check https://www.gamer.no for new tournaments
   - Look for new season announcements

2. **API Exploration**
   ```bash
   # Test new competition IDs
   curl -H "Authorization: Bearer $TOKEN" \
     "https://www.gamer.no/api/paradise/competition/{NEW_SEASON_ID}/matchups"
   ```

3. **URL Pattern Analysis**
   - CS:GO: `https://www.gamer.no/turneringer/good-game-ligaen-counter-strike-{season}/`
   - LoL: `https://www.gamer.no/turneringer/good-game-ligaen-league-of-legends-{season}/`
   - Valorant: `https://www.gamer.no/turneringer/good-game-ligaen-valorant-{season}/`

## Troubleshooting

### Common Issues

1. **No Matches Fetched**
   - Check if season exists in database
   - Verify environment variables are correct
   - Confirm API token is valid
   - Check if season/division is active

2. **RLS Errors**
   - Ensure admin operations use `createServiceRoleClient()`
   - Verify service role key is configured

3. **Foreign Key Constraints**
   - Add missing season to `seasons` table
   - Ensure season_id matches environment variable

### Debugging Commands

```bash
# Test API directly
curl -H "Authorization: Bearer $GOOD_GAME_LIGAEN_TOKEN" \
  "https://www.gamer.no/api/paradise/competition/$GOOD_GAME_SEASON_ID/matchups?status=unfinished&relation=all&division_id=$GOOD_GAME_LOL_DIVISION_ID&limit=5"

# Check seasons in database
curl -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/seasons?select=*"
```

### Logs to Monitor

- API fetch responses (check for empty data arrays)
- Match transformation errors
- Database insertion errors
- RLS policy violations

## CRON Jobs and Automation

### API-based CRON Job (Active)
- **Endpoint**: `POST /api/cron/sync-matches`
- **Authentication**: Uses `CRON_SECRET_KEY` environment variable
- **Functionality**: Calls the same `syncMatches()` function as admin sync
- **Games**: Automatically syncs all three games (`['csgo', 'lol', 'valorant']`)
- **Status**: ✅ **Updated to use service role client**

### Database CRON Job (Legacy - Should be Disabled)
- **Location**: `supabase/functions/sync-matches/cron.sql`
- **Function**: `sync_match_results()` (placeholder implementation)
- **Schedule**: Every 4 hours (`0 */4 * * *`)
- **Status**: ⚠️ **SHOULD BE DISABLED - doesn't use new API structure**

**To disable the legacy cron job**, run this SQL in your Supabase SQL editor:
```sql
-- Remove the legacy cron job
SELECT cron.unschedule('sync-matches');

-- Mark function as deprecated
COMMENT ON FUNCTION sync_match_results() IS 'DEPRECATED: Use /api/cron/sync-matches endpoint instead.';
```

### Challenge Processing CRON
- **Endpoint**: `GET /api/cron/process-challenges`
- **Authentication**: Uses `CRON_SECRET` environment variable  
- **Functionality**: Auto-declines expired challenges and calculates results
- **Status**: ✅ **Already uses service role client**

### CRON Configuration Requirements

**For Vercel deployment**, you need to configure CRON jobs in your platform:

1. **Match Sync CRON**:
   ```
   POST https://your-domain.com/api/cron/sync-matches
   Headers: Authorization: Bearer YOUR_CRON_SECRET_KEY
   Schedule: Every 30 minutes during active seasons
   ```

2. **Challenge Processing CRON**:
   ```
   GET https://your-domain.com/api/cron/process-challenges
   Headers: Authorization: Bearer YOUR_CRON_SECRET
   Schedule: Every hour
   ```

### Environment Variables for CRON
```bash
CRON_SECRET_KEY=your_secure_random_key_for_match_sync
CRON_SECRET=your_secure_random_key_for_challenges
```

**Note**: The API-based CRON jobs are now the recommended approach as they:
- ✅ Use the updated API integration
- ✅ Support multi-game fetching
- ✅ Use service role client (bypass RLS)
- ✅ Have proper error handling and logging

## Code Locations

- **API Integration**: `src/utils/goodgame.ts`
- **Admin Sync**: `src/app/api/admin/sync/route.ts`
- **Update Points**: `src/app/api/admin/update-points/route.ts`
- **CRON Jobs**: `src/app/api/cron/sync-matches/route.ts`, `src/app/api/cron/process-challenges/route.ts`
- **Environment Config**: `.env.local` and `.env.example`
- **Types**: `src/app/matches/types.ts`
- **Legacy DB Functions**: `src/db/functions/sync_match_results.sql` (deprecated)

## Future Enhancements

### Potential Improvements

1. **Automatic Season Detection**
   - API endpoint to detect active seasons
   - Automatic environment variable updates

2. **Real-time Updates**
   - Webhook integration for live match updates
   - WebSocket for real-time score updates

3. **Enhanced Game Support**
   - PUBG: Battlegrounds integration when available
   - Rocket League if added to Good Game Ligaen

4. **Smart Sync Scheduling**
   - Different sync frequencies per game
   - Match-day vs off-season sync rates

5. **Advanced Match Data**
   - Player statistics integration
   - Map/round details for supported games
   - Stream viewer counts

---

**Last Updated**: August 2025  
**API Version**: Paradise API (gamer.no)  
**Active Games**: League of Legends (Primary), CS:GO, Valorant (Future)