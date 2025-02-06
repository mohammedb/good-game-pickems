import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { code: string } },
) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    // Look up the short code
    const { data, error } = await supabase
      .from('shortened_urls')
      .select('long_url')
      .eq('short_code', params.code)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 })
    }

    // Redirect to the long URL
    return NextResponse.redirect(data.long_url)
  } catch (error) {
    console.error('Error in URL redirect:', error)
    return NextResponse.json(
      { error: 'Error processing redirect' },
      { status: 500 },
    )
  }
}
