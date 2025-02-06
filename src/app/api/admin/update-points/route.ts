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

    // Get unprocessed matches
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('id')
      .eq('is_finished', true)
      .eq('points_processed', false)

    if (matchesError) {
      throw matchesError
    }

    if (!matches || matches.length === 0) {
      return NextResponse.json({
        message: 'No matches to process',
        processed_matches: 0,
        processed_picks: 0,
      })
    }

    // Update points for each match
    const updates = matches.map((match) =>
      supabase.rpc('update_match_points', { match_id_param: match.id }),
    )

    await Promise.all(updates)

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
      `Processed ${processedPicks || 0} picks`,
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
