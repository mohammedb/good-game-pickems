-- Remove is_synced column if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'matches' 
        AND column_name = 'is_synced'
    ) THEN
        ALTER TABLE matches DROP COLUMN is_synced;
    END IF;
END $$; 