import { ImageResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'

export const runtime = 'edge'

export const alt = 'Good Game Pickems'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image({ 
  params,
  searchParams,
}: { 
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  try {
    // Get user data if user param is present
    const userId = searchParams.user as string
    let userData = null

    if (userId) {
      const cookieStore = cookies()
      const supabase = createServerClient(cookieStore)
      
      const { data: picks } = await supabase
        .from('picks')
        .select('is_correct')
        .eq('user_id', userId)
      
      if (picks) {
        const totalPicks = picks.length
        const correctPicks = picks.filter(pick => pick.is_correct).length
        const accuracy = ((correctPicks / totalPicks) * 100).toFixed(1)
        
        userData = {
          totalPicks,
          correctPicks,
          accuracy
        }
      }
    }

    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(to bottom right, #1a1b1e, #2d2e32)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'sans-serif',
            color: 'white',
            padding: '40px',
          }}
        >
          <div
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              marginBottom: '20px',
            }}
          >
            Good Game Pickems
          </div>
          
          {userData ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '32px' }}>
                {userData.correctPicks} correct predictions
              </div>
              <div style={{ fontSize: '24px', opacity: 0.8 }}>
                out of {userData.totalPicks} picks ({userData.accuracy}% accuracy)
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '32px', opacity: 0.8 }}>
              Make your predictions and compete with others!
            </div>
          )}
        </div>
      ),
      {
        ...size,
        fonts: [
          {
            name: 'sans-serif',
            data: await fetch(
              new URL('/fonts/inter-var.ttf', import.meta.url)
            ).then((res) => res.arrayBuffer()),
            style: 'normal',
          },
        ],
      }
    )
  } catch (e) {
    console.error('Error generating OG image:', e)
    return new Response('Failed to generate image', { status: 500 })
  }
} 