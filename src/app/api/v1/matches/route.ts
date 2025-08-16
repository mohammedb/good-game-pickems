import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/utils/supabase-server'
import {
  validateApiKey,
  createApiResponse,
  createApiError,
} from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  // Validate API key
  const { valid, apiKey, error } = await validateApiKey(request)
  if (!valid) {
    return NextResponse.json(
      createApiError('UNAUTHORIZED', error || 'Invalid API key', 401),
      { status: 401 },
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const gameType = searchParams.get('game_type')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get service role client
    const supabase = createServiceRoleClient()

    // Build query
    let query = supabase
      .from('matches')
      .select('*')
      .order('match_date', { ascending: true })
      .range(offset, offset + limit - 1)

    if (gameType) {
      query = query.eq('game_type', gameType)
    }

    if (status === 'upcoming') {
      query = query
        .gte('match_date', new Date().toISOString())
        .is('home_score', null)
    } else if (status === 'completed') {
      query = query.not('home_score', 'is', null)
    } else if (status === 'live') {
      // Matches within the last 2 hours that haven't completed
      const twoHoursAgo = new Date(
        Date.now() - 2 * 60 * 60 * 1000,
      ).toISOString()
      query = query
        .gte('match_date', twoHoursAgo)
        .lt('match_date', new Date().toISOString())
        .is('home_score', null)
    }

    const { data: matches, error: matchError, count } = await query

    if (matchError) throw matchError

    // Add rate limit headers
    const response = NextResponse.json(
      createApiResponse(matches, {
        pagination: {
          limit,
          offset,
          total: count,
        },
      }),
    )

    response.headers.set(
      'X-RateLimit-Limit',
      apiKey?.rate_limit_tier === 'free' ? '100' : '1000',
    )
    response.headers.set('X-RateLimit-Remaining', 'check-implementation') // TODO: Implement
    response.headers.set(
      'X-RateLimit-Reset',
      new Date(Date.now() + 60000).toISOString(),
    )

    return response
  } catch (error) {
    console.error('Error fetching matches:', error)
    return NextResponse.json(
      createApiError('INTERNAL_ERROR', 'Failed to fetch matches', 500),
      { status: 500 },
    )
  }
}
