import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/utils/supabase-server'
import { CreateChallengeRequest } from '@/lib/challenges/types'

// GET - Fetch user's challenges
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const type = searchParams.get('type') // 'sent' | 'received' | 'all'

    // Build query
    let query = supabase.from('challenges').select(`
        *,
        challenger:challenger_id(
          id, username, total_points
        ),
        challenged:challenged_id(
          id, username, total_points
        ),
        challenge_matches(
          match_id,
          matches(
            id, team1, team2, team1_id, team2_id,
            team1_logo, team2_logo, start_time,
            is_finished, winner_id, team1_score, team2_score
          )
        )
      `)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (type === 'sent') {
      query = query.eq('challenger_id', user.id)
    } else if (type === 'received') {
      query = query.eq('challenged_id', user.id)
    } else {
      // Default: all challenges involving the user
      query = query.or(
        `challenger_id.eq.${user.id},challenged_id.eq.${user.id}`,
      )
    }

    // Order by created_at desc
    query = query.order('created_at', { ascending: false })

    const { data: challenges, error } = await query

    if (error) {
      console.error('Error fetching challenges:', error)
      return NextResponse.json(
        { error: 'Failed to fetch challenges' },
        { status: 500 },
      )
    }

    return NextResponse.json({ challenges })
  } catch (error) {
    console.error('Error in GET /api/challenges:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

// POST - Create a new challenge
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body: CreateChallengeRequest = await request.json()
    const {
      challenged_username,
      challenge_type,
      match_ids,
      stake_points = 0,
      message,
    } = body

    // Validate request
    if (
      !challenged_username ||
      !challenge_type ||
      !match_ids ||
      match_ids.length === 0
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      )
    }

    // Find challenged user by username
    const { data: challengedUser, error: userError } = await supabase
      .from('users')
      .select('id, username, total_points')
      .eq('username', challenged_username)
      .single()

    if (userError || !challengedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Can't challenge yourself
    if (challengedUser.id === user.id) {
      return NextResponse.json(
        { error: 'Cannot challenge yourself' },
        { status: 400 },
      )
    }

    // Check if challenger has enough points for stake
    if (stake_points > 0) {
      const { data: challenger, error: challengerError } = await supabase
        .from('users')
        .select('total_points')
        .eq('id', user.id)
        .single()

      if (
        challengerError ||
        !challenger ||
        challenger.total_points < stake_points
      ) {
        return NextResponse.json(
          { error: 'Insufficient points for stake' },
          { status: 400 },
        )
      }
    }

    // Verify all matches exist and haven't started
    const { data: matches, error: matchError } = await supabase
      .from('matches')
      .select('id, start_time')
      .in('id', match_ids)

    if (matchError || !matches || matches.length !== match_ids.length) {
      return NextResponse.json(
        { error: 'Invalid match selection' },
        { status: 400 },
      )
    }

    // Check if any match has already started
    const now = new Date()
    const hasStartedMatch = matches.some(
      (match) => new Date(match.start_time) <= now,
    )
    if (hasStartedMatch) {
      return NextResponse.json(
        {
          error:
            'Cannot create challenge with matches that have already started',
        },
        { status: 400 },
      )
    }

    // Check rate limiting - max 5 challenges per day
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000,
    ).toISOString()
    const { count: challengeCount } = await supabase
      .from('challenges')
      .select('*', { count: 'exact', head: true })
      .eq('challenger_id', user.id)
      .gte('created_at', twentyFourHoursAgo)

    if (challengeCount && challengeCount >= 5) {
      return NextResponse.json(
        { error: 'Challenge limit reached. Maximum 5 challenges per day.' },
        { status: 429 },
      )
    }

    // Create challenge
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .insert({
        challenger_id: user.id,
        challenged_id: challengedUser.id,
        challenge_type,
        stake_points,
        message,
        status: 'pending',
      })
      .select()
      .single()

    if (challengeError) {
      console.error('Error creating challenge:', challengeError)
      return NextResponse.json(
        { error: 'Failed to create challenge' },
        { status: 500 },
      )
    }

    // Insert challenge matches
    const challengeMatches = match_ids.map((match_id) => ({
      challenge_id: challenge.id,
      match_id,
    }))

    const { error: matchInsertError } = await supabase
      .from('challenge_matches')
      .insert(challengeMatches)

    if (matchInsertError) {
      console.error('Error inserting challenge matches:', matchInsertError)
      // Rollback - delete the challenge
      await supabase.from('challenges').delete().eq('id', challenge.id)
      return NextResponse.json(
        { error: 'Failed to create challenge matches' },
        { status: 500 },
      )
    }

    // TODO: Send notification to challenged user

    // Return the created challenge with relations
    const { data: fullChallenge, error: fetchError } = await supabase
      .from('challenges')
      .select(
        `
        *,
        challenger:users!challenges_challenger_id_fkey(
          id, username, total_points
        ),
        challenged:users!challenges_challenged_id_fkey(
          id, username, total_points
        ),
        challenge_matches(
          match_id,
          matches(
            id, team1, team2, team1_id, team2_id,
            team1_logo, team2_logo, start_time,
            is_finished, winner_id
          )
        )
      `,
      )
      .eq('id', challenge.id)
      .single()

    if (fetchError || !fullChallenge) {
      return NextResponse.json({ challenge }, { status: 201 })
    }

    return NextResponse.json({ challenge: fullChallenge }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/challenges:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
