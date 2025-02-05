-- Enable the pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- Create the cron job to sync matches every 4 hours
SELECT cron.schedule(
  'sync-matches',           -- name of the cron job
  '0 */4 * * *',           -- run every 4 hours (at minute 0)
  'SELECT sync_match_results();'
); 