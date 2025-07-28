export interface Achievement {
  id: string
  code: string
  name: string
  title: string
  description: string
  icon: string
  icon_url?: string | null
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  points: number
  category: 'prediction' | 'streak' | 'participation' | 'social'
  requirement_type: 'count' | 'streak' | 'special'
  requirement_value?: number | null
  game_type?: string | null
  criteria: {
    type: string
    value?: number
    period?: string
  }
  created_at: string
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  unlocked_at: string
  progress: number
}

export interface AchievementProgress {
  id: string
  user_id: string
  achievement_id: string
  progress_value: number
  last_updated: string
}

export interface UserStats {
  user_id: string
  total_predictions: number
  correct_predictions: number
  current_streak: number
  longest_streak: number
  total_points: number
  map_score_points: number
  last_prediction_date: string | null
  updated_at: string
}

export interface AchievementUnlock {
  achievement: Achievement
  isNew: boolean
  progress?: number
}

export interface AchievementCheckResult {
  unlocked: AchievementUnlock[]
  progress: { achievement: Achievement; progress: number }[]
}

export type AchievementTrigger =
  | 'prediction_made'
  | 'match_completed'
  | 'daily_check'
  | 'social_share'
  | 'profile_view'
