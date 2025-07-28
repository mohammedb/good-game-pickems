import { createServerClient } from '@/utils/supabase-server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Achievement,
  UserAchievement,
  AchievementUnlock,
  AchievementCheckResult,
  AchievementTrigger,
  UserStats,
} from './types'

export class AchievementService {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  /**
   * Main entry point for checking achievements after various triggers
   */
  async checkAchievements(
    userId: string,
    trigger: AchievementTrigger,
    context?: any,
  ): Promise<AchievementCheckResult> {
    const result: AchievementCheckResult = {
      unlocked: [],
      progress: [],
    }

    try {
      // Get user's current stats
      const stats = await this.getUserStats(userId)
      if (!stats) return result

      // Get all achievements
      const { data: achievements, error } = await this.supabase
        .from('achievements')
        .select('*')

      if (error || !achievements) {
        console.error('Error fetching achievements:', error)
        return result
      }

      // Get user's current achievements
      const { data: userAchievements } = await this.supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', userId)

      const unlockedIds = new Set(
        userAchievements?.map((ua) => ua.achievement_id) || [],
      )

      // Check each achievement
      for (const achievement of achievements) {
        if (unlockedIds.has(achievement.id)) continue

        const checkResult = await this.checkAchievementCriteria(
          achievement,
          stats,
          userId,
          trigger,
          context,
        )

        if (checkResult.unlocked) {
          const unlockResult = await this.unlockAchievement(
            userId,
            achievement.id,
          )
          if (unlockResult) {
            result.unlocked.push({
              achievement,
              isNew: true,
              progress: 100,
            })
          }
        } else if (checkResult.progress > 0) {
          result.progress.push({
            achievement,
            progress: checkResult.progress,
          })

          // Update progress tracking
          await this.updateAchievementProgress(
            userId,
            achievement.id,
            checkResult.progress,
          )
        }
      }

      return result
    } catch (error) {
      console.error('Error checking achievements:', error)
      return result
    }
  }

  /**
   * Check if a specific achievement criteria is met
   */
  private async checkAchievementCriteria(
    achievement: Achievement,
    stats: UserStats,
    userId: string,
    trigger: AchievementTrigger,
    context?: any,
  ): Promise<{ unlocked: boolean; progress: number }> {
    const criteria = achievement.criteria

    switch (criteria.type) {
      case 'predictions_count':
        return this.checkCountCriteria(
          stats.total_predictions,
          criteria.value || 0,
        )

      case 'correct_predictions':
        return this.checkCountCriteria(
          stats.correct_predictions,
          criteria.value || 0,
        )

      case 'streak':
        return this.checkStreakCriteria(
          stats.longest_streak,
          criteria.value || 0,
        )

      case 'map_scores':
        return await this.checkMapScoreCriteria(userId, criteria.value || 0)

      case 'perfect_round':
        if (trigger === 'match_completed' && context?.roundId) {
          const isPerfect = await this.checkPerfectRound(
            userId,
            context.roundId,
          )
          return { unlocked: isPerfect, progress: isPerfect ? 100 : 0 }
        }
        return { unlocked: false, progress: 0 }

      case 'perfect_month':
        if (trigger === 'match_completed') {
          const isPerfect = await this.checkPerfectMonth(userId)
          return { unlocked: isPerfect, progress: isPerfect ? 100 : 0 }
        }
        return { unlocked: false, progress: 0 }

      case 'comeback':
        if (trigger === 'prediction_made') {
          const isComeback = await this.checkComeback(userId)
          return { unlocked: isComeback, progress: isComeback ? 100 : 0 }
        }
        return { unlocked: false, progress: 0 }

      case 'early_bird':
        if (trigger === 'prediction_made' && context?.matchId) {
          const isEarly = await this.checkEarlyBird(
            userId,
            context.matchId,
            criteria.value || 10,
          )
          return { unlocked: isEarly, progress: isEarly ? 100 : 0 }
        }
        return { unlocked: false, progress: 0 }

      case 'rounds_participated':
        const rounds = await this.countRoundsParticipated(userId)
        return this.checkCountCriteria(rounds, criteria.value || 0)

      case 'multi_game':
        const hasMultiGame = await this.checkMultiGame(userId)
        return { unlocked: hasMultiGame, progress: hasMultiGame ? 100 : 0 }

      case 'shares':
        // This would need to be tracked separately
        return { unlocked: false, progress: 0 }

      case 'viral_share':
        // This would need to be tracked separately
        return { unlocked: false, progress: 0 }

      default:
        return { unlocked: false, progress: 0 }
    }
  }

  /**
   * Helper method for count-based criteria
   */
  private checkCountCriteria(
    current: number,
    required: number,
  ): { unlocked: boolean; progress: number } {
    const progress = Math.min((current / required) * 100, 100)
    return {
      unlocked: current >= required,
      progress: Math.round(progress),
    }
  }

  /**
   * Helper method for streak-based criteria
   */
  private checkStreakCriteria(
    longestStreak: number,
    required: number,
  ): { unlocked: boolean; progress: number } {
    const progress = Math.min((longestStreak / required) * 100, 100)
    return {
      unlocked: longestStreak >= required,
      progress: Math.round(progress),
    }
  }

  /**
   * Check map score criteria
   */
  private async checkMapScoreCriteria(
    userId: string,
    required: number,
  ): Promise<{ unlocked: boolean; progress: number }> {
    const { data, error } = await this.supabase
      .from('picks')
      .select('id')
      .eq('user_id', userId)
      .eq('is_correct', true)
      .gt('map_score_points', 0)

    if (error || !data) return { unlocked: false, progress: 0 }

    const count = data.length
    return this.checkCountCriteria(count, required)
  }

  /**
   * Check if user had a perfect round
   */
  private async checkPerfectRound(
    userId: string,
    roundId: string,
  ): Promise<boolean> {
    const { data, error } = await this.supabase.rpc(
      'check_perfect_round_achievement',
      {
        p_user_id: userId,
        p_round_id: roundId,
      },
    )

    return !error && data === true
  }

  /**
   * Check if user had a perfect month
   */
  private async checkPerfectMonth(userId: string): Promise<boolean> {
    // Get all picks from the current month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: picks, error } = await this.supabase
      .from('picks')
      .select('is_correct')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString())
      .not('is_correct', 'is', null)

    if (error || !picks || picks.length === 0) return false

    // Check if all picks are correct
    return picks.every((pick) => pick.is_correct === true)
  }

  /**
   * Check comeback achievement
   */
  private async checkComeback(userId: string): Promise<boolean> {
    const { data, error } = await this.supabase.rpc(
      'check_comeback_achievement',
      {
        p_user_id: userId,
      },
    )

    return !error && data === true
  }

  /**
   * Check early bird achievement
   */
  private async checkEarlyBird(
    userId: string,
    matchId: string,
    threshold: number,
  ): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('picks')
      .select('created_at, user_id')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })
      .limit(threshold)

    if (error || !data) return false

    return data.some((pick) => pick.user_id === userId)
  }

  /**
   * Count rounds participated in
   */
  private async countRoundsParticipated(userId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('picks')
      .select('match_id')
      .eq('user_id', userId)

    if (error || !data) return 0

    // Get unique rounds
    const { data: matches } = await this.supabase
      .from('matches')
      .select('round')
      .in(
        'id',
        data.map((p) => p.match_id),
      )

    if (!matches) return 0

    const uniqueRounds = new Set(matches.map((m) => m.round))
    return uniqueRounds.size
  }

  /**
   * Check multi-game achievement
   */
  private async checkMultiGame(userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('picks')
      .select('matches!inner(game_type)')
      .eq('user_id', userId)

    if (error || !data) return false

    const gameTypes = new Set(
      data.map((p: any) => p.matches.game_type).filter(Boolean),
    )
    return gameTypes.size >= 2
  }

  /**
   * Get user stats
   */
  private async getUserStats(userId: string): Promise<UserStats | null> {
    const { data, error } = await this.supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      // Create initial stats if they don't exist
      const { data: newStats } = await this.supabase
        .from('user_stats')
        .insert({ user_id: userId })
        .select()
        .single()

      return newStats
    }

    return data
  }

  /**
   * Unlock an achievement for a user
   */
  private async unlockAchievement(
    userId: string,
    achievementId: string,
  ): Promise<boolean> {
    const { error } = await this.supabase.from('user_achievements').insert({
      user_id: userId,
      achievement_id: achievementId,
      progress: 100,
    })

    return !error
  }

  /**
   * Update achievement progress
   */
  private async updateAchievementProgress(
    userId: string,
    achievementId: string,
    progress: number,
  ): Promise<void> {
    await this.supabase.from('achievement_progress').upsert({
      user_id: userId,
      achievement_id: achievementId,
      progress_value: progress,
      last_updated: new Date().toISOString(),
    })
  }

  /**
   * Get user's achievements with progress
   */
  async getUserAchievements(userId: string): Promise<{
    achievements: (Achievement & {
      unlocked: boolean
      progress: number
      unlocked_at?: string
    })[]
  }> {
    // Get all achievements
    const { data: achievements } = await this.supabase
      .from('achievements')
      .select('*')
      .order('points', { ascending: false })

    if (!achievements) return { achievements: [] }

    // Get user's unlocked achievements
    const { data: userAchievements } = await this.supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)

    // Get progress for locked achievements
    const { data: progressData } = await this.supabase
      .from('achievement_progress')
      .select('*')
      .eq('user_id', userId)

    const unlockedMap = new Map(
      userAchievements?.map((ua) => [ua.achievement_id, ua]) || [],
    )
    const progressMap = new Map(
      progressData?.map((p) => [p.achievement_id, p.progress_value]) || [],
    )

    const achievementsWithProgress = achievements.map((achievement) => {
      const userAchievement = unlockedMap.get(achievement.id)
      const progress = userAchievement
        ? 100
        : progressMap.get(achievement.id) || 0

      return {
        ...achievement,
        unlocked: !!userAchievement,
        progress,
        unlocked_at: userAchievement?.unlocked_at,
      }
    })

    return { achievements: achievementsWithProgress }
  }
}
