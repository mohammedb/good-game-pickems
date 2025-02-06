import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

type LogType = 'sync' | 'points' | 'user' | 'match' | 'error' | 'success'

interface DatabaseLog {
  id: string
  type: LogType
  message: string
  details: string | null
  created_at: string
  user_id: string | null
  user_email: string | null
}

interface FormattedLog {
  id: string
  type: LogType
  message: string
  timestamp: string
  user: string | undefined | null
  details: string | null
}

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated and admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!userData?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get URL parameters
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    // Build query
    const query = supabase.rpc('get_admin_logs', {
      search_query: search || '',
      type_filter: type !== 'all' ? type : null,
      from_date: null,
      to_date: null,
    })

    // Get logs
    const { data: logs, error: logsError } = await query

    if (logsError) {
      console.error('Supabase query error:', logsError)
      return NextResponse.json(
        { error: `Database error: ${logsError.message}` },
        { status: 500 },
      )
    }

    if (!logs) {
      return NextResponse.json([])
    }

    // Transform data
    const formattedLogs: FormattedLog[] = (logs as DatabaseLog[]).map(
      (log) => ({
        id: log.id,
        type: log.type,
        message: log.message,
        timestamp: log.created_at,
        user: log.user_email,
        details: log.details,
      }),
    )

    return NextResponse.json(formattedLogs)
  } catch (error) {
    console.error('Error fetching activity logs:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to fetch activity logs: ${errorMessage}` },
      { status: 500 },
    )
  }
}
