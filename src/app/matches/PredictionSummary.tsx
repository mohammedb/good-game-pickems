'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Share2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Match } from './types'

interface PredictionSummaryProps {
  roundName: string
  totalPicks: number
  correctPicks: number
  allRounds: string[]
  onRoundChange: (round: string) => void
  matches: Match[]
  selectedWinners: Record<string, string>
  username?: string
}

export function PredictionSummary({
  roundName,
  totalPicks,
  correctPicks,
  allRounds,
  onRoundChange,
  matches,
  selectedWinners,
  username,
}: PredictionSummaryProps) {
  const router = useRouter()
  const [isSharing, setIsSharing] = useState(false)
  const accuracy =
    totalPicks > 0 ? ((correctPicks / totalPicks) * 100).toFixed(1) : '0.0'

  const roundMatches = matches.filter((match) => match.round === roundName)
  const predictions = roundMatches.map((match) => ({
    team1: match.team1,
    team2: match.team2,
    team1_logo: match.team1_logo,
    team2_logo: match.team2_logo,
    predicted_winner: selectedWinners[match.id] || null,
    is_finished: match.winner_id !== null,
    winner_id: match.winner_id,
    team1_id: match.team1_id,
    team2_id: match.team2_id,
    start_time: match.start_time,
  }))

  const handleShare = () => {
    const shareUrl = new URL('/share', window.location.origin)
    shareUrl.searchParams.set('round', roundName)
    shareUrl.searchParams.set('picks', totalPicks.toString())
    shareUrl.searchParams.set('correct', correctPicks.toString())
    shareUrl.searchParams.set('matches', JSON.stringify(predictions))
    if (username) {
      shareUrl.searchParams.set('username', username)
    }
    router.push(shareUrl.toString())
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Select value={roundName} onValueChange={onRoundChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Velg runde" />
            </SelectTrigger>
            <SelectContent>
              {allRounds.map((round) => (
                <SelectItem key={round} value={round}>
                  {round}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleShare}
            disabled={totalPicks === 0}
          >
            <Share2 className="h-4 w-4" />
            Del Predictions
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="text-center">
            <div className="mb-2 text-4xl font-bold">{correctPicks}</div>
            <div className="text-sm text-muted-foreground">Riktige Picks</div>
          </div>
          <div className="text-center">
            <div className="mb-2 text-4xl font-bold">{accuracy}%</div>
            <div className="text-sm text-muted-foreground">Nøyaktighet</div>
          </div>
        </div>
      </div>
    </Card>
  )
}
