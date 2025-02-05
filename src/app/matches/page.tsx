// src/app/matches/page.tsx
import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import { redirect } from 'next/navigation'
import MatchList from './MatchList'
import { Match, GoodGameMatch } from './types'

const DIVISION_ID = '12517' // CS:GO Division
const API_BASE_URL = 'https://www.goodgameligaen.no/api'

async function fetchGoodGameMatches(): Promise<GoodGameMatch[]> {
  try {
    // Fetch both unfinished and recently finished matches
    const unfinishedParams = new URLSearchParams({
      division: '12517',
      game: 'csgo',
      limit: '100',
      offset: '0',
      order_by: 'round_number',
      order_dir: 'asc',
      season: '13162',
      status: 'unfinished'
    })

    const finishedParams = new URLSearchParams({
      division: '12517',
      game: 'csgo',
      limit: '100',
      offset: '0',
      order_by: 'round_number',
      order_dir: 'asc',
      season: '13162',
      status: 'finished',
      finished_after: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    })

    const [unfinishedResponse, finishedResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/matches?${unfinishedParams.toString()}`, {
        next: { revalidate: 300 }, // Cache for 5 minutes
        headers: {
          'Authorization': `Bearer ${process.env.GOOD_GAME_LIGAEN_TOKEN}`
        }
      }),
      fetch(`${API_BASE_URL}/matches?${finishedParams.toString()}`, {
        next: { revalidate: 300 }, // Cache for 5 minutes
        headers: {
          'Authorization': `Bearer ${process.env.GOOD_GAME_LIGAEN_TOKEN}`
        }
      })
    ])

    if (!unfinishedResponse.ok || !finishedResponse.ok) {
      throw new Error('Failed to fetch matches')
    }

    const [unfinishedData, finishedData] = await Promise.all([
      unfinishedResponse.json(),
      finishedResponse.json()
    ])

    // Combine and sort by start time
    const allMatches = [...unfinishedData, ...finishedData]
    allMatches.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

    return allMatches
  } catch (error) {
    console.error('Error fetching from Good Game Ligaen:', error)
    return []
  }
}

async function getMatches(): Promise<Match[]> {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)
  const now = new Date()
  const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000))

  try {
    // 1. Fetch matches from Good Game Ligaen
    const ggMatches = await fetchGoodGameMatches()

    // 2. Transform the data to our format
    const transformedMatches = await Promise.all(
      ggMatches
        .filter(match => match.home_signup?.team && match.away_signup?.team)
        .map(async match => {
          // Get the existing match ID if it exists
          const { data: existingMatch } = await supabase
            .from('matches')
            .select('id')
            .eq('gg_ligaen_api_id', match.id.toString())
            .single()

          return {
            id: existingMatch?.id || crypto.randomUUID(),
            gg_ligaen_api_id: match.id.toString(),
            team1: match.home_signup.team.name,
            team2: match.away_signup.team.name,
            team1_id: match.home_signup.team.id.toString(),
            team2_id: match.away_signup.team.id.toString(),
            team1_logo: match.home_signup.team.logo?.url,
            team2_logo: match.away_signup.team.logo?.url,
            team1_score: match.home_score,
            team2_score: match.away_score,
            start_time: match.start_time,
            division_id: DIVISION_ID,
            is_finished: !!match.finished_at,
            winner_id: match.winning_side === 'home' ? match.home_signup.team.id.toString() : 
                      match.winning_side === 'away' ? match.away_signup.team.id.toString() : null,
            best_of: match.best_of || 3,
            round: match.round_identifier_text,
            stream_link: match.videos?.find(video => video.source === 'twitch' && video.status === 'online')?.url
          }
        })
    )

    // 3. Store the matches in our database for reference
    const { error } = await supabase
      .from('matches')
      .upsert(
        transformedMatches.map(match => ({
          ...match,
          synced_at: new Date().toISOString()
        })),
        { 
          onConflict: 'gg_ligaen_api_id',
          ignoreDuplicates: false
        }
      )

    if (error) {
      console.error('Error storing matches:', error)
    }

    // 4. Get matches from the last 24 hours and upcoming
    const { data: matches, error: dbError } = await supabase
      .from('matches')
      .select('*')
      .gte('start_time', twentyFourHoursAgo.toISOString())
      .order('start_time', { ascending: true })

    if (dbError) {
      console.error('Error fetching from database:', dbError)
      return []
    }

    return matches || []
  } catch (error) {
    console.error('Error in getMatches:', error)
    
    // Fallback to database if API fails
    const { data: matches, error: dbError } = await supabase
      .from('matches')
      .select('*')
      .gte('start_time', twentyFourHoursAgo.toISOString())
      .order('start_time', { ascending: true })

    if (dbError) {
      console.error('Error fetching from database:', dbError)
      return []
    }

    return matches || []
  }
}

async function getUserPredictionStats(userId: string, round: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { data: picks, error } = await supabase
    .from('picks')
    .select(`
      *,
      match:match_id (
        round
      )
    `)
    .eq('user_id', userId)
    .eq('match.round', round)

  if (error) {
    console.error('Error fetching user prediction stats:', error)
    return { totalPicks: 0, correctPicks: 0 }
  }

  return {
    totalPicks: picks.length,
    correctPicks: picks.filter(pick => pick.is_correct).length
  }
}

export default async function MatchesPage() {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const matches = await getMatches()
  
  // Get the current round (first match's round)
  const currentRound = matches[0]?.round || 'Current Round'
  
  // Get prediction stats for the current round
  const stats = await getUserPredictionStats(user.id, currentRound)

  return <MatchList 
    matches={matches} 
    userId={user.id} 
    roundStats={{
      ...stats,
      roundName: currentRound
    }}
  />
}
