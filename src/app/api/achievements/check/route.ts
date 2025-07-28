import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/utils/supabase-server'
import { AchievementService } from '@/lib/achievements/service'
import type { AchievementTrigger } from '@/lib/achievements/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, trigger, context } = body

    // Verify the user is checking their own achievements
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate trigger
    const validTriggers: AchievementTrigger[] = [
      'prediction_made',
      'match_completed',
      'daily_check',
      'social_share',
      'profile_view',
    ]

    if (!validTriggers.includes(trigger)) {
      return NextResponse.json({ error: 'Invalid trigger' }, { status: 400 })
    }

    // Check achievements
    const achievementService = new AchievementService(supabase)
    const result = await achievementService.checkAchievements(
      userId,
      trigger,
      context,
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error checking achievements:', error)
    return NextResponse.json(
      { error: 'Failed to check achievements' },
      { status: 500 },
    )
  }
}
