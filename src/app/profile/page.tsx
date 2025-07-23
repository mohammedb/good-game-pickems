import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import { redirect } from 'next/navigation'
import ProfileContent from './profile-content'

interface Match {
  team1: string
  team2: string
  start_time: string
  team1_map_score: number | null
  team2_map_score: number | null
}

interface Pick {
  id: string
  user_id: string
  match_id: string
  predicted_winner: string
  predicted_team1_maps: number | null
  predicted_team2_maps: number | null
  is_correct: boolean | null
  map_score_correct: boolean | null
  map_score_points: number
  created_at: string
  match: Match
}

interface Achievement {
  id: string
  name: string
  title: string
  description: string
  icon: 'trophy' | 'target' | 'sparkles' | 'medal' | 'crown'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  points: number
  unlocked: boolean
  unlockedAt?: string
  progress: number
}

interface ProfileStats {
  totalPicks: number
  correctPicks: number
  totalPoints: number
  mapScorePoints: number
  recentPicks: Pick[]
  achievements: Achievement[]
  userStats: {
    totalPredictions: number
    correctPredictions: number
    currentStreak: number
    longestStreak: number
    totalPoints: number
    mapScorePoints: number
  } | null
}

async function getProfileData(userId: string): Promise<ProfileStats> {
  // const cookieStore = cookies() - removed in Next.js 15
  const supabase = await createServerClient()

  try {
    // Fetch picks with match data
    const { data: picks, error: picksError } = await supabase
      .from('picks')
      .select(
        `
        *,
        match:matches (
          team1,
          team2,
          start_time,
          team1_map_score,
          team2_map_score,
          is_finished,
          winner_id
        )
      `,
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (picksError) {
      console.error('Error fetching picks:', picksError)
      return {
        totalPicks: 0,
        correctPicks: 0,
        totalPoints: 0,
        mapScorePoints: 0,
        recentPicks: [],
        achievements: [],
        userStats: null,
      }
    }

    // Process picks to ensure correct status
    const processedPicks =
      picks?.map((pick) => {
        const matchStartTime = new Date(pick.match.start_time)
        const now = new Date()

        // If match hasn't started yet or isn't finished, set is_correct to null
        if (matchStartTime > now || !pick.match.is_finished) {
          return {
            ...pick,
            is_correct: null,
            map_score_correct: null,
          }
        }

        return pick
      }) || []

    // Fetch user stats
    const { data: userStats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Fetch all achievements with user progress
    const { data: allAchievements } = await supabase
      .from('achievements')
      .select('*')
      .order('points', { ascending: false })

    const { data: userAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id, unlocked_at, progress')
      .eq('user_id', userId)

    // Map achievements with user progress
    const achievementsMap = new Map(
      userAchievements?.map((ua) => [ua.achievement_id, ua]) || [],
    )

    const achievements: Achievement[] = (allAchievements || []).map(
      (achievement) => {
        const userAchievement = achievementsMap.get(achievement.id)
        const unlocked = !!userAchievement

        // Calculate progress based on achievement criteria
        let progress = 0
        if (unlocked) {
          progress = 100
        } else if (userStats) {
          const criteria = achievement.criteria as any
          switch (criteria.type) {
            case 'predictions_count':
              progress = Math.min(
                100,
                (userStats.totalPredictions / criteria.value) * 100,
              )
              break
            case 'streak':
              progress = Math.min(
                100,
                (userStats.longestStreak / criteria.value) * 100,
              )
              break
            case 'map_scores':
              const mapScorePicks = processedPicks.filter(
                (p) => p.map_score_correct,
              ).length
              progress = Math.min(100, (mapScorePicks / criteria.value) * 100)
              break
          }
        }

        return {
          id: achievement.id,
          name: achievement.name,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon as any,
          rarity: achievement.rarity as any,
          points: achievement.points,
          unlocked,
          unlockedAt: userAchievement?.unlocked_at,
          progress: Math.round(progress),
        }
      },
    )

    const stats: ProfileStats = {
      totalPicks: processedPicks.length,
      correctPicks: processedPicks.filter((pick) => pick.is_correct).length,
      totalPoints: processedPicks.reduce(
        (sum, pick) =>
          sum + (pick.is_correct ? 1 : 0) + (pick.map_score_points || 0),
        0,
      ),
      mapScorePoints: processedPicks.reduce(
        (sum, pick) => sum + (pick.map_score_points || 0),
        0,
      ),
      recentPicks: processedPicks.slice(0, 5) as Pick[],
      achievements,
      userStats,
    }

    return stats
  } catch (error) {
    console.error('Error in getProfileData:', error)
    return {
      totalPicks: 0,
      correctPicks: 0,
      totalPoints: 0,
      mapScorePoints: 0,
      recentPicks: [],
      achievements: [],
      userStats: null,
    }
  }
}

export default async function ProfilePage() {
  // const cookieStore = cookies() - removed in Next.js 15
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const stats = await getProfileData(user.id)

  return <ProfileContent stats={stats} />
}
