import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/utils/supabase-server'
import { UpdateChallengeStatusRequest } from '@/lib/challenges/types'

// GET - Fetch a specific challenge
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

    // Fetch challenge with all relations
    const { data: challenge, error } = await supabase
      .from('challenges')
      .select(
        `
        *,
        challenger:users!challenges_challenger_id_fkey(
          id, username, total_points,
          challenge_wins, challenge_losses, challenge_draws
        ),
        challenged:users!challenges_challenged_id_fkey(
          id, username, total_points,
          challenge_wins, challenge_losses, challenge_draws
        ),
        winner:users!challenges_winner_id_fkey(
          id, username
        ),
        challenge_matches(
          match_id,
          matches(
            id, team1, team2, team1_id, team2_id,
            team1_logo, team2_logo, start_time,
            is_finished, winner_id, team1_score, team2_score
          )
        ),
        challenge_picks(
          id, user_id, match_id, predicted_winner,
          is_correct, points_earned, created_at
        )
      `,
      )
      .eq('id', challengeId)
      .single()

    if (error || !challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 },
      )
    }

    // Check if user is involved in the challenge
    const isInvolved =
      challenge.challenger_id === user.id || challenge.challenged_id === user.id

    // If challenge is not completed and user is not involved, hide picks
    if (challenge.status !== 'completed' && !isInvolved) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Separate picks by user
    const userPicks =
      challenge.challenge_picks?.filter(
        (pick: any) => pick.user_id === user.id,
      ) || []
    const opponentId =
      challenge.challenger_id === user.id
        ? challenge.challenged_id
        : challenge.challenger_id
    const opponentPicks =
      challenge.challenge_picks?.filter(
        (pick: any) => pick.user_id === opponentId,
      ) || []

    // Hide opponent picks if matches haven't started yet
    const now = new Date()
    const shouldHideOpponentPicks = challenge.challenge_matches?.some(
      (cm: any) => {
        const match = Array.isArray(cm.matches) ? cm.matches[0] : cm.matches
        return match && new Date(match.start_time) > now
      },
    )

    return NextResponse.json({
      challenge: {
        ...challenge,
        user_picks: userPicks,
        opponent_picks: shouldHideOpponentPicks ? [] : opponentPicks,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/challenges/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

// PATCH - Update challenge status (accept/decline)
export async function PATCH(
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
    const body: UpdateChallengeStatusRequest = await request.json()
    const { status } = body

    // Validate status
    if (!status || !['accepted', 'declined'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Fetch challenge to verify user is the challenged person
    const { data: challenge, error: fetchError } = await supabase
      .from('challenges')
      .select('*, challenge_matches(match_id, matches(start_time))')
      .eq('id', challengeId)
      .single()

    if (fetchError || !challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 },
      )
    }

    // Only the challenged user can accept/decline
    if (challenge.challenged_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Can only update pending challenges
    if (challenge.status !== 'pending') {
      return NextResponse.json(
        { error: 'Challenge is no longer pending' },
        { status: 400 },
      )
    }

    // Check if challenge has expired
    if (new Date(challenge.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Challenge has expired' },
        { status: 400 },
      )
    }

    // If accepting, check if any matches have already started
    if (status === 'accepted') {
      const now = new Date()
      const hasStartedMatch = challenge.challenge_matches?.some((cm: any) => {
        const match = Array.isArray(cm.matches) ? cm.matches[0] : cm.matches
        return match && new Date(match.start_time) <= now
      })
      if (hasStartedMatch) {
        return NextResponse.json(
          {
            error:
              'Cannot accept challenge with matches that have already started',
          },
          { status: 400 },
        )
      }

      // Check if challenged user has enough points for stake
      if (challenge.stake_points > 0) {
        const { data: challengedUser, error: userError } = await supabase
          .from('users')
          .select('total_points')
          .eq('id', user.id)
          .single()

        if (
          userError ||
          !challengedUser ||
          challengedUser.total_points < challenge.stake_points
        ) {
          return NextResponse.json(
            { error: 'Insufficient points for stake' },
            { status: 400 },
          )
        }
      }
    }

    // Update challenge status
    const updateData: any = {
      status,
      ...(status === 'accepted'
        ? { accepted_at: new Date().toISOString() }
        : {}),
    }

    const { data: updatedChallenge, error: updateError } = await supabase
      .from('challenges')
      .update(updateData)
      .eq('id', challengeId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating challenge:', updateError)
      return NextResponse.json(
        { error: 'Failed to update challenge' },
        { status: 500 },
      )
    }

    // TODO: Send notification to challenger about the response

    return NextResponse.json({ challenge: updatedChallenge })
  } catch (error) {
    console.error('Error in PATCH /api/challenges/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

// DELETE - Cancel a challenge (only by challenger if still pending)
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

    // Fetch challenge
    const { data: challenge, error: fetchError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single()

    if (fetchError || !challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 },
      )
    }

    // Only the challenger can cancel
    if (challenge.challenger_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Can only cancel pending challenges
    if (challenge.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only cancel pending challenges' },
        { status: 400 },
      )
    }

    // Update status to cancelled
    const { error: updateError } = await supabase
      .from('challenges')
      .update({ status: 'cancelled' })
      .eq('id', challengeId)

    if (updateError) {
      console.error('Error cancelling challenge:', updateError)
      return NextResponse.json(
        { error: 'Failed to cancel challenge' },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/challenges/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
