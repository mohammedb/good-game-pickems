import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/utils/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()

    // Check for January 2025 matches
    const { data: januaryMatches, error: janError } = await supabase
      .from('matches')
      .select('id, team1, team2, start_time, division_id, game_type')
      .gte('start_time', '2025-01-01')
      .lte('start_time', '2025-01-31')
      .order('start_time')

    // Check CS2 matches with wrong divisions
    const { data: cs2Matches, error: cs2Error } = await supabase
      .from('matches')
      .select('id, team1, team2, start_time, division_id, game_type')
      .eq('game_type', 'csgo')
      .not('division_id', 'eq', '18324') // Not 1. Divisjon
      .limit(10)

    // Get division counts for CS2
    const { data: divisionCounts, error: divError } = await supabase
      .from('matches')
      .select('division_id, game_type')
      .eq('game_type', 'csgo')

    const divisionSummary = divisionCounts?.reduce((acc: any, match: any) => {
      acc[match.division_id] = (acc[match.division_id] || 0) + 1
      return acc
    }, {})

    return NextResponse.json({
      januaryMatches: januaryMatches || [],
      januaryCount: januaryMatches?.length || 0,
      cs2WrongDivision: cs2Matches || [],
      cs2WrongDivisionCount: cs2Matches?.length || 0,
      cs2DivisionSummary: divisionSummary || {},
      errors: {
        january: janError?.message,
        cs2: cs2Error?.message,
        divisions: divError?.message,
      },
    })
  } catch (error) {
    console.error('Error checking matches:', error)
    return NextResponse.json(
      { error: 'Failed to check matches' },
      { status: 500 },
    )
  }
}
