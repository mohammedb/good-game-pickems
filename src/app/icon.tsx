import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 32,
  height: 32,
}

export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: 'black',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          color: '#64FFFF',
          fontWeight: 700,
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #64FFFF, #BEFFD2)',
            borderRadius: '50%',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #96AAFF',
          }}
        >
          GG
        </div>
      </div>
    ),
    {
      ...size,
    },
  )
}
