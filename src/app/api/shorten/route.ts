import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import { nanoid } from 'nanoid'
import { z } from 'zod'

// URL validation schema
const urlSchema = z.object({
  url: z
    .string()
    .url()
    .max(2048) // Standard maximum URL length
    .refine(
      (url) => {
        try {
          const urlHost = new URL(url).host
          const appHost = new URL(process.env.NEXT_PUBLIC_APP_URL!).host
          return urlHost === appHost
        } catch {
          return false
        }
      },
      {
        message: 'Only internal URLs can be shortened',
      },
    ),
})

// Simple in-memory rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10
const rateLimitStore = new Map<string, { count: number; timestamp: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(ip)

  // Clean up old records
  if (record && now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitStore.delete(ip)
    return false
  }

  if (!record) {
    rateLimitStore.set(ip, { count: 1, timestamp: now })
    return false
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return true
  }

  record.count++
  return false
}

export async function POST(request: Request) {
  try {
    // Get client IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown'

    // Check rate limit
    if (isRateLimited(ip)) {
      return new Response(
        JSON.stringify({
          error: 'For mange forespørsler. Vennligst vent litt.',
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    const body = await request.json()

    // Validate input
    const result = urlSchema.safeParse(body)
    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'Ugyldig URL. Kun interne URLer kan forkortes.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    const { url } = result.data
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    // Set the app domain name for RLS policy
    const appHost = new URL(process.env.NEXT_PUBLIC_APP_URL!).host
    await supabase.rpc('set_config', {
      name: 'app.domain_name',
      value: appHost,
    })

    // Set the request IP for RLS policy
    await supabase.rpc('set_config', {
      name: 'request.ip',
      value: ip,
    })

    // Check if URL already exists
    const { data: existing, error: existingError } = await supabase
      .from('shortened_urls')
      .select('short_code')
      .eq('long_url', url)
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      // Not found error is ok
      console.error('Error checking existing URL:', existingError)
      return new Response(
        JSON.stringify({ error: 'Kunne ikke sjekke eksisterende URL' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    if (existing?.short_code) {
      return new Response(
        JSON.stringify({
          shortUrl: `${process.env.NEXT_PUBLIC_APP_URL}/s/${existing.short_code}`,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    // Generate a short code
    const shortCode = nanoid(8)

    // Store the URL in the database
    const { error } = await supabase.from('shortened_urls').insert({
      short_code: shortCode,
      long_url: url,
      ip_address: ip,
    })

    if (error) {
      console.error('Error storing shortened URL:', error)

      // Handle rate limit exceeded
      if (error.code === '23514') {
        // Check constraint violation
        return new Response(
          JSON.stringify({
            error: 'For mange forespørsler. Vennligst vent litt.',
          }),
          {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }

      return new Response(
        JSON.stringify({ error: 'Kunne ikke forkorte URL' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    // Return the shortened URL
    return new Response(
      JSON.stringify({
        shortUrl: `${process.env.NEXT_PUBLIC_APP_URL}/s/${shortCode}`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error in URL shortener:', error)
    return new Response(JSON.stringify({ error: 'Kunne ikke forkorte URL' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
