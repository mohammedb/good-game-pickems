-- Run all season-related migrations including management functions
-- Execute this file to apply all season functionality

-- 1. Create seasons table
\i create_seasons_table.sql

-- 2. Add season_id to matches
\i add_season_id_to_matches.sql

-- 3. Add season_id to picks  
\i add_season_id_to_picks.sql

-- 4. Update leaderboard function
\i update_leaderboard_function_with_season.sql

-- 5. Create season helper functions
\i create_get_seasons_function.sql

-- 6. Create season management functions
\i create_season_management_functions.sql

-- 7. Add season audit logging
\i add_season_audit_log.sql

-- Verify the migrations
SELECT 'Seasons table created' as status, count(*) as count FROM seasons;
SELECT 'Matches have season_id' as status, count(*) as count FROM matches WHERE season_id IS NOT NULL;
SELECT 'Picks have season_id' as status, count(*) as count FROM picks WHERE season_id IS NOT NULL;
SELECT 'Season audit log created' as status, EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'season_audit_log') as exists;

-- Show current season status
SELECT 'Current active season:' as info;
SELECT season_id, name, start_date FROM seasons WHERE is_active = true;