import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/utils/supabase-server'
import {
  validateApiKey,
  createApiResponse,
  createApiError,
} from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  const { valid, error } = await validateApiKey(request)
  if (!valid) {
    return NextResponse.json(
      createApiError('UNAUTHORIZED', error || 'Invalid API key', 401),
      { status: 401 },
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const gameType = searchParams.get('game_type')
    const timeframe = searchParams.get('timeframe') || 'all_time'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Calculate date range based on timeframe
    let startDate: string | null = null
    const now = new Date()

    switch (timeframe) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString()
        break
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7)).toISOString()
        break
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1)).toISOString()
        break
    }

    // Get service role client
    const supabase = createServiceRoleClient()

    // Get leaderboard data
    let query = supabase
      .from('users')
      .select(
        'id, username, display_name, total_points, correct_picks, total_picks',
      )
      .order('total_points', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: leaderboard, error: leaderError, count } = await query

    if (leaderError) throw leaderError

    // Add rank to each user
    const rankedLeaderboard = leaderboard?.map((user, index) => ({
      ...user,
      rank: offset + index + 1,
      accuracy:
        user.total_picks > 0
          ? ((user.correct_picks / user.total_picks) * 100).toFixed(1)
          : '0.0',
    }))

    return NextResponse.json(
      createApiResponse(rankedLeaderboard, {
        pagination: {
          limit,
          offset,
          total: count,
        },
        filters: {
          game_type: gameType,
          timeframe,
        },
      }),
    )
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      createApiError('INTERNAL_ERROR', 'Failed to fetch leaderboard', 500),
      { status: 500 },
    )
  }
}
