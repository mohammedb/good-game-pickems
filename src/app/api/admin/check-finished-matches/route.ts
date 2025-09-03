import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/utils/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()

    // Get finished match counts by game type
    const { data: finishedMatches, error } = await supabase
      .from('matches')
      .select('game_type, is_finished, points_processed, winner_id')
      .eq('is_finished', true)

    const summary = finishedMatches?.reduce((acc: any, match: any) => {
      const gameType = match.game_type
      if (!acc[gameType]) {
        acc[gameType] = {
          total: 0,
          withWinner: 0,
          pointsProcessed: 0,
        }
      }
      acc[gameType].total++
      if (match.winner_id) acc[gameType].withWinner++
      if (match.points_processed) acc[gameType].pointsProcessed++
      return acc
    }, {})

    // Get sample finished matches for each game type
    const gameTypes = ['csgo', 'lol', 'valorant']
    const samples: any = {}

    for (const gameType of gameTypes) {
      const { data: sampleMatches } = await supabase
        .from('matches')
        .select(
          'id, team1, team2, winner_id, team1_map_score, team2_map_score, points_processed, start_time',
        )
        .eq('game_type', gameType)
        .eq('is_finished', true)
        .limit(3)
        .order('start_time', { ascending: false })

      samples[gameType] = sampleMatches || []
    }

    return NextResponse.json({
      finishedMatchSummary: summary || {},
      sampleFinishedMatches: samples,
      error: error?.message,
    })
  } catch (error) {
    console.error('Error checking finished matches:', error)
    return NextResponse.json(
      { error: 'Failed to check finished matches' },
      { status: 500 },
    )
  }
}
