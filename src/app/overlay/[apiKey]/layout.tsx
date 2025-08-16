import { Metadata } from 'next'
import './overlay.css'
import './overlay-effects.css'

export const metadata: Metadata = {
  title: 'Good Game Pickems - Stream Overlay',
  robots: 'noindex, nofollow',
}

export default function OverlayLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="overlay-container">{children}</div>
}
