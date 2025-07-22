-- Update the sync-matches cron job to run weekly (every Sunday at 2 AM)
-- First, unschedule any existing sync-matches job
DO $$
BEGIN
  -- Check if the job exists before trying to unschedule
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-matches') THEN
    PERFORM cron.unschedule('sync-matches');
    RAISE NOTICE 'Unscheduled existing sync-matches job';
  END IF;
  
  -- Also unschedule weekly-points-update if it exists
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'weekly-points-update') THEN
    PERFORM cron.unschedule('weekly-points-update');
    RAISE NOTICE 'Unscheduled existing weekly-points-update job';
  END IF;
END $$;

-- Create new weekly sync job
DO $$
DECLARE
  sync_job_id bigint;
  points_job_id bigint;
BEGIN
  -- Schedule the sync job
  sync_job_id := cron.schedule(
    'sync-matches',           -- name of the cron job
    '0 2 * * 0',             -- run every Sunday at 2:00 AM
    'SELECT sync_match_results();'
  );
  RAISE NOTICE 'Created sync-matches job with ID: %', sync_job_id;

  -- Schedule the points update job
  points_job_id := cron.schedule(
    'weekly-points-update',   -- name of the cron job
    '0 3 * * 0',             -- run every Sunday at 3:00 AM (1 hour after sync)
    'SELECT update_user_total_points();'
  );
  RAISE NOTICE 'Created weekly-points-update job with ID: %', points_job_id;
END $$;

-- Verify the scheduled jobs
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job 
WHERE jobname IN ('sync-matches', 'weekly-points-update')
ORDER BY jobid;