-- Add unique constraint to username if it doesn't exist
DO $$ 
BEGIN
    -- First update any NULL usernames with a default value
    UPDATE users 
    SET username = 'user_' || substr(id::text, 1, 8)
    WHERE username IS NULL;

    -- Then make username NOT NULL if it isn't already
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'username' 
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE users ALTER COLUMN username SET NOT NULL;
    END IF;

    -- Then add unique constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'users_username_key'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);
    END IF;
END $$; 