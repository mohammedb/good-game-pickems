import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import { addAdminLog } from '@/lib/admin-logs'

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    // Check if user is authenticated and admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!userData?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First, let's check if we need to reset any matches that were marked as processed but didn't get points
    const { data: processedMatches } = await supabase
      .from('matches')
      .select(
        `
        id,
        gg_ligaen_api_id,
        winner_id,
        is_finished,
        points_processed,
        team1,
        team2
      `,
      )
      .eq('is_finished', true)
      .eq('points_processed', true)
      .not('winner_id', 'is', null)

    if (processedMatches) {
      for (const match of processedMatches) {
        // Check if this match has any picks with points
        const { data: picks } = await supabase
          .from('picks')
          .select('points_awarded')
          .eq('match_id', match.id)
          .not('points_awarded', 'eq', 0)

        // If no picks have points but the match is marked as processed, reset it
        if (!picks || picks.length === 0) {
          console.log(
            `Resetting points_processed for match ${match.gg_ligaen_api_id} (${match.team1} vs ${match.team2})`,
          )
          await supabase
            .from('matches')
            .update({ points_processed: false })
            .eq('id', match.id)
        }
      }
    }

    // Now get all unprocessed matches that have winners
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select(
        'id, gg_ligaen_api_id, winner_id, team1_id, team2_id, team1, team2, is_finished',
      )
      .eq('is_finished', true)
      .eq('points_processed', false)
      .not('winner_id', 'is', null)

    if (matchesError) {
      throw matchesError
    }

    if (!matches || matches.length === 0) {
      console.log('No matches to process after reset check')
      return NextResponse.json({
        message: 'No matches to process',
        processed_matches: 0,
        processed_picks: 0,
      })
    }

    console.log(`Found ${matches.length} matches to process:`, matches)

    // Process each match
    for (const match of matches) {
      try {
        console.log(
          `\nProcessing match ${match.gg_ligaen_api_id} (${match.team1} vs ${match.team2}):`,
          {
            winner_id: match.winner_id,
            team1: match.team1,
            team2: match.team2,
            is_finished: match.is_finished,
          },
        )

        // Get picks for this match before processing
        const { data: beforePicks } = await supabase
          .from('picks')
          .select('id, user_id, predicted_winner, points_awarded, is_correct')
          .eq('match_id', match.id)

        console.log('Picks before processing:', beforePicks)

        // Update points for the match
        const { data: updateResult, error: updateError } = await supabase.rpc(
          'update_match_points',
          { match_id_param: match.id },
        )

        if (updateError) {
          console.error('Error in update_match_points:', updateError)
          continue
        }

        console.log('update_match_points result:', updateResult)

        // Get picks after processing to verify changes
        const { data: afterPicks } = await supabase
          .from('picks')
          .select('id, user_id, predicted_winner, points_awarded, is_correct')
          .eq('match_id', match.id)

        console.log('Picks after processing:', afterPicks)

        // Only mark as processed if points were actually awarded
        if (afterPicks && afterPicks.some((pick) => pick.points_awarded > 0)) {
          await supabase
            .from('matches')
            .update({ points_processed: true })
            .eq('id', match.id)

          console.log(`Marked match ${match.gg_ligaen_api_id} as processed`)
        } else {
          console.log(
            `Match ${match.gg_ligaen_api_id} had no valid picks, keeping unprocessed`,
          )
        }
      } catch (error) {
        console.error(`Error processing points for match ${match.id}:`, error)
      }
    }

    // Update user total points and rankings
    try {
      const { data: beforePoints } = await supabase
        .from('users')
        .select('id, username, total_points')
        .order('total_points', { ascending: false })

      console.log('User points before update:', beforePoints)

      const { error: updateError } = await supabase.rpc(
        'update_user_total_points',
      )
      if (updateError) {
        console.error('Error in update_user_total_points:', updateError)
      }

      const { data: afterPoints } = await supabase
        .from('users')
        .select('id, username, total_points')
        .order('total_points', { ascending: false })

      console.log('User points after update:', afterPoints)
    } catch (error) {
      console.error('Error updating user rankings:', error)
    }

    // Get count of processed picks
    const { count: processedPicks } = await supabase
      .from('picks')
      .select('*', { count: 'exact', head: true })
      .in(
        'match_id',
        matches.map((m) => m.id),
      )

    // Log the action
    await addAdminLog(
      'points',
      `Updated points for ${matches.length} matches`,
      `Processed ${processedPicks || 0} picks for admin user ${user.id}`,
    )

    return NextResponse.json({
      message: 'Points updated successfully',
      processed_matches: matches.length,
      processed_picks: processedPicks || 0,
    })
  } catch (error) {
    console.error('Error updating points:', error)
    return NextResponse.json(
      { error: 'Failed to update points' },
      { status: 500 },
    )
  }
}
