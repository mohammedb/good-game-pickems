import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import { syncMatches } from '@/utils/goodgame'

export const maxDuration = 60 // Maximum allowed duration for Vercel Hobby plan

export async function POST(request: Request) {
  try {
    // Verify the request is from a trusted source
    const authHeader = request.headers.get('authorization')
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // const cookieStore = cookies() - removed in Next.js 15
    const supabase = await createServerClient()

    // Parse request body to get game types if provided
    const body = await request.json().catch(() => ({}))
    const gameTypes = body.gameTypes || ['csgo', 'lol'] // Default to both games

    const result = await syncMatches(supabase, undefined, gameTypes)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in sync-matches cron:', error)
    return NextResponse.json(
      { error: 'Failed to sync matches' },
      { status: 500 },
    )
  }
}
