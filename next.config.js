const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})
const { createSecureHeaders } = require('next-secure-headers')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['i.bo3.no'], // Allow images from Good Game Ligaen
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: createSecureHeaders({
          contentSecurityPolicy: {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: [
                "'self'",
                "'unsafe-inline'", // Required for Next.js
                "'unsafe-eval'", // Required for Next.js
                // Google Analytics and Tag Manager (placeholders)
                'https://www.googletagmanager.com',
                'https://www.google-analytics.com',
                // Supabase
                'https://*.supabase.co',
                // Vercel Analytics
                'https://*.vercel-scripts.com',
                'https://*.vercel-insights.com',
                'https://va.vercel-scripts.com',
              ],
              styleSrc: [
                "'self'",
                "'unsafe-inline'", // Required for Shadcn UI and Next.js
              ],
              imgSrc: [
                "'self'",
                'data:',
                'blob:',
                'https:', // Allow HTTPS images
                'https://i.bo3.no',
                'https://*.supabase.co',
                'https://www.google-analytics.com',
                'https://*.vercel-scripts.com',
              ],
              connectSrc: [
                "'self'",
                'https://*.supabase.co',
                'https://www.gamer.no',
                'https://www.google-analytics.com',
                // Vercel Analytics
                'https://*.vercel-scripts.com',
                'https://*.vercel-insights.com',
                'https://va.vercel-scripts.com',
                process.env.NODE_ENV === 'development' ? 'ws:' : null, // Allow WebSocket in development
              ].filter(Boolean),
              fontSrc: ["'self'", 'data:', 'https:'],
              objectSrc: ["'none'"],
              mediaSrc: ["'self'"],
              frameSrc: ["'self'", 'https://*.supabase.co'],
              workerSrc: [
                "'self'",
                'blob:',
                "'unsafe-inline'", // Required for Next.js
              ],
              manifestSrc: ["'self'"],
              baseUri: ["'self'"],
              formAction: ["'self'"],
              reportUri: '/api/csp-report',
            },
          },
          // Enable other security headers with safe defaults
          forceHTTPSRedirect:
            process.env.NODE_ENV === 'production'
              ? [true, { maxAge: 60 * 60 * 24 * 365, includeSubDomains: true }]
              : null,
          referrerPolicy: 'strict-origin-when-cross-origin',
          xssProtection: 'block-rendering',
          frameGuard: false, // Disable frameGuard as it might conflict with Supabase auth
        }),
      },
    ]
  },
}

module.exports = withBundleAnalyzer(nextConfig)
