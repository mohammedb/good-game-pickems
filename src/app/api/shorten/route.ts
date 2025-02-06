import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import { nanoid } from 'nanoid'
import { NextResponse } from 'next/server'

// Rate limiting configuration
const RATE_LIMIT = {
  REQUESTS_PER_MINUTE: 5,
  REQUESTS_PER_DAY: 100,
}

// Simple in-memory rate limiting
export const userRequests = new Map<
  string,
  { minuteCount: number; dayCount: number; lastReset: number }
>()

function checkRateLimit(userId: string): { allowed: boolean; error?: string } {
  const now = Date.now()
  const minute = 60 * 1000
  const day = 24 * 60 * minute

  // Get or initialize user's request counts
  let userRecord = userRequests.get(userId)
  if (!userRecord || now - userRecord.lastReset > day) {
    userRecord = { minuteCount: 0, dayCount: 0, lastReset: now }
  } else if (now - userRecord.lastReset > minute) {
    userRecord.minuteCount = 0
    userRecord.lastReset = now
  }

  // Check limits
  if (userRecord.dayCount >= RATE_LIMIT.REQUESTS_PER_DAY) {
    return {
      allowed: false,
      error: 'Daily rate limit exceeded. Please try again tomorrow.',
    }
  }
  if (userRecord.minuteCount >= RATE_LIMIT.REQUESTS_PER_MINUTE) {
    return {
      allowed: false,
      error: 'Too many requests. Please wait a minute and try again.',
    }
  }

  // Update counts
  userRecord.minuteCount++
  userRecord.dayCount++
  userRequests.set(userId, userRecord)

  return { allowed: true }
}

// Cleanup old entries periodically
setInterval(
  () => {
    const now = Date.now()
    const day = 24 * 60 * 60 * 1000
    // Convert Map entries to array before iterating
    Array.from(userRequests.entries()).forEach(([userId, record]) => {
      if (now - record.lastReset > day) {
        userRequests.delete(userId)
      }
    })
  },
  60 * 60 * 1000,
) // Clean up every hour

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    // Get the authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check rate limit
    const rateLimitCheck = checkRateLimit(user.id)
    if (!rateLimitCheck.allowed) {
      return NextResponse.json({ error: rateLimitCheck.error }, { status: 429 })
    }

    const { url } = await request.json()

    // Generate a short code
    const shortCode = nanoid(8) // 8 characters long

    // Store the URL in the database
    const { error } = await supabase.from('shortened_urls').insert({
      short_code: shortCode,
      long_url: url,
      created_at: new Date().toISOString(),
      user_id: user.id, // Track who created the shortened URL
    })

    if (error) {
      console.error('Error storing shortened URL:', error)
      return NextResponse.json(
        { error: 'Could not shorten URL' },
        { status: 500 },
      )
    }

    // Return the shortened URL
    return NextResponse.json({
      shortUrl: `${process.env.NEXT_PUBLIC_APP_URL}/s/${shortCode}`,
    })
  } catch (error) {
    console.error('Error in URL shortener:', error)
    return NextResponse.json(
      { error: 'Could not shorten URL' },
      { status: 500 },
    )
  }
}
