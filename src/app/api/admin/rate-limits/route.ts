import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'

// Get the rate limit stats from our in-memory stores
// Note: This is a simple implementation. In production, you'd want to use Redis or similar
export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

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

    // Import the rate limit counters
    const emailModule = await import('@/lib/email')
    const urlShortenerModule = await import('@/app/api/shorten/route')

    // Calculate URL shortener stats
    const urlShortenerStats = {
      activeUsers: urlShortenerModule.userRequests.size,
      rateLimitedUsers: Array.from(
        urlShortenerModule.userRequests.entries(),
      ).filter(
        ([_, record]: [string, { minuteCount: number; dayCount: number }]) =>
          record.minuteCount >= 5 || record.dayCount >= 100,
      ).length,
    }

    // Calculate email stats
    const emailStats = {
      emailsSentToday: emailModule.emailsSentToday,
      queuedEmails: emailModule.emailQueue.length,
      remainingDailyLimit: 100 - emailModule.emailsSentToday,
    }

    return NextResponse.json({
      urlShortener: urlShortenerStats,
      email: emailStats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching rate limit stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rate limit stats' },
      { status: 500 },
    )
  }
}
