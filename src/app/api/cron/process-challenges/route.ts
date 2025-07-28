import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/utils/supabase-server'

export async function GET(request: NextRequest) {
  try {
    // Verify this is a valid cron request
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceRoleClient()

    // Auto-decline expired challenges
    const { error: declineError } = await supabase.rpc(
      'auto_decline_expired_challenges',
    )

    if (declineError) {
      console.error('Error auto-declining challenges:', declineError)
    }

    // Find accepted challenges where all matches are completed
    const { data: completedChallenges, error: fetchError } = await supabase
      .from('challenges')
      .select('id')
      .eq('status', 'accepted')

    if (fetchError) {
      console.error('Error fetching challenges:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch challenges' },
        { status: 500 },
      )
    }

    let processedCount = 0

    // Process each challenge
    for (const challenge of completedChallenges || []) {
      // Check if all matches are completed
      const { data: isComplete, error: checkError } = await supabase.rpc(
        'check_challenge_completion',
        { challenge_id_param: challenge.id },
      )

      if (checkError || !isComplete) {
        continue
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
        .eq('challenge_id', challenge.id)

      if (matchesError || !challengeMatches) {
        continue
      }

      // Update is_correct for all picks
      for (const cm of challengeMatches) {
        const match = Array.isArray(cm.matches) ? cm.matches[0] : cm.matches
        if (match && match.winner_id) {
          // Get all picks for this match in this challenge
          const { data: picks } = await supabase
            .from('challenge_picks')
            .select('id, predicted_winner')
            .eq('challenge_id', challenge.id)
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

      // Calculate results
      const { error: calculateError } = await supabase.rpc(
        'calculate_challenge_results',
        { challenge_id_param: challenge.id },
      )

      if (!calculateError) {
        processedCount++
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
      message: `Processed ${processedCount} completed challenges`,
    })
  } catch (error) {
    console.error('Error in process-challenges cron:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
