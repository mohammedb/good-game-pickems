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

// GET /api/admin/seasons - List all seasons with statistics
export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()

    // Check if user is authenticated and is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all seasons with statistics
    const { data: seasons, error } = await supabase.rpc('get_season_stats')

    if (error) {
      console.error('Error fetching seasons:', error)
      return NextResponse.json(
        { error: 'Failed to fetch seasons' },
        { status: 500 },
      )
    }

    return NextResponse.json(seasons || [])
  } catch (error) {
    console.error('Error in GET /api/admin/seasons:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

// POST /api/admin/seasons - Create a new season
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()

    // Check if user is authenticated and is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { season_id, name, start_date, end_date, activate } = body

    // Validate required fields
    if (!season_id || !name || !start_date) {
      return NextResponse.json(
        { error: 'Season ID, name, and start date are required' },
        { status: 400 },
      )
    }

    // Create the season
    const { data: result, error } = await supabase.rpc('create_season', {
      p_season_id: season_id,
      p_name: name,
      p_start_date: start_date,
      p_end_date: end_date || null,
      p_activate: activate || false,
    })

    if (error) {
      console.error('Error creating season:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to create season' },
        { status: 500 },
      )
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Log the action
    await addAdminLog(
      'success',
      `Created season: ${name}`,
      `Season ID: ${season_id}, Activated: ${activate || false}`,
    )

    return NextResponse.json({
      success: true,
      season_id: result.season_id,
      id: result.id,
      activated: result.activated,
    })
  } catch (error) {
    console.error('Error in POST /api/admin/seasons:', error)
    await addAdminLog(
      'error',
      'Failed to create season',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
