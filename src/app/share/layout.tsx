import { Metadata } from 'next'

type Props = {
  children: React.ReactNode
  params: Record<string, string>
  searchParams: {
    round?: string
    picks?: string
    correct?: string
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const round = props.searchParams?.round || 'Current Round'
  const picks = parseInt(props.searchParams?.picks || '0', 10)
  const correct = parseInt(props.searchParams?.correct || '0', 10)
  const accuracy = picks > 0 ? ((correct / picks) * 100).toFixed(1) : '0.0'

  return {
    title: `${round} Predictions - Good Game Pickems`,
    description: `Check out my predictions! ${correct} correct picks with ${accuracy}% accuracy`,
    openGraph: {
      title: `${round} Predictions - Good Game Pickems`,
      description: `Check out my predictions! ${correct} correct picks with ${accuracy}% accuracy`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${round} Predictions - Good Game Pickems`,
      description: `Check out my predictions! ${correct} correct picks with ${accuracy}% accuracy`,
    },
  }
}

export default function ShareLayout({
  children,
  params,
  searchParams,
}: Props) {
  return (
    <>
      {children}
    </>
  )
} 