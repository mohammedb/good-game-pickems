import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import { redirect } from 'next/navigation'

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

    if (error) {
      console.error('Error looking up shortened URL:', error)
      if (error.code === 'PGRST116') {
        // Not found
        return new Response('URL ikke funnet', { status: 404 })
      }
      return new Response('Feil ved behandling av forespørsel', { status: 500 })
    }

    if (!data || !data.long_url) {
      return new Response('URL ikke funnet', { status: 404 })
    }

    // Redirect to the long URL
    return Response.redirect(data.long_url)
  } catch (error) {
    console.error('Error in URL redirect:', error)
    return new Response('Feil ved behandling av forespørsel', { status: 500 })
  }
}
