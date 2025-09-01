-- Disable legacy sync_match_results cron job
-- This removes the old database-based cron job that used the deprecated API structure
-- We now use API-based cron jobs at /api/cron/sync-matches instead

-- Remove the existing cron job
SELECT cron.unschedule('sync-matches');

-- Optional: Keep the function but add a warning comment
COMMENT ON FUNCTION sync_match_results() IS 'DEPRECATED: This function is no longer used. Use /api/cron/sync-matches endpoint instead.';

-- Log the migration
INSERT INTO sync_logs (matches_synced, created_at) 
VALUES (0, NOW());