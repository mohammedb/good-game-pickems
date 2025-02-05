-- Function to sync match results and update points
CREATE OR REPLACE FUNCTION sync_match_results()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    _match record;
    _api_response jsonb;
    _updated_count integer := 0;
BEGIN
    -- Get matches that finished in the last 24 hours and haven't been processed
    FOR _match IN 
        SELECT id, gg_ligaen_api_id
        FROM matches
        WHERE is_finished = false
        AND start_time < NOW() - INTERVAL '4 hours'
        AND start_time > NOW() - INTERVAL '24 hours'
    LOOP
        -- Make HTTP request to Good Game API (this is a placeholder - actual implementation will be in Edge Function)
        -- This part will be implemented in a Supabase Edge Function
        -- The function will:
        -- 1. Fetch match result from Good Game API
        -- 2. Update match with results
        -- 3. Call update_match_points for the match
        
        _updated_count := _updated_count + 1;
    END LOOP;

    -- Log the sync
    IF _updated_count > 0 THEN
        INSERT INTO sync_logs (matches_synced)
        VALUES (_updated_count);
    END IF;
END;
$$; 