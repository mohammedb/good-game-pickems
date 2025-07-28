# Good Game Pickems - Phase 1 Features PRD

## Overview
This document outlines the Phase 1 feature enhancements for Good Game Pickems platform. These features focus on expanding game support, enhancing user engagement through achievements and streaks, and introducing competitive social elements.

## Phase 1 Features

### 1. League of Legends Support

#### 1.1 Overview
Expand the platform to support League of Legends matches from Good Game Ligaen, allowing users to make predictions across multiple esports titles.

#### 1.2 Requirements

##### 1.2.1 Data Integration
- **API Integration**
  - Fetch LoL matches from Good Game Ligaen API
  - Map LoL-specific data fields (champions, objectives, etc.)
  - Handle different match formats (BO1, BO3, BO5)
  
- **Database Schema Updates**
  ```sql
  -- Add game_type to matches table
  ALTER TABLE matches ADD COLUMN game_type text DEFAULT 'csgo';
  
  -- Add LoL-specific fields
  ALTER TABLE matches ADD COLUMN game_data jsonb;
  
  -- Update picks table for game-specific predictions
  ALTER TABLE picks ADD COLUMN prediction_type text DEFAULT 'match_winner';
  ALTER TABLE picks ADD COLUMN prediction_data jsonb;
  ```

##### 1.2.2 UI/UX Requirements
- **Game Toggle**
  - Add game selector in navigation (CS2 | LoL | All)
  - Filter matches by game type
  - Visual distinction between game types (colors, icons)
  
- **Match Cards**
  - Display LoL team logos and names
  - Show LoL-specific information (patch version, tournament stage)
  - Maintain consistent card design across games

##### 1.2.3 Points System
- Same base points for correct match winner predictions
- Future: Game-specific bonus predictions (Phase 2)

#### 1.3 Technical Implementation
```typescript
// Update goodgame.ts
export async function fetchGoodGameMatches(
  seasonId?: string,
  gameType: 'csgo' | 'lol' = 'csgo'
): Promise<GoodGameMatch[]> {
  const divisionId = gameType === 'lol' ? 'LOL_DIVISION_ID' : '12517';
  // Implementation details...
}
```

#### 1.4 Success Criteria
- Successfully sync and display LoL matches
- Users can make predictions on LoL matches
- Points are correctly calculated for LoL predictions
- Leaderboards show combined rankings

### 2. User Achievements & Badges System

#### 2.1 Overview
Implement a comprehensive achievement system that rewards users for various activities and milestones, increasing engagement and retention.

#### 2.2 Requirements

##### 2.2.1 Achievement Categories
1. **Prediction Achievements**
   - First Correct Prediction
   - 10/25/50/100 Correct Predictions
   - Perfect Round (all predictions correct)
   - Perfect Week/Month
   
2. **Streak Achievements**
   - 3/5/10/20 Prediction Streak
   - Comeback Kid (correct after 5 wrong)
   
3. **Participation Achievements**
   - Early Bird (first 10 to predict)
   - Dedicated Fan (predictions in 10/25/50 rounds)
   - Multi-Game Master (predictions in both CS2 and LoL)
   
4. **Social Achievements**
   - Social Butterfly (shared 10 times)
   - Trendsetter (prediction shared got 50+ views)

##### 2.2.2 Database Schema
```sql
-- Achievements definition table
CREATE TABLE achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  icon_url text,
  points_value integer DEFAULT 0,
  requirement_type text NOT NULL, -- 'count', 'streak', 'special'
  requirement_value integer,
  game_type text, -- null for cross-game achievements
  created_at timestamp with time zone DEFAULT now()
);

-- User achievements tracking
CREATE TABLE user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  achievement_id uuid REFERENCES achievements(id),
  unlocked_at timestamp with time zone DEFAULT now(),
  progress integer DEFAULT 0,
  UNIQUE(user_id, achievement_id)
);
```

##### 2.2.3 UI Components
- **Achievement Badge Component**
  ```tsx
  interface AchievementBadgeProps {
    achievement: Achievement;
    unlocked: boolean;
    progress?: number;
    size?: 'sm' | 'md' | 'lg';
  }
  ```
  
- **Achievement Showcase**
  - Profile page section showing unlocked achievements
  - Progress bars for in-progress achievements
  - Rarity indicators (Common, Rare, Epic, Legendary)
  
- **Achievement Notifications**
  - Toast notification on unlock
  - Confetti animation for rare achievements
  - Share achievement option

##### 2.2.4 Achievement Engine
```typescript
// Achievement checking service
interface AchievementChecker {
  checkOnPrediction(userId: string, pick: Pick): Achievement[];
  checkOnMatchComplete(userId: string, match: Match): Achievement[];
  checkDaily(userId: string): Achievement[];
}
```

#### 2.3 Success Criteria
- Users can view all available achievements
- Achievements unlock automatically when conditions are met
- Achievement progress is tracked and displayed
- Users receive notifications for new achievements

### 3. Prediction Streaks

#### 3.1 Overview
Track and reward consecutive correct predictions to encourage consistent participation and accuracy.

#### 3.2 Requirements

##### 3.2.1 Streak Tracking
- **Current Streak**: Number of consecutive correct predictions
- **Best Streak**: User's all-time highest streak
- **Streak Freeze**: Protect streak if user misses a round (1 per week)

##### 3.2.2 Database Updates
```sql
-- Add to users table
ALTER TABLE users ADD COLUMN current_streak integer DEFAULT 0;
ALTER TABLE users ADD COLUMN best_streak integer DEFAULT 0;
ALTER TABLE users ADD COLUMN streak_freezes integer DEFAULT 1;
ALTER TABLE users ADD COLUMN last_streak_update timestamp with time zone;
```

##### 3.2.3 Streak Multipliers
- 3+ streak: 1.1x points
- 5+ streak: 1.2x points
- 10+ streak: 1.5x points
- 20+ streak: 2x points

##### 3.2.4 UI Elements
- **Streak Display**
  - Fire icon with number
  - Visual intensity based on streak length
  - Streak protection indicator
  
- **Streak Leaderboard**
  - Current streaks ranking
  - All-time best streaks

#### 3.3 Technical Implementation
```typescript
// Streak calculation function
export async function updateUserStreak(
  userId: string,
  isCorrect: boolean,
  supabase: SupabaseClient
) {
  // Get current user data
  // Update streak based on prediction result
  // Apply multipliers if applicable
  // Check for streak achievements
}
```

#### 3.4 Success Criteria
- Streaks are accurately tracked across predictions
- Multipliers are applied correctly to points
- Streak freezes work as intended
- Streak leaderboard updates in real-time

### 4. Head-to-Head Challenges

#### 4.1 Overview
Allow users to create direct prediction challenges with friends or other users, adding a competitive social element.

#### 4.2 Requirements

##### 4.2.1 Challenge Types
1. **Single Match Challenge**: Predict one specific match
2. **Round Challenge**: Predict all matches in a round
3. **Custom Challenge**: Select specific matches

##### 4.2.2 Database Schema
```sql
-- Challenges table
CREATE TABLE challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id uuid REFERENCES users(id),
  challenged_id uuid REFERENCES users(id),
  challenge_type text NOT NULL,
  status text DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'completed'
  winner_id uuid REFERENCES users(id),
  stake_points integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  accepted_at timestamp with time zone,
  completed_at timestamp with time zone
);

-- Challenge matches
CREATE TABLE challenge_matches (
  challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE,
  match_id uuid REFERENCES matches(id),
  PRIMARY KEY (challenge_id, match_id)
);

-- Challenge picks
CREATE TABLE challenge_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  match_id uuid REFERENCES matches(id),
  predicted_winner text NOT NULL,
  is_correct boolean,
  created_at timestamp with time zone DEFAULT now()
);
```

##### 4.2.3 Challenge Flow
1. **Create Challenge**
   - Select opponent (username search)
   - Choose challenge type
   - Set stake (optional)
   - Add message (optional)

2. **Accept/Decline**
   - Notification to challenged user
   - 48-hour response window
   - Auto-decline if no response

3. **Make Predictions**
   - Both users make predictions
   - Deadline same as match start
   - Show opponent's pick after deadline

4. **Results**
   - Calculate winner based on correct predictions
   - Award stake points if applicable
   - Update challenge stats

##### 4.2.4 UI Components
- **Challenge Card**
  ```tsx
  interface ChallengeCardProps {
    challenge: Challenge;
    onAccept: () => void;
    onDecline: () => void;
    showPicks: boolean;
  }
  ```

- **Challenge Creation Modal**
- **Active Challenges List**
- **Challenge History**
- **Challenge Stats (W/L record)**

#### 4.3 Notifications
- New challenge received
- Challenge accepted/declined
- Reminder to make picks
- Challenge completed with results

#### 4.4 Success Criteria
- Users can create and send challenges
- Challenge flow works end-to-end
- Points/stakes are transferred correctly
- Challenge history is maintained

## Implementation Guidelines

### For Subagents

Each feature should be implemented as follows:

1. **Database First**
   - Create migration files in `src/db/migrations/`
   - Update TypeScript types
   - Test migrations locally

2. **API Routes**
   - Create feature-specific API routes
   - Implement proper error handling
   - Add rate limiting where appropriate

3. **UI Components**
   - Follow existing component patterns
   - Use shadcn/ui components
   - Add MagicUI animations for special moments

4. **Testing**
   - Write unit tests for critical functions
   - Test edge cases
   - Verify RLS policies

5. **Documentation**
   - Update CLAUDE.md with new commands
   - Add feature-specific documentation
   - Include example usage

### Priority Order

1. League of Legends Support (Foundation for multi-game)
2. Achievements & Badges (Engagement driver)
3. Prediction Streaks (Retention mechanism)
4. Head-to-Head Challenges (Social element)

### Success Metrics

- **User Engagement**: 25% increase in daily active users
- **Retention**: 40% of users maintain 3+ day streaks
- **Social**: 20% of users participate in challenges
- **Multi-game**: 30% of users make predictions in both games

## Security Considerations

- All new features must respect existing RLS policies
- Challenge stakes cannot exceed user's available points
- Rate limit challenge creation (5 per day)
- Validate all user inputs
- Audit log for point transfers

## Future Considerations (Phase 2)

- Tournament mode for challenges
- Team challenges (2v2, 3v3)
- Seasonal achievement reset
- Achievement trading/marketplace
- Custom achievement creation for groups