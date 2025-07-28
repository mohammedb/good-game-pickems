import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/utils/supabase-server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type') || 'current'
  const limit = parseInt(searchParams.get('limit') || '50')

  const supabase = await createServerClient()

  // Get the current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get streak leaderboard
    const { data: leaderboard, error: leaderboardError } = await supabase.rpc(
      'get_streak_leaderboard',
      {
        p_type: type,
        p_limit: limit,
      },
    )

    if (leaderboardError) {
      throw leaderboardError
    }

    // Get current user's streak stats
    const { data: userStats, error: statsError } = await supabase
      .from('user_streak_stats')
      .select('*')
      .eq('id', user?.id)
      .single()

    if (statsError && statsError.code !== 'PGRST116') {
      throw statsError
    }

    return NextResponse.json({
      leaderboard,
      currentUser: userStats,
      userId: user?.id,
    })
  } catch (error) {
    console.error('Error fetching streak data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch streak data' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()

  // Get the current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { action } = body

  try {
    if (action === 'use_freeze') {
      // Use a streak freeze
      const { data, error } = await supabase
        .rpc('use_streak_freeze', {
          p_user_id: user.id,
        })
        .single()

      if (error) {
        throw error
      }

      return NextResponse.json(data)
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error performing streak action:', error)
    return NextResponse.json(
      { error: 'Failed to perform streak action' },
      { status: 500 },
    )
  }
}
