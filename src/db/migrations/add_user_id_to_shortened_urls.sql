-- Add user_id column to shortened_urls table
ALTER TABLE public.shortened_urls
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS shortened_urls_user_id_idx ON public.shortened_urls (user_id);

-- Update RLS policies to include user_id checks
DROP POLICY IF EXISTS "Allow public access" ON public.shortened_urls;

-- Allow anyone to read URLs
CREATE POLICY "Allow public read access"
  ON public.shortened_urls
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to create their own URLs
CREATE POLICY "Allow authenticated create own URLs"
  ON public.shortened_urls
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update/delete their own URLs
CREATE POLICY "Allow users to manage own URLs"
  ON public.shortened_urls
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id); 