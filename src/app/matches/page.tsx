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
    const params = new URLSearchParams({
      division: '12517',
      game: 'csgo',
      limit: '100',
      offset: '0',
      order_by: 'round_number',
      order_dir: 'asc',
      season: '13162',
      status: 'unfinished'
    })

    const url = `${API_BASE_URL}/matches?${params.toString()}`
    console.log('Fetching matches from:', url)

    const response = await fetch(url, {
      next: { revalidate: 300 }, // Cache for 5 minutes
      headers: {
        'Authorization': `Bearer ${process.env.GOOD_GAME_LIGAEN_TOKEN}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch matches')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching from Good Game Ligaen:', error)
    return []
  }
}

async function getMatches(): Promise<Match[]> {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)
  const now = new Date().toISOString()

  try {
    // 1. Fetch matches from Good Game Ligaen
    const ggMatches = await fetchGoodGameMatches()

    // 2. Transform the data to our format
    const transformedMatches = await Promise.all(
      ggMatches
        .filter(match => !match.finished_at && match.home_signup?.team && match.away_signup?.team)
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
            start_time: match.start_time,
            division_id: DIVISION_ID,
            is_finished: !!match.finished_at,
            best_of: match.best_of || 3,
            round: match.round_identifier_text
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

    return transformedMatches
  } catch (error) {
    console.error('Error in getMatches:', error)
    
    // Fallback to database if API fails
    const { data: matches, error: dbError } = await supabase
      .from('matches')
      .select('*')
      .gt('start_time', now)
      .order('start_time', { ascending: true })
      .limit(10)

    if (dbError) {
      console.error('Error fetching from database:', dbError)
      return []
    }

    return matches || []
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

  return <MatchList matches={matches} userId={user.id} />
}
