import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 180,
  height: 180,
}

export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 120,
          background: 'black',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '40px',
          color: '#64FFFF',
          fontWeight: 700,
          textShadow: '4px 4px 8px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #64FFFF, #BEFFD2)',
            borderRadius: '35px',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '4px solid #96AAFF',
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
