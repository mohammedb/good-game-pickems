-- Function to update total points for all users
CREATE OR REPLACE FUNCTION update_user_total_points()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the total_points column in the users table
  UPDATE users
  SET total_points = (
    SELECT COALESCE(SUM(points_awarded), 0)
    FROM picks
    WHERE picks.user_id = users.id
    AND points_awarded IS NOT NULL
  );

  -- Update the rank column based on total points
  UPDATE users
  SET rank = ranks.rank
  FROM (
    SELECT 
      id,
      RANK() OVER (ORDER BY total_points DESC) as rank
    FROM users
  ) ranks
  WHERE users.id = ranks.id;
END;
$$; 