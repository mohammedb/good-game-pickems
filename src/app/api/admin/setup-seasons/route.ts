import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/utils/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()

    // Create the seasons for each game (without game_type for now)
    const seasons = [
      {
        season_id: '13599',
        name: 'Good Game CS2 - Høsten 2025',
        start_date: new Date('2025-08-01'),
        end_date: new Date('2025-12-31'),
        is_active: true,
      },
      {
        season_id: '13600',
        name: 'Good Game LoL - Høsten 2025',
        start_date: new Date('2025-08-01'),
        end_date: new Date('2025-12-31'),
        is_active: true,
      },
      {
        season_id: '13601',
        name: 'Good Game Valorant - Høsten 2025',
        start_date: new Date('2025-08-01'),
        end_date: new Date('2025-12-31'),
        is_active: true,
      },
    ]

    // Deactivate old seasons
    await supabase
      .from('seasons')
      .update({ is_active: false })
      .in('season_id', ['13162'])

    // Insert or update the new seasons
    const { data, error } = await supabase
      .from('seasons')
      .upsert(seasons, {
        onConflict: 'season_id',
        ignoreDuplicates: false,
      })
      .select()

    if (error) {
      console.error('Error creating seasons:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      seasons: data,
      message: 'Seasons created successfully for all game types',
    })
  } catch (error) {
    console.error('Error in setup-seasons:', error)
    return NextResponse.json(
      { error: 'Failed to setup seasons' },
      { status: 500 },
    )
  }
}
