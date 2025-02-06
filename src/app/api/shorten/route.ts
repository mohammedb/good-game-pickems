import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import { nanoid } from 'nanoid'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { url } = await request.json()
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    // Generate a short code
    const shortCode = nanoid(8) // 8 characters long

    // Store the URL in the database
    const { error } = await supabase.from('shortened_urls').insert({
      short_code: shortCode,
      long_url: url,
      created_at: new Date().toISOString(),
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
