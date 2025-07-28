import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/utils/supabase-server'
import { MakeChallengePredictionRequest } from '@/lib/challenges/types'

// GET - Get picks for a challenge
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    const challengeId = params.id

    // Verify user is part of the challenge
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('challenger_id, challenged_id, status')
      .eq('id', challengeId)
      .single()

    if (challengeError || !challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 },
      )
    }

    const isInvolved =
      challenge.challenger_id === user.id || challenge.challenged_id === user.id
    if (!isInvolved) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get all picks for this challenge
    const { data: picks, error: picksError } = await supabase
      .from('challenge_picks')
      .select(
        `
        *,
        match:matches(
          id, team1, team2, team1_id, team2_id,
          team1_logo, team2_logo, start_time, is_finished
        ),
        user:users(id, username)
      `,
      )
      .eq('challenge_id', challengeId)
      .order('created_at', { ascending: false })

    if (picksError) {
      console.error('Error fetching picks:', picksError)
      return NextResponse.json(
        { error: 'Failed to fetch picks' },
        { status: 500 },
      )
    }

    // Filter picks based on match start times
    const now = new Date()
    const visiblePicks = picks?.map((pick) => {
      const matchStarted = new Date(pick.match.start_time) <= now

      // Hide opponent's pick if match hasn't started
      if (pick.user_id !== user.id && !matchStarted) {
        return {
          ...pick,
          predicted_winner: null,
          hidden: true,
        }
      }

      return pick
    })

    return NextResponse.json({ picks: visiblePicks })
  } catch (error) {
    console.error('Error in GET /api/challenges/[id]/picks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

// POST - Make predictions for a challenge
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    const challengeId = params.id
    const body: MakeChallengePredictionRequest = await request.json()
    const { match_id, predicted_winner } = body

    // Validate request
    if (!match_id || !predicted_winner) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      )
    }

    // Verify challenge exists and user is part of it
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('challenger_id, challenged_id, status')
      .eq('id', challengeId)
      .single()

    if (challengeError || !challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 },
      )
    }

    // Check if user is involved in the challenge
    const isInvolved =
      challenge.challenger_id === user.id || challenge.challenged_id === user.id
    if (!isInvolved) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Challenge must be accepted
    if (challenge.status !== 'accepted') {
      return NextResponse.json(
        { error: 'Challenge must be accepted to make predictions' },
        { status: 400 },
      )
    }

    // Verify match is part of the challenge
    const { data: challengeMatch, error: matchError } = await supabase
      .from('challenge_matches')
      .select(
        `
        match_id,
        matches(
          id, team1_id, team2_id, start_time, is_finished
        )
      `,
      )
      .eq('challenge_id', challengeId)
      .eq('match_id', match_id)
      .single()

    if (matchError || !challengeMatch) {
      return NextResponse.json(
        { error: 'Match not part of this challenge' },
        { status: 400 },
      )
    }

    // Check if match has already started
    const match = Array.isArray(challengeMatch.matches)
      ? challengeMatch.matches[0]
      : challengeMatch.matches
    if (!match || new Date(match.start_time) <= new Date()) {
      return NextResponse.json(
        { error: 'Match has already started' },
        { status: 400 },
      )
    }

    // Validate predicted_winner is one of the teams
    if (
      predicted_winner !== match.team1_id &&
      predicted_winner !== match.team2_id
    ) {
      return NextResponse.json(
        { error: 'Invalid team selection' },
        { status: 400 },
      )
    }

    // Check if pick already exists
    const { data: existingPick } = await supabase
      .from('challenge_picks')
      .select('id')
      .eq('challenge_id', challengeId)
      .eq('user_id', user.id)
      .eq('match_id', match_id)
      .single()

    let pick

    if (existingPick) {
      // Update existing pick
      const { data: updatedPick, error: updateError } = await supabase
        .from('challenge_picks')
        .update({
          predicted_winner,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPick.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating pick:', updateError)
        return NextResponse.json(
          { error: 'Failed to update prediction' },
          { status: 500 },
        )
      }

      pick = updatedPick
    } else {
      // Create new pick
      const { data: newPick, error: insertError } = await supabase
        .from('challenge_picks')
        .insert({
          challenge_id: challengeId,
          user_id: user.id,
          match_id,
          predicted_winner,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating pick:', insertError)
        return NextResponse.json(
          { error: 'Failed to save prediction' },
          { status: 500 },
        )
      }

      pick = newPick
    }

    return NextResponse.json({ pick })
  } catch (error) {
    console.error('Error in POST /api/challenges/[id]/picks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

// DELETE - Remove a prediction (before match starts)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    const challengeId = params.id
    const searchParams = request.nextUrl.searchParams
    const matchId = searchParams.get('match_id')

    if (!matchId) {
      return NextResponse.json({ error: 'Match ID required' }, { status: 400 })
    }

    // Verify the pick exists and belongs to the user
    const { data: pick, error: pickError } = await supabase
      .from('challenge_picks')
      .select(
        `
        id,
        match:matches(start_time)
      `,
      )
      .eq('challenge_id', challengeId)
      .eq('user_id', user.id)
      .eq('match_id', matchId)
      .single()

    if (pickError || !pick) {
      return NextResponse.json({ error: 'Pick not found' }, { status: 404 })
    }

    // Check if match has already started
    const pickMatch = Array.isArray(pick.match) ? pick.match[0] : pick.match
    if (!pickMatch || new Date(pickMatch.start_time) <= new Date()) {
      return NextResponse.json(
        { error: 'Cannot delete pick after match has started' },
        { status: 400 },
      )
    }

    // Delete the pick
    const { error: deleteError } = await supabase
      .from('challenge_picks')
      .delete()
      .eq('id', pick.id)

    if (deleteError) {
      console.error('Error deleting pick:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete pick' },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/challenges/[id]/picks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
