import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/utils/supabase'

export async function middleware(request: NextRequest) {
  try {
    // This `try/catch` block is only here for the interactive tutorial.
    // Feel free to remove once you have Supabase connected.
    const { supabase, response } = createMiddlewareClient(request)

    // Refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-session-with-middleware
    await supabase.auth.getSession()

    // Add security headers
    const secureHeaders = new Headers(response.headers)

    // Security headers
    secureHeaders.set('X-Content-Type-Options', 'nosniff')
    secureHeaders.set('X-Frame-Options', 'SAMEORIGIN') // Using SAMEORIGIN since you're using Supabase Auth UI
    secureHeaders.set('X-XSS-Protection', '1; mode=block')

    // Only add HSTS in production and if we're on HTTPS
    if (
      process.env.NODE_ENV === 'production' &&
      request.url.startsWith('https')
    ) {
      secureHeaders.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload',
      )
    }

    secureHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin')

    // Create a new response with the security headers
    const secureResponse = new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: secureHeaders,
    })

    return secureResponse
  } catch (e) {
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    // Check out http://localhost:3000 for Next Steps.
    const response = NextResponse.next({
      request: { headers: request.headers },
    })

    // Add security headers even if Supabase fails
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
    response.headers.set('X-XSS-Protection', '1; mode=block')

    if (
      process.env.NODE_ENV === 'production' &&
      request.url.startsWith('https')
    ) {
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload',
      )
    }

    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - reset-password (password reset routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|reset-password).*)',
  ],
}
