import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'

// Points configuration
const POINTS_FOR_CORRECT_PICK = 10

interface Match {
  id: string
  division_id: string
  team1_id: string
  team2_id: string
  winner_id: string | null
  start_time: string
  is_finished: boolean
}

interface Pick {
  id: string
  user_id: string
  match_id: string
  predicted_winner: string
  points_awarded: number | null
}

interface MatchResult {
  match_id: string
  winner_id: string
}

export const maxDuration = 300 // 5 minutes max duration for long-running function

export async function POST(request: Request) {
  try {
    // Verify the request is from a trusted source (Vercel Cron or admin)
    const authHeader = request.headers.get('authorization')
    if (
      !authHeader ||
      authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`
    ) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    // 1. Get all finished matches that haven't been processed
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .eq('is_finished', true)
      .eq('points_processed', false)

    if (matchesError) {
      throw matchesError
    }

    if (!matches || matches.length === 0) {
      return NextResponse.json({ message: 'No matches to process' })
    }

    // 2. For each match, get the winner from the Good Game Ligaen API
    const token = process.env.GOOD_GAME_LIGAEN_TOKEN
    const matchResults = await Promise.all(
      matches.map(async (match: Match) => {
        const apiUrl = `https://www.gamer.no/api/paradise/v2/division/${match.division_id}/matchups/${match.id}`
        const response = await fetch(apiUrl, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (!response.ok) {
          console.error(`Failed to fetch match ${match.id}:`, await response.text())
          return null
        }

        const data = await response.json()
        return {
          match_id: match.id,
          winner_id: data.winner_id
        }
      })
    )

    // Filter out any failed API calls and type the results
    const validResults = matchResults.filter((result): result is MatchResult => 
      result !== null && typeof result.winner_id === 'string'
    )

    // 3. Get all picks for these matches
    const matchIds = validResults.map(result => result.match_id)
    const { data: picks, error: picksError } = await supabase
      .from('picks')
      .select('*')
      .in('match_id', matchIds)
      .is('points_awarded', null)

    if (picksError) {
      throw picksError
    }

    if (!picks) {
      return NextResponse.json({ message: 'No picks to process' })
    }

    // 4. Update points for each pick
    const updates = picks.map((pick: Pick) => {
      const matchResult = validResults.find(r => r.match_id === pick.match_id)
      if (!matchResult) return null

      const points = pick.predicted_winner === matchResult.winner_id
        ? POINTS_FOR_CORRECT_PICK
        : 0

      return supabase
        .from('picks')
        .update({
          points_awarded: points,
          is_correct: pick.predicted_winner === matchResult.winner_id
        })
        .eq('id', pick.id)
    })

    await Promise.all(updates.filter(Boolean))

    // 5. Mark matches as processed
    await supabase
      .from('matches')
      .update({ points_processed: true })
      .in('id', matchIds)

    // 6. Update user total points (using a database function for atomicity)
    await supabase.rpc('update_user_total_points')

    return NextResponse.json({
      message: 'Points updated successfully',
      processed_matches: validResults.length,
      processed_picks: picks.length
    })
  } catch (error) {
    console.error('Error updating points:', error)
    return NextResponse.json(
      { error: 'Failed to update points' },
      { status: 500 }
    )
  }
} 