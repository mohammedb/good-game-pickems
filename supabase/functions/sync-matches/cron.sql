-- Create a cron job to sync matches every hour
SELECT cron.schedule(
  'sync-matches', -- name of the cron job
  '0 * * * *',   -- run every hour at minute 0
  $$
  SELECT sync_match_results();
  $$
); 