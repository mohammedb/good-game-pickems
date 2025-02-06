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
  mapScores: Record<string, { team1: number; team2: number }>
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
  mapScores,
  username,
}: PredictionSummaryProps) {
  const router = useRouter()
  const [isSharing, setIsSharing] = useState(false)
  const accuracy =
    totalPicks > 0 ? ((correctPicks / totalPicks) * 100).toFixed(1) : '0.0'

  const roundMatches = matches.filter((match) => match.round === roundName)
  const predictions = roundMatches.map((match) => {
    const mapScore = mapScores[match.id]
    const team1MapScore = mapScore?.team1 ?? null
    const team2MapScore = team1MapScore !== null ? (mapScore?.team2 ?? 0) : null

    // Get the actual winner if match is finished
    const actualWinner =
      match.is_finished && match.winner_id
        ? match.winner_id === match.team1_id
          ? match.team1
          : match.team2
        : null

    return {
      t1: match.team1,
      t2: match.team2,
      t1l: match.team1_logo,
      t2l: match.team2_logo,
      pw: selectedWinners[match.id] || null,
      f: match.is_finished,
      w: actualWinner,
      t1i: match.team1_id,
      t2i: match.team2_id,
      st: match.start_time,
      t1m: team1MapScore,
      t2m: team2MapScore,
      // Actual match scores
      at1m: match.team1_map_score,
      at2m: match.team2_map_score,
    }
  })

  const handleShare = () => {
    const shareUrl = new URL('/share', window.location.origin)
    shareUrl.searchParams.set('r', roundName)
    shareUrl.searchParams.set('p', totalPicks.toString())
    shareUrl.searchParams.set('c', correctPicks.toString())
    shareUrl.searchParams.set('m', btoa(JSON.stringify(predictions)))
    if (username) {
      shareUrl.searchParams.set('u', username)
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
