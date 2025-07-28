import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createBrowserClient } from '@/utils/supabase-client'
import type {
  Achievement,
  AchievementCheckResult,
} from '@/lib/achievements/types'
import { useToast } from '@/hooks/use-toast'
import { useAchievementNotification } from '@/providers/achievement-provider'

export function useAchievements(userId?: string) {
  const supabase = createBrowserClient()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { showAchievement } = useAchievementNotification()

  const { data: achievements, isLoading } = useQuery({
    queryKey: ['achievements', userId],
    queryFn: async () => {
      if (!userId) return null

      // Get all achievements
      const { data: allAchievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .order('points', { ascending: false })

      if (achievementsError) throw achievementsError

      // Get user's unlocked achievements
      const { data: userAchievements, error: userError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)

      if (userError) throw userError

      // Get progress for locked achievements
      const { data: progressData } = await supabase
        .from('achievement_progress')
        .select('*')
        .eq('user_id', userId)

      const unlockedMap = new Map(
        userAchievements?.map((ua) => [ua.achievement_id, ua]) || [],
      )
      const progressMap = new Map(
        progressData?.map((p) => [p.achievement_id, p.progress_value]) || [],
      )

      const achievementsWithProgress = allAchievements.map((achievement) => {
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

      return achievementsWithProgress
    },
    enabled: !!userId,
  })

  const checkAchievements = useMutation({
    mutationFn: async (params: { trigger: string; context?: any }) => {
      if (!userId) return null

      const response = await fetch('/api/achievements/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          trigger: params.trigger,
          context: params.context,
        }),
      })

      if (!response.ok) throw new Error('Failed to check achievements')

      return response.json() as Promise<AchievementCheckResult>
    },
    onSuccess: (data) => {
      if (!data || data.unlocked.length === 0) return

      // Show notifications for newly unlocked achievements
      data.unlocked.forEach((unlock) => {
        const { achievement } = unlock

        // Use the new achievement notification system
        showAchievement(achievement)

        // Also show a simple toast for common achievements
        if (achievement.rarity === 'common') {
          toast({
            title: '🏆 Achievement Unlocked!',
            description: `${achievement.title} - +${achievement.points} points`,
            duration: 3000,
          })
        }
      })

      // Invalidate achievements query to update UI
      queryClient.invalidateQueries({ queryKey: ['achievements', userId] })
    },
  })

  const getAchievementsByCategory = (category: string) => {
    return achievements?.filter((a) => a.category === category) || []
  }

  const getAchievementsByRarity = (rarity: string) => {
    return achievements?.filter((a) => a.rarity === rarity) || []
  }

  const getUnlockedCount = () => {
    return achievements?.filter((a) => a.unlocked).length || 0
  }

  const getTotalPoints = () => {
    return (
      achievements
        ?.filter((a) => a.unlocked)
        .reduce((sum, a) => sum + a.points, 0) || 0
    )
  }

  const getProgress = () => {
    if (!achievements || achievements.length === 0) return 0
    const unlocked = getUnlockedCount()
    return Math.round((unlocked / achievements.length) * 100)
  }

  return {
    achievements,
    isLoading,
    checkAchievements: checkAchievements.mutate,
    getAchievementsByCategory,
    getAchievementsByRarity,
    getUnlockedCount,
    getTotalPoints,
    getProgress,
  }
}
