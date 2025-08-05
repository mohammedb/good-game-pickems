-- Run this migration to enable shared predictions functionality

-- First ensure the update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create shared_predictions table to store prediction shares
CREATE TABLE IF NOT EXISTS public.shared_predictions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT,
    round TEXT NOT NULL,
    total_picks INTEGER NOT NULL DEFAULT 0,
    correct_picks INTEGER NOT NULL DEFAULT 0,
    predictions JSONB NOT NULL,
    game_type TEXT NOT NULL DEFAULT 'CS2',
    season_id UUID REFERENCES public.seasons(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + interval '30 days'),
    view_count INTEGER DEFAULT 0
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shared_predictions_user_id ON public.shared_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_predictions_created_at ON public.shared_predictions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shared_predictions_expires_at ON public.shared_predictions(expires_at);

-- Enable RLS
ALTER TABLE public.shared_predictions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view shared predictions" ON public.shared_predictions;
DROP POLICY IF EXISTS "Users can create their own shared predictions" ON public.shared_predictions;
DROP POLICY IF EXISTS "Users can update their own shared predictions" ON public.shared_predictions;
DROP POLICY IF EXISTS "Users can delete their own shared predictions" ON public.shared_predictions;

-- RLS Policies
-- Anyone can view shared predictions
CREATE POLICY "Anyone can view shared predictions"
    ON public.shared_predictions FOR SELECT
    USING (true);

-- Users can create their own shared predictions
CREATE POLICY "Users can create their own shared predictions"
    ON public.shared_predictions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own shared predictions
CREATE POLICY "Users can update their own shared predictions"
    ON public.shared_predictions FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own shared predictions
CREATE POLICY "Users can delete their own shared predictions"
    ON public.shared_predictions FOR DELETE
    USING (auth.uid() = user_id);

-- Add trigger to update the updated_at timestamp
DROP TRIGGER IF EXISTS update_shared_predictions_updated_at ON public.shared_predictions;
CREATE TRIGGER update_shared_predictions_updated_at
    BEFORE UPDATE ON public.shared_predictions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.shared_predictions IS 'Stores shared user predictions with unique IDs for easy sharing';
COMMENT ON COLUMN public.shared_predictions.predictions IS 'JSONB array of match predictions with team names, scores, picks, etc.';
COMMENT ON COLUMN public.shared_predictions.expires_at IS 'Shared predictions expire after 30 days to manage storage';

-- Grant necessary permissions
GRANT SELECT ON public.shared_predictions TO anon;
GRANT SELECT, INSERT ON public.shared_predictions TO authenticated;
GRANT UPDATE, DELETE ON public.shared_predictions TO authenticated;
