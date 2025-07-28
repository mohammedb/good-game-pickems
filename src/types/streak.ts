export interface UserStreak {
  currentStreak: number
  bestStreak: number
  streakFreezes: number
  lastStreakUpdate: string | null
  lastFreezeUsed: string | null
}

export interface StreakStats extends UserStreak {
  currentMultiplier: number
  onFire: boolean
  fireIntensity: 'cold' | 'warm' | 'hot' | 'blazing' | 'inferno'
  daysUntilFreezeReset: number
}

export interface StreakLeaderboardEntry {
  userId: string
  username: string | null
  email: string
  streak: number
  totalPoints: number
  rank: number
}

export interface StreakUpdateResult {
  newStreak: number
  bestStreak: number
  streakMultiplier: number
  freezeUsed?: boolean
}

export interface StreakFreezeResult {
  success: boolean
  message: string
  freezesRemaining: number
}

export type StreakLeaderboardType = 'current' | 'all_time'

export interface StreakAchievement {
  achievementId: string
  achievementName: string
  achievementTitle: string
  newlyUnlocked: boolean
}
