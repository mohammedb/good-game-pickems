'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Trophy, Share2 } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface SharePageProps {
  searchParams: {
    round?: string
    picks?: string
    correct?: string
  }
}

export default function SharePage({ searchParams }: SharePageProps) {
  const round = searchParams.round || 'Current Round'
  const picks = parseInt(searchParams.picks || '0', 10)
  const correct = parseInt(searchParams.correct || '0', 10)
  const accuracy = picks > 0 ? ((correct / picks) * 100).toFixed(1) : '0.0'

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${round} Predictions - Good Game Pickems`,
          text: `Check out my predictions! ${correct} correct picks with ${accuracy}% accuracy`,
          url: window.location.href
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast({
          title: 'Link copied!',
          description: 'Share the link with your friends',
        })
      }
    } catch (error) {
      console.error('Error sharing:', error)
      toast({
        title: 'Error',
        description: 'Failed to share or copy link',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-2xl mx-auto p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{round} Predictions</h1>
          <p className="text-muted-foreground">
            Check out these prediction stats!
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">{correct}</div>
            <div className="text-sm text-muted-foreground">Correct Picks</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">{accuracy}%</div>
            <div className="text-sm text-muted-foreground">Accuracy</div>
          </div>
        </div>

        <div className="flex flex-col gap-4 items-center">
          <Button asChild size="lg" className="w-full max-w-sm gap-2">
            <Link href="/matches">
              <Trophy className="h-5 w-5" />
              Make Your Own Predictions
            </Link>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="gap-2"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
            Share This
          </Button>
        </div>
      </Card>
    </div>
  )
} 