-- Function to update points for a completed match
CREATE OR REPLACE FUNCTION update_match_points(match_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  match_winner text;
  match_record record;
  pick record;
  pick_count integer;
BEGIN
  -- Get match details first
  SELECT * INTO match_record
  FROM matches
  WHERE id = match_id_param;

  -- Validate match data
  IF match_record.team1_map_score IS NULL OR match_record.team2_map_score IS NULL THEN
    RAISE NOTICE 'Cannot process points: Map scores are not set for match % vs % (ID: %)',
      match_record.team1, match_record.team2, match_id_param;
    RETURN;
  END IF;

  -- Log match details
  RAISE NOTICE 'Processing match: % vs % (ID: %)', 
    match_record.team1, match_record.team2, match_id_param;
  RAISE NOTICE 'Map scores: % - %', 
    match_record.team1_map_score, match_record.team2_map_score;

  -- Count picks for this match
  SELECT COUNT(*) INTO pick_count FROM picks WHERE match_id = match_id_param;
  RAISE NOTICE 'Found % picks for match %', pick_count, match_id_param;

  -- Determine the winning team name
  IF match_record.winner_id = match_record.team1_id THEN
    match_winner := match_record.team1;
    RAISE NOTICE 'Winner is team1: %', match_winner;
  ELSIF match_record.winner_id = match_record.team2_id THEN
    match_winner := match_record.team2;
    RAISE NOTICE 'Winner is team2: %', match_winner;
  ELSE
    RAISE NOTICE 'No winner determined. winner_id: %, team1_id: %, team2_id: %',
      match_record.winner_id, match_record.team1_id, match_record.team2_id;
    RETURN;
  END IF;

  -- Log picks before update
  RAISE NOTICE 'Picks before update:';
  FOR pick IN (SELECT * FROM picks WHERE match_id = match_id_param) LOOP
    RAISE NOTICE 'Pick ID: %, User: %, Predicted winner: %, Maps: % - %, Current points: % + %',
      pick.id, pick.user_id, pick.predicted_winner, 
      pick.predicted_team1_maps, pick.predicted_team2_maps,
      pick.points_awarded, pick.map_score_points;
  END LOOP;

  -- Update points for all picks for this match
  WITH updated_picks AS (
    UPDATE picks
    SET 
      is_correct = (predicted_winner = match_winner),
      map_score_correct = (
        predicted_team1_maps = match_record.team1_map_score AND
        predicted_team2_maps = match_record.team2_map_score
      ),
      -- Winner points only (2 points)
      points_awarded = 
        CASE 
          WHEN predicted_winner = match_winner THEN 2
          ELSE 0
        END,
      -- Map score points only (1 point)
      map_score_points = 
        CASE 
          WHEN 
            predicted_team1_maps = match_record.team1_map_score AND
            predicted_team2_maps = match_record.team2_map_score
          THEN 1
          ELSE 0
        END
    WHERE match_id = match_id_param
    RETURNING *
  )
  SELECT COUNT(*) INTO pick_count FROM updated_picks;
  
  RAISE NOTICE 'Updated % picks', pick_count;

  -- Log picks after update
  RAISE NOTICE 'Picks after update:';
  FOR pick IN (SELECT * FROM picks WHERE match_id = match_id_param) LOOP
    RAISE NOTICE 'Pick ID: %, User: %, Winner correct: %, Map score correct: %, Points: % + %',
      pick.id, pick.user_id, pick.is_correct, pick.map_score_correct, 
      pick.points_awarded, pick.map_score_points;
  END LOOP;

  -- Update the match to mark points as processed only if we got here
  UPDATE matches
  SET points_processed = true
  WHERE id = match_id_param;

  -- Call update_user_total_points to refresh user points
  PERFORM update_user_total_points();
END;
$$; 