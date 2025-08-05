'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Share2, Trophy, TrendingUp } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

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
  gameType?: string
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
  gameType = 'CS2',
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

  const handleShare = async () => {
    try {
      setIsSharing(true)

      // Call the new API endpoint to save the predictions
      const response = await fetch('/api/share-predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          round: roundName,
          picks: totalPicks,
          correct: correctPicks,
          predictions,
          gameType,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Share API error:', errorData)
        throw new Error(errorData.error || 'Failed to create share link')
      }

      const { id } = await response.json()

      // Show success toast before navigating
      toast({
        title: 'Suksess!',
        description: 'Delelink opprettet. Omdirigerer...',
      })

      // Small delay to let user see the success message
      setTimeout(() => {
        router.push(`/share/${id}`)
      }, 1000)
    } catch (error) {
      console.error('Error sharing predictions:', error)
      toast({
        title: 'Feil',
        description: 'Kunne ikke lage delelink',
        variant: 'destructive',
      })
    } finally {
      setIsSharing(false)
    }
  }

  const getAccuracyBadge = (acc: number) => {
    if (acc >= 90) return { label: 'Ekspert', variant: 'default' as const }
    if (acc >= 70) return { label: 'Pro', variant: 'secondary' as const }
    if (acc >= 50) return { label: 'God', variant: 'outline' as const }
    return null
  }

  const accuracyBadge = getAccuracyBadge(parseFloat(accuracy))

  return (
    <Card className="relative overflow-hidden p-6">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
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
            <Badge variant="outline" className="gap-1">
              {gameType}
            </Badge>
          </div>

          <Button
            variant={totalPicks === 0 ? 'outline' : 'default'}
            size="sm"
            className={cn(
              'gap-2 transition-all',
              totalPicks > 0 && 'hover:shadow-lg',
            )}
            onClick={handleShare}
            disabled={totalPicks === 0 || isSharing}
          >
            {isSharing ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Oppretter delelink...
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                Del Predictions
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="group relative text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <Trophy className="h-5 w-5 text-primary opacity-60 transition-opacity group-hover:opacity-100" />
              <div className="text-4xl font-bold">{correctPicks}</div>
            </div>
            <div className="text-sm text-muted-foreground">Riktige Picks</div>
          </div>
          <div className="group relative text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary opacity-60 transition-opacity group-hover:opacity-100" />
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-bold">{accuracy}%</div>
                {accuracyBadge && (
                  <Badge variant={accuracyBadge.variant} className="text-xs">
                    {accuracyBadge.label}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-sm text-muted-foreground">Nøyaktighet</div>
          </div>
        </div>

        {totalPicks === 0 && (
          <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/50 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Ingen predictions for denne runden ennå.
              <br />
              Velg vinnere for å kunne dele dine predictions!
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
