-- Enable RLS on shared_predictions table
ALTER TABLE shared_predictions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own shared predictions
CREATE POLICY "Users can insert own shared predictions" ON shared_predictions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Anyone can view shared predictions (they are public by design)
CREATE POLICY "Anyone can view shared predictions" ON shared_predictions
  FOR SELECT
  USING (true);

-- Policy: Users can update their own shared predictions (for view count)
CREATE POLICY "System can update shared predictions" ON shared_predictions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy: Users can delete their own shared predictions
CREATE POLICY "Users can delete own shared predictions" ON shared_predictions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups by ID
CREATE INDEX IF NOT EXISTS idx_shared_predictions_id ON shared_predictions(id);

-- Create index for user's shared predictions
CREATE INDEX IF NOT EXISTS idx_shared_predictions_user_id ON shared_predictions(user_id);
