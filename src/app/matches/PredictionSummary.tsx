'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Share2 } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface PredictionSummaryProps {
  totalPicks: number
  correctPicks: number
  roundName: string
}

export function PredictionSummary({ totalPicks, correctPicks, roundName }: PredictionSummaryProps) {
  const [isSharing, setIsSharing] = useState(false)
  const accuracy = totalPicks > 0 ? ((correctPicks / totalPicks) * 100).toFixed(1) : '0.0'

  const handleShare = async () => {
    try {
      setIsSharing(true)
      
      // Generate the share URL with the user's stats
      const shareUrl = `${window.location.origin}/share?round=${encodeURIComponent(roundName)}&picks=${totalPicks}&correct=${correctPicks}`
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl)
      
      toast({
        title: 'Link copied!',
        description: 'Share your predictions with your friends',
      })
    } catch (error) {
      console.error('Error sharing:', error)
      toast({
        title: 'Error',
        description: 'Failed to copy share link',
        variant: 'destructive',
      })
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <Card className="p-6 mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-2">Your {roundName} Predictions</h3>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {correctPicks} correct out of {totalPicks} picks
            </p>
            <p className="text-sm text-muted-foreground">
              {accuracy}% accuracy
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          disabled={isSharing || totalPicks === 0}
          className="gap-2"
        >
          <Share2 className="h-4 w-4" />
          {isSharing ? 'Copying...' : 'Share'}
        </Button>
      </div>
    </Card>
  )
} 