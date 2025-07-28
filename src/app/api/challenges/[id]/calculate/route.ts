import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/utils/supabase-server'

// POST - Calculate challenge results after all matches are completed
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createServerClient()

    const challengeId = params.id

    // Check if all matches in the challenge are completed
    const { data: isComplete, error: checkError } = await supabase.rpc(
      'check_challenge_completion',
      { challenge_id_param: challengeId },
    )

    if (checkError) {
      console.error('Error checking challenge completion:', checkError)
      return NextResponse.json(
        { error: 'Failed to check challenge completion' },
        { status: 500 },
      )
    }

    if (!isComplete) {
      return NextResponse.json(
        { error: 'Not all matches in the challenge are completed' },
        { status: 400 },
      )
    }

    // Update challenge picks with correct/incorrect status
    const { data: challengeMatches, error: matchesError } = await supabase
      .from('challenge_matches')
      .select(
        `
        match_id,
        matches(id, winner_id)
      `,
      )
      .eq('challenge_id', challengeId)

    if (matchesError || !challengeMatches) {
      console.error('Error fetching challenge matches:', matchesError)
      return NextResponse.json(
        { error: 'Failed to fetch challenge matches' },
        { status: 500 },
      )
    }

    // Update is_correct for all picks based on match results
    for (const cm of challengeMatches) {
      // Check if matches exists and has data
      const match = Array.isArray(cm.matches) ? cm.matches[0] : cm.matches
      if (match && match.winner_id) {
        // Get all picks for this match in this challenge
        const { data: picks } = await supabase
          .from('challenge_picks')
          .select('id, predicted_winner')
          .eq('challenge_id', challengeId)
          .eq('match_id', cm.match_id)

        // Update each pick's is_correct status
        if (picks) {
          for (const pick of picks) {
            await supabase
              .from('challenge_picks')
              .update({
                is_correct: pick.predicted_winner === match.winner_id,
              })
              .eq('id', pick.id)
          }
        }
      }
    }

    // Calculate challenge results using the database function
    const { error: calculateError } = await supabase.rpc(
      'calculate_challenge_results',
      { challenge_id_param: challengeId },
    )

    if (calculateError) {
      console.error('Error calculating challenge results:', calculateError)
      return NextResponse.json(
        { error: 'Failed to calculate challenge results' },
        { status: 500 },
      )
    }

    // Fetch the updated challenge
    const { data: challenge, error: fetchError } = await supabase
      .from('challenges')
      .select(
        `
        *,
        challenger:users!challenges_challenger_id_fkey(
          id, username, challenge_wins, challenge_losses, challenge_draws
        ),
        challenged:users!challenges_challenged_id_fkey(
          id, username, challenge_wins, challenge_losses, challenge_draws
        ),
        winner:users!challenges_winner_id_fkey(id, username)
      `,
      )
      .eq('id', challengeId)
      .single()

    if (fetchError || !challenge) {
      return NextResponse.json(
        { error: 'Failed to fetch updated challenge' },
        { status: 500 },
      )
    }

    // TODO: Send notifications to both users about the results

    return NextResponse.json({ challenge })
  } catch (error) {
    console.error('Error in POST /api/challenges/[id]/calculate:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
