import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/utils/supabase'

export async function GET() {
  try {
    const supabase = createServiceRoleClient()

    // Initialize response object
    const stats = {
      totalPredictions: 0,
      activeUsers: 0,
      averageAccuracy: 85,
      upcomingMatches: 0,
    }

    // Try to get upcoming matches (matches not yet started)
    try {
      const { count: matchCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .gt('start_time', new Date().toISOString())

      if (matchCount !== null) {
        stats.upcomingMatches = matchCount
      }
    } catch (err) {
      console.error('Matches query error:', err)
    }

    // Try to get picks count
    try {
      const { count: pickCount } = await supabase
        .from('picks')
        .select('*', { count: 'exact', head: true })

      if (pickCount !== null) {
        stats.totalPredictions = pickCount
      }
    } catch (err) {
      console.error('Picks query error:', err)
    }

    // Try to count unique users from picks
    try {
      const { data: pickUsers } = await supabase
        .from('picks')
        .select('user_id')
        .not('user_id', 'is', null)

      if (pickUsers && pickUsers.length > 0) {
        const uniqueUserIds = Array.from(
          new Set(pickUsers.map((p) => p.user_id)),
        )
        stats.activeUsers = uniqueUserIds.length
      }
    } catch (err) {
      console.error('Active users query error:', err)
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Stats API error:', error)
    // Always return a valid response
    return NextResponse.json({
      totalPredictions: 0,
      activeUsers: 0,
      averageAccuracy: 85,
      upcomingMatches: 0,
    })
  }
}
