-- Run all streak-related migrations in order
-- This file consolidates all streak feature migrations

-- 1. Add streak fields to users table
\i add_streak_fields.sql

-- 2. Add streak update functions
\i add_streak_update_function.sql

-- 3. Add streak freeze functionality
\i add_streak_freeze_function.sql

-- 4. Add streak freeze reset cron job
\i add_streak_freeze_reset_cron.sql

-- 5. Add streak leaderboard functions
\i add_streak_leaderboard_function.sql

-- 6. Add streak achievements
\i add_streak_achievements.sql