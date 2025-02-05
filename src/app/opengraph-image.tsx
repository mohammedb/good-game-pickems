import { ImageResponse } from 'next/og'
import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'

export const runtime = 'edge'
export const alt = 'Good Game Pickems'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { data: stats, count } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <h1
            style={{
              fontSize: 60,
              fontWeight: 800,
              background: 'linear-gradient(to bottom right, #000000, #4A5568)',
              backgroundClip: 'text',
              color: 'transparent',
              lineHeight: 1.2,
              margin: 0,
              marginBottom: 20,
            }}
          >
            Good Game Pickems
          </h1>
          <p
            style={{
              fontSize: 30,
              margin: 0,
              color: '#4A5568',
            }}
          >
            Join {count || 0} players predicting CS:GO matches
          </p>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
} 