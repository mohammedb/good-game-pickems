import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { eachDayOfInterval, subDays, format } from 'date-fns'

export async function GET() {
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

    // Get the date range (last 30 days)
    const endDate = new Date()
    const startDate = subDays(endDate, 30)
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate })

    // Get user signups per day
    const { data: signUps } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    // Get predictions per day
    const { data: predictions } = await supabase
      .from('picks')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    // Process data into daily counts
    const activityData = dateRange.map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd')
      return {
        date: dateStr,
        signUps:
          signUps?.filter(
            (signup) =>
              format(new Date(signup.created_at), 'yyyy-MM-dd') === dateStr,
          ).length || 0,
        predictions:
          predictions?.filter(
            (prediction) =>
              format(new Date(prediction.created_at), 'yyyy-MM-dd') === dateStr,
          ).length || 0,
      }
    })

    return NextResponse.json(activityData)
  } catch (error) {
    console.error('Error fetching activity data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity data' },
      { status: 500 },
    )
  }
}
