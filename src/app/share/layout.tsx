import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Predictions - GGWP.no',
  description:
    'Se predictions på GGWP.no - Norges største e-sport predictions plattform',
  openGraph: {
    title: 'Predictions - GGWP.no',
    description:
      'Se predictions på GGWP.no - Norges største e-sport predictions plattform',
    siteName: 'GGWP.no',
  },
}

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
