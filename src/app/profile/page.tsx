import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import { redirect } from 'next/navigation'
import ProfileContent from './profile-content'

interface Match {
  team1: string
  team2: string
  start_time: string
}

interface Pick {
  id: string
  user_id: string
  match_id: string
  predicted_winner: string
  is_correct: boolean | null
  created_at: string
  match: Match
}

interface ProfileStats {
  totalPicks: number
  correctPicks: number
  totalPoints: number
  recentPicks: Pick[]
}

async function getProfileData(userId: string): Promise<{ stats: ProfileStats }> {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  try {
    const { data: picks, error: picksError } = await supabase
      .from('picks')
      .select(`
        *,
        match:match_id (
          team1,
          team2,
          start_time
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (picksError) {
      console.error('Error fetching picks:', picksError)
      return {
        stats: {
          totalPicks: 0,
          correctPicks: 0,
          totalPoints: 0,
          recentPicks: []
        }
      }
    }

    const stats: ProfileStats = {
      totalPicks: picks?.length || 0,
      correctPicks: picks?.filter(pick => pick.is_correct).length || 0,
      totalPoints: (picks?.filter(pick => pick.is_correct).length || 0) * 10,
      recentPicks: (picks?.slice(0, 5) || []) as Pick[]
    }

    return { stats }
  } catch (error) {
    console.error('Error in getProfileData:', error)
    return {
      stats: {
        totalPicks: 0,
        correctPicks: 0,
        totalPoints: 0,
        recentPicks: []
      }
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

  const { stats } = await getProfileData(user.id)

  return <ProfileContent user={user} stats={stats} />
} 