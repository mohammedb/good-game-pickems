import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import { syncMatches } from '@/utils/goodgame'

async function isAdmin(userId: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)
  
  const { data } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .single()
  
  return data?.is_admin === true
}

// GET endpoint to check sync status
export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)
    
    // Check if user is authenticated and is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get latest sync info
    const { data: latestSync } = await supabase
      .from('sync_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // First, check if we have any matches at all
    const { count: totalMatches } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })

    // If we have no matches, we should sync
    if (totalMatches === 0) {
      return NextResponse.json({
        last_sync: latestSync?.created_at || null,
        pending_matches: 1, // Indicate that we need to sync
        last_sync_matches: latestSync?.matches_synced || 0,
        needs_initial_sync: true
      })
    }

    // Get count of matches that need to be synced
    const now = new Date().toISOString()
    const { count: pendingMatches } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .or(`start_time.gt.${now},and(is_finished.eq.false,start_time.lt.${now})`)

    return NextResponse.json({
      last_sync: latestSync?.created_at || null,
      pending_matches: pendingMatches || 0,
      last_sync_matches: latestSync?.matches_synced || 0,
      needs_initial_sync: false
    })
  } catch (error) {
    console.error('Error checking sync status:', error)
    return NextResponse.json(
      { error: 'Failed to check sync status' },
      { status: 500 }
    )
  }
}

// POST endpoint to trigger sync
export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)
    
    // Check if user is authenticated and is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !(await isAdmin(user.id))) {
      console.error('Unauthorized sync attempt:', { userId: user?.id })
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Starting sync process...', {
      userId: user.id,
      timestamp: new Date().toISOString()
    })

    const result = await syncMatches(supabase)

    console.log('Sync completed:', {
      userId: user.id,
      matchesSynced: result.synced_matches,
      timestamp: new Date().toISOString()
    })

    // Update sync log with user info
    const { error: logError } = await supabase
      .from('sync_logs')
      .insert({
        synced_by: user.id,
        matches_synced: result.synced_matches
      })

    if (logError) {
      console.error('Error logging sync:', logError)
      // Continue since the sync was successful
    }

    return NextResponse.json({
      message: 'Sync completed successfully',
      timestamp: new Date().toISOString(),
      ...result
    })
  } catch (error) {
    console.error('Error in sync:', error)
    
    // Try to get more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('Detailed sync error:', {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(
      { 
        error: 'Failed to sync matches',
        details: errorMessage
      },
      { status: 500 }
    )
  }
} 