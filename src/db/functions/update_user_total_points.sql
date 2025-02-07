-- Function to update total points for all users
CREATE OR REPLACE FUNCTION update_user_total_points()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First update total points for each user
  WITH user_points AS (
    SELECT 
      user_id,
      COALESCE(SUM(points_awarded), 0) + COALESCE(SUM(map_score_points), 0) as calculated_points
    FROM picks
    GROUP BY user_id
  )
  UPDATE users u
  SET total_points = up.calculated_points
  FROM user_points up
  WHERE u.id = up.user_id;

  -- Then update ranks based on total points
  WITH user_ranks AS (
    SELECT 
      id,
      RANK() OVER (ORDER BY total_points DESC) as calculated_rank
    FROM users
  )
  UPDATE users u
  SET rank = ur.calculated_rank
  FROM user_ranks ur
  WHERE u.id = ur.id;
END;
$$; 