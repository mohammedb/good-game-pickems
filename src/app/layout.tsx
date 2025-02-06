import { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import '@/styles/animations.css'
import RootLayoutClient from '@/components/RootLayoutClient'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GGWP.NO',
  description: 'Tipp på CS2 kamper i Good Game Ligaen',
  openGraph: {
    title: 'GGWP.NO - Pickems',
    description: 'Tipp på CS2 kamper i Good Game Ligaen',
    type: 'website',
    url: 'https://ggwp.no',
    siteName: 'GGWP.NO',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GGWP.NO - Pickems',
    description: 'Tipp på CS2 kamper i Good Game Ligaen',
  },
  icons: {
    icon: [
      {
        url: '/icon',
        type: 'image/png',
      },
    ],
    apple: [
      {
        url: '/apple-icon',
        type: 'image/png',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <RootLayoutClient>{children}</RootLayoutClient>
        <SpeedInsights />
      </body>
    </html>
  )
}
