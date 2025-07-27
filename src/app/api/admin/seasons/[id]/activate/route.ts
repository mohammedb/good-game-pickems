import { NextResponse } from 'next/server'
import { createServerClient } from '@/utils/supabase'
import { addAdminLog } from '@/lib/admin-logs'

async function isAdmin(userId: string) {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .single()
  return data?.is_admin === true
}

// POST /api/admin/seasons/[id]/activate - Activate a specific season
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createServerClient()

    // Check if user is authenticated and is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const seasonId = params.id

    // Get season details first
    const { data: season } = await supabase
      .from('seasons')
      .select('name, is_active')
      .eq('season_id', seasonId)
      .single()

    if (!season) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 })
    }

    if (season.is_active) {
      return NextResponse.json(
        { error: 'Season is already active' },
        { status: 400 },
      )
    }

    // Activate the season
    const { data: result, error } = await supabase.rpc('activate_season', {
      season_id_param: seasonId,
    })

    if (error) {
      console.error('Error activating season:', error)
      return NextResponse.json(
        { error: 'Failed to activate season' },
        { status: 500 },
      )
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Log the action
    await addAdminLog(
      'success',
      `Activated season: ${season.name}`,
      `Season ID: ${seasonId}, Deactivated ${result.deactivated_count} other seasons`,
    )

    return NextResponse.json({
      success: true,
      activated_season: result.activated_season,
      deactivated_count: result.deactivated_count,
    })
  } catch (error) {
    console.error('Error in POST /api/admin/seasons/[id]/activate:', error)
    await addAdminLog(
      'error',
      'Failed to activate season',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

// POST /api/admin/seasons/[id]/end - End a season with a specific date
export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createServerClient()

    // Check if user is authenticated and is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const seasonId = params.id
    const body = await request.json()
    const { end_date } = body

    // End the season
    const { data: result, error } = await supabase.rpc('end_season', {
      season_id_param: seasonId,
      end_date_param: end_date || new Date().toISOString(),
    })

    if (error) {
      console.error('Error ending season:', error)
      return NextResponse.json(
        { error: 'Failed to end season' },
        { status: 500 },
      )
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Log the action
    await addAdminLog(
      'success',
      `Ended season: ${result.season.name}`,
      `Season ID: ${seasonId}, End date: ${result.season.end_date}`,
    )

    return NextResponse.json({
      success: true,
      season: result.season,
    })
  } catch (error) {
    console.error('Error in PUT /api/admin/seasons/[id]/end:', error)
    await addAdminLog(
      'error',
      'Failed to end season',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
