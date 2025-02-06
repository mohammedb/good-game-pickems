import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import { nanoid } from 'nanoid'
import { z } from 'zod'

// Function to normalize domain (remove www if present)
function normalizeDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    // Remove 'www.' from the beginning of the hostname if it exists
    return urlObj.hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

// URL validation schema
const urlSchema = z.object({
  url: z
    .string()
    .url()
    .max(2048) // Standard maximum URL length
    .refine(
      (url) => {
        try {
          // Get the base URL from environment
          const appUrl = process.env.NEXT_PUBLIC_APP_URL
          if (!appUrl) {
            console.error('NEXT_PUBLIC_APP_URL is not defined')
            return false
          }

          // Compare normalized domains
          const urlDomain = normalizeDomain(url)
          const appDomain = normalizeDomain(appUrl)

          return urlDomain === appDomain
        } catch (error) {
          console.error('URL validation error:', error)
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

    const body = await request.json()

    // Log the incoming request
    console.log('Incoming URL shortening request:', {
      ip,
      url: body.url,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      normalizedRequestDomain: normalizeDomain(body.url),
      normalizedAppDomain: normalizeDomain(
        process.env.NEXT_PUBLIC_APP_URL || '',
      ),
    })

    // Validate input
    const result = urlSchema.safeParse(body)
    if (!result.success) {
      console.error('URL validation failed:', result.error)
      return new Response(
        JSON.stringify({
          error: 'Ugyldig URL. Kun interne URLer kan forkortes.',
          details: result.error.errors.map((e) => e.message),
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
    const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL!)
    await supabase.rpc('set_config', {
      name: 'app.domain_name',
      value: normalizeDomain(appUrl.toString()),
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
    return new Response(
      JSON.stringify({
        error: 'Kunne ikke forkorte URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}
