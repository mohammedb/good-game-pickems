import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/utils/supabase-server'
import {
  validateApiKey,
  hasScope,
  createApiResponse,
  createApiError,
} from '@/lib/api-auth'

// GET /api/v1/predictions - Get predictions
export async function GET(request: NextRequest) {
  const { valid, apiKey, error } = await validateApiKey(request)
  if (!valid) {
    return NextResponse.json(
      createApiError('UNAUTHORIZED', error || 'Invalid API key', 401),
      { status: 401 },
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const matchId = searchParams.get('match_id')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get service role client
    const supabase = createServiceRoleClient()

    let query = supabase
      .from('picks')
      .select(
        `
        *,
        matches (
          id,
          home_team,
          away_team,
          match_date,
          home_score,
          away_score,
          game_type,
          best_of
        ),
        users (
          id,
          username,
          display_name
        )
      `,
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (matchId) {
      query = query.eq('match_id', matchId)
    }

    const { data: predictions, error: predError, count } = await query

    if (predError) throw predError

    return NextResponse.json(
      createApiResponse(predictions, {
        pagination: {
          limit,
          offset,
          total: count,
        },
      }),
    )
  } catch (error) {
    console.error('Error fetching predictions:', error)
    return NextResponse.json(
      createApiError('INTERNAL_ERROR', 'Failed to fetch predictions', 500),
      { status: 500 },
    )
  }
}

// POST /api/v1/predictions - Create a prediction
export async function POST(request: NextRequest) {
  const { valid, apiKey, error } = await validateApiKey(request)
  if (!valid) {
    return NextResponse.json(
      createApiError('UNAUTHORIZED', error || 'Invalid API key', 401),
      { status: 401 },
    )
  }

  // Check if API key has write scope
  if (!hasScope(apiKey!, 'write')) {
    return NextResponse.json(
      createApiError(
        'FORBIDDEN',
        'API key does not have write permissions',
        403,
      ),
      { status: 403 },
    )
  }

  try {
    const body = await request.json()
    const { match_id, picked_winner, home_score, away_score } = body

    if (!match_id || !picked_winner) {
      return NextResponse.json(
        createApiError(
          'BAD_REQUEST',
          'match_id and picked_winner are required',
          400,
        ),
        { status: 400 },
      )
    }

    // Get service role client
    const supabase = createServiceRoleClient()

    // Verify match exists and is upcoming
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', match_id)
      .single()

    if (matchError || !match) {
      return NextResponse.json(
        createApiError('NOT_FOUND', 'Match not found', 404),
        { status: 404 },
      )
    }

    if (match.home_score !== null || new Date(match.match_date) < new Date()) {
      return NextResponse.json(
        createApiError(
          'BAD_REQUEST',
          'Cannot make predictions for past or completed matches',
          400,
        ),
        { status: 400 },
      )
    }

    // Create or update prediction
    const { data: prediction, error: predError } = await supabase
      .from('picks')
      .upsert(
        {
          user_id: apiKey!.user_id,
          match_id,
          picked_winner,
          home_score: home_score || null,
          away_score: away_score || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,match_id',
        },
      )
      .select()
      .single()

    if (predError) throw predError

    return NextResponse.json(createApiResponse(prediction), { status: 201 })
  } catch (error) {
    console.error('Error creating prediction:', error)
    return NextResponse.json(
      createApiError('INTERNAL_ERROR', 'Failed to create prediction', 500),
      { status: 500 },
    )
  }
}
