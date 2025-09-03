import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/utils/supabase'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()

    // Delete old CS2 matches from division 12517 (old season)
    const { data: deletedOldDivision, error: oldDivError } = await supabase
      .from('matches')
      .delete()
      .eq('game_type', 'csgo')
      .eq('division_id', '12517')
      .select('id')

    // Delete CS2 matches from wrong divisions (gruppespill)
    const wrongDivisions = [
      '12904',
      '12911',
      '18366',
      '18367',
      '18368',
      '18369',
    ]
    const { data: deletedWrongDivisions, error: wrongDivError } = await supabase
      .from('matches')
      .delete()
      .eq('game_type', 'csgo')
      .in('division_id', wrongDivisions)
      .select('id')

    // Keep only 1. Divisjon (18324) for CS2

    return NextResponse.json({
      success: true,
      deleted: {
        oldDivision: deletedOldDivision?.length || 0,
        wrongDivisions: deletedWrongDivisions?.length || 0,
        total:
          (deletedOldDivision?.length || 0) +
          (deletedWrongDivisions?.length || 0),
      },
      errors: {
        oldDivision: oldDivError?.message,
        wrongDivisions: wrongDivError?.message,
      },
    })
  } catch (error) {
    console.error('Error cleaning up matches:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup matches' },
      { status: 500 },
    )
  }
}
