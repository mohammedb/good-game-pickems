import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/utils/supabase'
import { syncMatches } from '@/utils/goodgame'
import { validateRequestBody, schemas } from '@/lib/api-validation'
import { z } from 'zod'

export const maxDuration = 60 // Maximum allowed duration for Vercel Hobby plan

// Schema for cron request body
const cronSyncSchema = z.object({
  gameTypes: z.array(schemas.gameType).optional(),
})

export async function POST(request: NextRequest) {
  try {
    // For local development, skip auth check
    // In production, verify the cron secret
    if (process.env.NODE_ENV === 'production') {
      const authHeader = request.headers.get('authorization')
      const expectedToken = `Bearer ${process.env.CRON_SECRET_KEY}`

      if (authHeader !== expectedToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Use service role client for cron operations (bypasses RLS)
    const supabase = createServiceRoleClient()

    // Validate request body
    const { data: body, error } = await validateRequestBody(
      request,
      cronSyncSchema,
    )
    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }

    const gameTypes = body?.gameTypes || ['csgo', 'lol', 'valorant'] // Default to all three games

    const result = await syncMatches(supabase, undefined, gameTypes)

    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in sync-matches cron:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync matches',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
