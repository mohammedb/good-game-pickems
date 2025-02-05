-- Function to remove unlocked picks
CREATE OR REPLACE FUNCTION remove_unlocked_picks(user_id_param UUID, cutoff_time TIMESTAMPTZ)
RETURNS TABLE (
  id UUID,
  match_id UUID,
  predicted_winner TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete and return the deleted picks
  RETURN QUERY
  DELETE FROM picks p
  USING matches m
  WHERE p.match_id = m.id
  AND p.user_id = user_id_param
  AND m.start_time > cutoff_time
  RETURNING p.id, p.match_id, p.predicted_winner;
END;
$$; 