import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Good Game Pickems Predictions'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const round = searchParams.round as string || 'Current Round'
  const picks = parseInt(searchParams.picks as string || '0', 10)
  const correct = parseInt(searchParams.correct as string || '0', 10)
  const accuracy = picks > 0 ? ((correct / picks) * 100).toFixed(1) : '0.0'

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
          padding: '40px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
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
          <div
            style={{
              fontSize: 36,
              color: '#4A5568',
              marginBottom: 20,
            }}
          >
            {round} Predictions
          </div>
          <div
            style={{
              display: 'flex',
              gap: '40px',
              marginTop: '20px',
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
                  fontSize: 48,
                  fontWeight: 'bold',
                  color: '#000000',
                }}
              >
                {correct}
              </div>
              <div
                style={{
                  fontSize: 24,
                  color: '#4A5568',
                }}
              >
                Correct Picks
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 'bold',
                  color: '#000000',
                }}
              >
                {accuracy}%
              </div>
              <div
                style={{
                  fontSize: 24,
                  color: '#4A5568',
                }}
              >
                Accuracy
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
} 