import { ImageResponse } from 'next/og'
import { createServerClient } from '@/utils/supabase-server'

export const runtime = 'edge'
export const alt = 'GGWP.no Predictions'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

interface Props {
  params: { id: string }
}

export default async function Image({ params }: Props) {
  try {
    const supabase = await createServerClient()

    // Fetch the shared prediction
    const { data: prediction } = await supabase
      .from('shared_predictions')
      .select('*')
      .eq('id', params.id)
      .single()

    if (!prediction) {
      return new ImageResponse(
        (
          <div
            style={{
              background: 'linear-gradient(to bottom right, #000000, #1a1a1a)',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              color: 'white',
              fontFamily: 'sans-serif',
            }}
          >
            <div style={{ fontSize: 48, fontWeight: 'bold' }}>
              Prediction ikke funnet
            </div>
            <div style={{ fontSize: 24, marginTop: 20, opacity: 0.7 }}>
              GGWP.no
            </div>
          </div>
        ),
        { ...size },
      )
    }

    const { round, total_picks, correct_picks, username } = prediction
    const accuracy =
      total_picks > 0 ? ((correct_picks / total_picks) * 100).toFixed(1) : '0.0'

    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            color: 'white',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Background pattern */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `
                repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.02) 35px, rgba(255,255,255,0.02) 70px),
                repeating-linear-gradient(-45deg, transparent, transparent 35px, rgba(255,255,255,0.02) 35px, rgba(255,255,255,0.02) 70px)
              `,
            }}
          />

          {/* Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              padding: '80px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 'auto',
              }}
            >
              <div
                style={{ fontSize: 32, fontWeight: 'bold', color: '#94a3b8' }}
              >
                GGWP.no
              </div>
            </div>

            {/* Main content */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <div
                style={{ fontSize: 72, fontWeight: 'bold', marginBottom: 20 }}
              >
                {round}
              </div>
              {username && (
                <div
                  style={{ fontSize: 40, marginBottom: 40, color: '#94a3b8' }}
                >
                  av {username}
                </div>
              )}

              {/* Stats */}
              <div
                style={{
                  display: 'flex',
                  gap: 60,
                  marginTop: 40,
                  background: 'rgba(255,255,255,0.05)',
                  padding: '40px 60px',
                  borderRadius: 20,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: 64,
                      fontWeight: 'bold',
                      color: '#10b981',
                    }}
                  >
                    {correct_picks}
                  </div>
                  <div
                    style={{ fontSize: 20, color: '#94a3b8', marginTop: 10 }}
                  >
                    Riktige
                  </div>
                </div>
                <div
                  style={{
                    width: 1,
                    background: 'rgba(255,255,255,0.2)',
                    margin: '0 20px',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ fontSize: 64, fontWeight: 'bold' }}>
                    {total_picks}
                  </div>
                  <div
                    style={{ fontSize: 20, color: '#94a3b8', marginTop: 10 }}
                  >
                    Totalt
                  </div>
                </div>
                <div
                  style={{
                    width: 1,
                    background: 'rgba(255,255,255,0.2)',
                    margin: '0 20px',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: 64,
                      fontWeight: 'bold',
                      color: '#3b82f6',
                    }}
                  >
                    {accuracy}%
                  </div>
                  <div
                    style={{ fontSize: 20, color: '#94a3b8', marginTop: 10 }}
                  >
                    Nøyaktighet
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: 'auto',
                paddingTop: 40,
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  color: '#94a3b8',
                  background: 'rgba(255,255,255,0.05)',
                  padding: '12px 32px',
                  borderRadius: 100,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                Se alle predictions →
              </div>
            </div>
          </div>
        </div>
      ),
      {
        ...size,
      },
    )
  } catch (error) {
    console.error('Error generating OG image:', error)

    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(to bottom right, #000000, #1a1a1a)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            color: 'white',
            fontFamily: 'sans-serif',
          }}
        >
          <div style={{ fontSize: 60, fontWeight: 'bold', marginBottom: 20 }}>
            GGWP.no Predictions
          </div>
          <div style={{ fontSize: 24, opacity: 0.7 }}>Good Game Pickems</div>
        </div>
      ),
      { ...size },
    )
  }
}
