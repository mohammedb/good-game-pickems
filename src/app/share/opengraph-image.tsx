import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'GGWP.no Predictions'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image({
  params,
  searchParams,
}: {
  params: Record<string, string>
  searchParams: { r?: string; p?: string; c?: string; u?: string }
}) {
  const round = searchParams.r || 'Nåværende Runde'
  const picks = parseInt(searchParams.p || '0', 10)
  const correct = parseInt(searchParams.c || '0', 10)
  const accuracy = picks > 0 ? ((correct / picks) * 100).toFixed(1) : '0.0'
  const username = searchParams.u

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
          {round} Predictions
        </div>
        {username && (
          <div style={{ fontSize: 40, marginBottom: 40, opacity: 0.8 }}>
            av {username}
          </div>
        )}
        <div style={{ fontSize: 32, opacity: 0.9 }}>
          {correct} riktige av {picks} predictions ({accuracy}% nøyaktighet)
        </div>
        <div style={{ fontSize: 24, marginTop: 60, opacity: 0.7 }}>GGWP.no</div>
      </div>
    ),
    {
      ...size,
    },
  )
}
