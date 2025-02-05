-- Add has_completed_onboarding column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT false;

-- Update existing users to have completed onboarding
UPDATE users
SET has_completed_onboarding = true
WHERE has_completed_onboarding IS NULL; 