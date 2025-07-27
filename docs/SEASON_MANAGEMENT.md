# Season Management System

This document describes the season management functionality added to the admin dashboard.

## Overview

The season management system allows administrators to:
- Create new seasons for Good Game Ligaen competitions
- Activate/deactivate seasons
- Track statistics per season
- Maintain separate leaderboards for each season

## Database Schema

### Tables Added/Modified

1. **seasons** (new table)
   - `id`: UUID primary key
   - `season_id`: Text unique identifier (Good Game Ligaen ID)
   - `name`: Display name (e.g., "Spring 2024")
   - `start_date`: Timestamp with timezone
   - `end_date`: Timestamp with timezone (nullable)
   - `is_active`: Boolean flag for current season
   - `created_at`: Timestamp
   - `updated_at`: Timestamp

2. **matches** (modified)
   - Added `season_id` column (foreign key to seasons)
   - All existing matches assigned to season '13162'

3. **picks** (modified)
   - Added `season_id` column (foreign key to seasons)
   - Automatically populated from associated match
   - Trigger ensures consistency

4. **season_audit_log** (new table)
   - Tracks all season management actions
   - Records who performed actions and when

### Database Functions

- `create_season()`: Create new season with validation
- `activate_season()`: Activate a season (deactivates others)
- `end_season()`: End a season with specific date
- `can_delete_season()`: Check if season can be deleted
- `get_season_stats()`: Get detailed statistics per season
- `get_seasons()`: List all seasons with counts
- `get_current_season()`: Get the active season
- `log_season_action()`: Audit logging

## API Endpoints

### Season Management
- `GET /api/admin/seasons` - List all seasons with statistics
- `POST /api/admin/seasons` - Create a new season
- `PATCH /api/admin/seasons/[id]` - Update season details
- `DELETE /api/admin/seasons/[id]` - Delete a season (if no data)
- `POST /api/admin/seasons/[id]/activate` - Activate a season
- `PUT /api/admin/seasons/[id]/activate` - End a season

All endpoints require admin authentication.

## UI Components

### Admin Dashboard Components

1. **SeasonManagementCard**
   - Main dashboard card showing current season
   - Lists all seasons with statistics
   - Quick access to season actions

2. **CreateSeasonDialog**
   - Form for creating new seasons
   - Validation and immediate activation option
   - Warnings about impact on active seasons

3. **SeasonList**
   - Displays seasons grouped by status
   - Shows key metrics per season
   - Visual indicators for season state

4. **SeasonActions**
   - Dropdown menu for season operations
   - Confirmation dialogs for destructive actions
   - Real-time status updates

### Leaderboard Updates

The leaderboard page now includes:
- Season selector dropdown
- Filters results by selected season
- Defaults to current active season
- Preserves historical data per season

## Migration Instructions

### Running Migrations

Execute migrations in order:

```bash
psql -d your_database -f src/db/migrations/create_seasons_table.sql
psql -d your_database -f src/db/migrations/add_season_id_to_matches.sql
psql -d your_database -f src/db/migrations/add_season_id_to_picks.sql
psql -d your_database -f src/db/migrations/update_leaderboard_function_with_season.sql
psql -d your_database -f src/db/migrations/create_get_seasons_function.sql
psql -d your_database -f src/db/migrations/create_season_management_functions.sql
psql -d your_database -f src/db/migrations/add_season_audit_log.sql
```

Or use the combined script:
```bash
psql -d your_database -f src/db/migrations/run_all_season_migrations.sql
```

### Environment Variables

Optional: Set default season ID
```env
GOOD_GAME_SEASON_ID=13162  # Override default season
```

## Usage Guide

### Creating a New Season

1. Navigate to Admin Dashboard
2. Find "Season Management" section
3. Click "New Season"
4. Enter:
   - Season ID (from Good Game Ligaen)
   - Name (e.g., "Fall 2024")
   - Start date
   - Optional end date
5. Choose whether to activate immediately
6. Click "Create Season"

### Activating a Season

1. Find the season in the list
2. Click the menu (⋮) button
3. Select "Activate Season"
4. Confirm the action

**Note**: Activating a season will:
- Deactivate the current active season
- Make this the default for new matches
- Change the main leaderboard view

### Ending a Season

1. For the active season, click menu
2. Select "End Season"
3. Confirm to mark as completed

This will:
- Set an end date
- Deactivate the season
- Require activating another season

### Viewing Season Data

- **Admin Dashboard**: See all seasons with statistics
- **Leaderboard**: Use season selector to view any season
- **Activity Logs**: Track all season changes

## Security & Safety

- Only admins can manage seasons
- Cannot delete seasons with existing data
- All actions logged with user and timestamp
- Confirmation required for destructive actions
- RLS policies enforce access control

## Technical Notes

### Season Assignment

- Matches synced via API automatically use active season
- Picks inherit season from their match
- Database trigger ensures consistency

### Performance

- Indexes on season_id for fast queries
- Composite indexes for leaderboard queries
- Season statistics cached in get_season_stats()

### Backwards Compatibility

- All existing data assigned to season '13162'
- Leaderboard functions accept null season (uses current)
- API maintains same response format