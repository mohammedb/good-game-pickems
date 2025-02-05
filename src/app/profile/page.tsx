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

interface ProfileStats {
  totalPicks: number
  correctPicks: number
  totalPoints: number
  mapScorePoints: number
  recentPicks: Pick[]
}

async function getProfileData(userId: string): Promise<ProfileStats> {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  try {
    // Fetch picks with match data
    const { data: picks, error: picksError } = await supabase
      .from('picks')
      .select(`
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
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (picksError) {
      console.error('Error fetching picks:', picksError)
      return {
        totalPicks: 0,
        correctPicks: 0,
        totalPoints: 0,
        mapScorePoints: 0,
        recentPicks: []
      }
    }

    // Process picks to ensure correct status
    const processedPicks = picks?.map(pick => {
      const matchStartTime = new Date(pick.match.start_time)
      const now = new Date()
      
      // If match hasn't started yet or isn't finished, set is_correct to null
      if (matchStartTime > now || !pick.match.is_finished) {
        return {
          ...pick,
          is_correct: null,
          map_score_correct: null
        }
      }
      
      return pick
    }) || []

    const stats: ProfileStats = {
      totalPicks: processedPicks.length,
      correctPicks: processedPicks.filter(pick => pick.is_correct).length,
      totalPoints: processedPicks.reduce((sum, pick) => 
        sum + (pick.is_correct ? 1 : 0) + (pick.map_score_points || 0), 0),
      mapScorePoints: processedPicks.reduce((sum, pick) => 
        sum + (pick.map_score_points || 0), 0),
      recentPicks: processedPicks.slice(0, 5) as Pick[]
    }

    return stats
  } catch (error) {
    console.error('Error in getProfileData:', error)
    return {
      totalPicks: 0,
      correctPicks: 0,
      totalPoints: 0,
      mapScorePoints: 0,
      recentPicks: []
    }
  }
}

export default async function ProfilePage() {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const stats = await getProfileData(user.id)

  return <ProfileContent stats={stats} />
} 