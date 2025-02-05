-- Add unique constraint on gg_ligaen_api_id
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS gg_ligaen_api_id TEXT;

-- Add unique constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'matches_gg_ligaen_api_id_key'
    ) THEN
        ALTER TABLE matches
        ADD CONSTRAINT matches_gg_ligaen_api_id_key UNIQUE (gg_ligaen_api_id);
    END IF;
END $$; 