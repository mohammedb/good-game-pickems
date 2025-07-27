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

// PATCH /api/admin/seasons/[id] - Update a season
export async function PATCH(
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
    const { name, start_date, end_date } = body

    // Build update object
    const updates: any = { updated_at: new Date().toISOString() }
    if (name !== undefined) updates.name = name
    if (start_date !== undefined) updates.start_date = start_date
    if (end_date !== undefined) updates.end_date = end_date

    // Update the season
    const { data, error } = await supabase
      .from('seasons')
      .update(updates)
      .eq('season_id', seasonId)
      .select()
      .single()

    if (error) {
      console.error('Error updating season:', error)
      return NextResponse.json(
        { error: 'Failed to update season' },
        { status: 500 },
      )
    }

    if (!data) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 })
    }

    // Log the action
    await addAdminLog(
      'success',
      `Updated season: ${data.name}`,
      `Season ID: ${seasonId}, Updates: ${JSON.stringify(body)}`,
    )

    // Log to season audit
    await supabase.rpc('log_season_action', {
      p_season_id: seasonId,
      p_action: 'updated',
      p_details: body,
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PATCH /api/admin/seasons/[id]:', error)
    await addAdminLog(
      'error',
      'Failed to update season',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

// DELETE /api/admin/seasons/[id] - Delete a season
export async function DELETE(
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

    // Check if season can be deleted
    const { data: canDelete, error: checkError } = await supabase.rpc(
      'can_delete_season',
      { season_id_param: seasonId },
    )

    if (checkError) {
      console.error('Error checking if season can be deleted:', checkError)
      return NextResponse.json(
        { error: 'Failed to check season status' },
        { status: 500 },
      )
    }

    if (!canDelete.can_delete) {
      return NextResponse.json({ error: canDelete.reason }, { status: 400 })
    }

    // Get season details before deletion
    const { data: season } = await supabase
      .from('seasons')
      .select('name')
      .eq('season_id', seasonId)
      .single()

    // Delete the season
    const { error: deleteError } = await supabase
      .from('seasons')
      .delete()
      .eq('season_id', seasonId)

    if (deleteError) {
      console.error('Error deleting season:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete season' },
        { status: 500 },
      )
    }

    // Log the action
    await addAdminLog(
      'success',
      `Deleted season: ${season?.name || seasonId}`,
      `Season ID: ${seasonId}`,
    )

    return NextResponse.json({
      success: true,
      message: 'Season deleted successfully',
    })
  } catch (error) {
    console.error('Error in DELETE /api/admin/seasons/[id]:', error)
    await addAdminLog(
      'error',
      'Failed to delete season',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
