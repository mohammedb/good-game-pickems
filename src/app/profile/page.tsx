import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import { redirect } from 'next/navigation'
import ProfileContent, { type ProfileStats } from './profile-content'

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
        challengeStats: null,
        pointsTrend: 0,
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

    // Fetch challenge stats
    const { data: challengeStats } = await supabase
      .from('users')
      .select(
        'challenge_wins, challenge_losses, challenge_draws, challenge_points_won, challenge_points_lost',
      )
      .eq('id', userId)
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

    const achievements = (allAchievements || []).map((achievement) => {
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
        code: achievement.code,
        name: achievement.name,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        icon_url: achievement.icon_url,
        rarity: achievement.rarity as 'common' | 'rare' | 'epic' | 'legendary',
        points: achievement.points,
        category: achievement.category,
        requirement_type: achievement.requirement_type,
        requirement_value: achievement.requirement_value,
        game_type: achievement.game_type,
        criteria: achievement.criteria,
        created_at: achievement.created_at,
        unlocked,
        unlocked_at: userAchievement?.unlocked_at,
        progress: Math.round(progress),
      }
    })

    // Calculate total points
    const totalPoints = processedPicks.reduce(
      (sum, pick) =>
        sum + (pick.is_correct ? 1 : 0) + (pick.map_score_points || 0),
      0,
    )

    // Calculate points trend (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentPicks = processedPicks.filter((pick) => {
      const pickDate = new Date(pick.created_at)
      return pickDate >= sevenDaysAgo && pick.match.is_finished
    })

    const recentPoints = recentPicks.reduce(
      (sum, pick) =>
        sum + (pick.is_correct ? 1 : 0) + (pick.map_score_points || 0),
      0,
    )

    // Calculate trend as percentage of total points gained in last 7 days
    const pointsTrend =
      totalPoints > 0 ? Math.round((recentPoints / totalPoints) * 100) : 0

    const stats: ProfileStats = {
      totalPicks: processedPicks.length,
      correctPicks: processedPicks.filter((pick) => pick.is_correct).length,
      totalPoints,
      mapScorePoints: processedPicks.reduce(
        (sum, pick) => sum + (pick.map_score_points || 0),
        0,
      ),
      recentPicks: processedPicks.slice(0, 5),
      achievements,
      userStats,
      challengeStats,
      pointsTrend,
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
      challengeStats: null,
      pointsTrend: 0,
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
