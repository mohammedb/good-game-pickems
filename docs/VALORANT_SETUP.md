# Valorant Support Setup

This guide explains how to configure Valorant support for Good Game Pickems.

## Environment Variable

Add the following environment variable to your `.env.local` file:

```
GOOD_GAME_VALORANT_DIVISION_ID=13601
```

This ID corresponds to the Valorant division in the Good Game Ligaen API. The default value is `13601`, but you can update it if the division ID changes.

## Database Migration

Run the Valorant support migration to update the database:

```sql
-- Run this migration to add Valorant support
-- File: src/db/migrations/add_valorant_support.sql
```

This migration:
- Updates the game_type CHECK constraint to include 'valorant'
- Adds necessary indexes for Valorant matches

## Testing

To test Valorant support:

1. Run the test matches insertion script to add sample Valorant matches:
   ```sql
   -- Run: src/db/migrations/insert_test_matches.sql
   ```

2. The platform will now display:
   - Valorant option in the game type selector
   - Valorant matches in the matches list
   - Ability to make predictions on Valorant matches

## Features

With Valorant support enabled, users can:
- Filter matches by Valorant game type
- View Valorant team logos and match details
- Make predictions on Valorant matches
- Earn points for correct Valorant predictions
- See Valorant-specific match data (maps, rounds, etc.)

## API Integration

The platform will automatically sync Valorant matches from the Good Game Ligaen API during the regular sync process. The sync includes:
- Match details (teams, logos, start times)
- Match results and scores
- Map information for completed matches
