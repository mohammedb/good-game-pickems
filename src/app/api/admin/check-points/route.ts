import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/utils/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()

    // Check finished matches without points processed
    const { data: unprocessedMatches, error: unprocessedError } = await supabase
      .from('matches')
      .select(
        'id, team1, team2, winner_id, team1_map_score, team2_map_score, game_type, points_processed',
      )
      .eq('is_finished', true)
      .not('winner_id', 'is', null)
      .eq('points_processed', false)
      .limit(10)

    // Check picks without points for finished matches
    const { data: picksWithoutPoints, error: picksError } = await supabase
      .from('picks')
      .select(
        `
        id,
        user_id,
        predicted_winner,
        points_awarded,
        map_score_points,
        matches!inner(
          id,
          team1,
          team2,
          winner_id,
          is_finished,
          game_type
        )
      `,
      )
      .eq('matches.is_finished', true)
      .is('points_awarded', null)
      .limit(10)

    // Get points summary by game type
    const { data: pointsSummary, error: summaryError } = await supabase
      .from('picks')
      .select(
        `
        points_awarded,
        map_score_points,
        matches!inner(game_type)
      `,
      )
      .not('points_awarded', 'is', null)

    const gameTypeSummary = pointsSummary?.reduce((acc: any, pick: any) => {
      const gameType = pick.matches.game_type
      if (!acc[gameType]) {
        acc[gameType] = {
          totalPicks: 0,
          totalPoints: 0,
          winnerPoints: 0,
          mapPoints: 0,
        }
      }
      acc[gameType].totalPicks++
      acc[gameType].winnerPoints += pick.points_awarded || 0
      acc[gameType].mapPoints += pick.map_score_points || 0
      acc[gameType].totalPoints +=
        (pick.points_awarded || 0) + (pick.map_score_points || 0)
      return acc
    }, {})

    // Get user leaderboard
    const { data: leaderboard, error: leaderboardError } = await supabase
      .from('users')
      .select('id, username, total_points')
      .order('total_points', { ascending: false })
      .limit(10)

    return NextResponse.json({
      unprocessedMatches: {
        count: unprocessedMatches?.length || 0,
        matches: unprocessedMatches || [],
      },
      picksWithoutPoints: {
        count: picksWithoutPoints?.length || 0,
        picks: picksWithoutPoints || [],
      },
      pointsSummaryByGameType: gameTypeSummary || {},
      topUsers: leaderboard || [],
      errors: {
        unprocessed: unprocessedError?.message,
        picks: picksError?.message,
        summary: summaryError?.message,
        leaderboard: leaderboardError?.message,
      },
    })
  } catch (error) {
    console.error('Error checking points:', error)
    return NextResponse.json(
      { error: 'Failed to check points' },
      { status: 500 },
    )
  }
}
