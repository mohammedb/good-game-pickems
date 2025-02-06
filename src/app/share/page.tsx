'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Trophy, Share2, Clock, CheckCircle2, User } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import Image from 'next/image'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

interface SharePageProps {
  searchParams: {
    round?: string
    picks?: string
    correct?: string
    matches?: string
    username?: string
  }
}

interface MatchPrediction {
  team1: string
  team2: string
  team1_logo?: string
  team2_logo?: string
  predicted_winner: string | null
  is_finished: boolean
  winner_id: string | null
  team1_id: string
  team2_id: string
  start_time: string
}

export default function SharePage({ searchParams }: SharePageProps) {
  const round = searchParams.round || 'Current Round'
  const picks = parseInt(searchParams.picks || '0', 10)
  const correct = parseInt(searchParams.correct || '0', 10)
  const accuracy = picks > 0 ? ((correct / picks) * 100).toFixed(1) : '0.0'
  const username = searchParams.username

  let matches: MatchPrediction[] = []
  try {
    matches = searchParams.matches ? JSON.parse(searchParams.matches) : []
  } catch (error) {
    console.error('Error parsing matches:', error)
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast({
        title: 'Link kopiert!',
        description: 'Del linken med vennene dine',
      })
    } catch (error) {
      console.error('Error copying link:', error)
      toast({
        title: 'Feil',
        description: 'Kunne ikke kopiere link',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="mx-auto max-w-2xl p-8">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold">{round} Predictions</h1>
          {username && (
            <div className="mb-2 flex items-center justify-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{username}</span>
            </div>
          )}
          <p className="text-muted-foreground">Se disse predictions!</p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-8">
          <div className="text-center">
            <div className="mb-2 text-4xl font-bold">{correct}</div>
            <div className="text-sm text-muted-foreground">Riktige Picks</div>
          </div>
          <div className="text-center">
            <div className="mb-2 text-4xl font-bold">{accuracy}%</div>
            <div className="text-sm text-muted-foreground">Nøyaktighet</div>
          </div>
        </div>

        {matches.length > 0 && (
          <>
            <Separator className="my-8" />
            <div className="space-y-6">
              <h2 className="mb-4 text-center text-xl font-semibold">
                Kampene
              </h2>
              {matches.map((match, index) => {
                const matchTime = new Date(match.start_time)
                const now = new Date()
                const isUpcoming = matchTime > now

                return (
                  <Card key={index} className="p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <Badge
                        variant={match.is_finished ? 'default' : 'secondary'}
                        className="gap-1"
                      >
                        {match.is_finished ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            Ferdig
                          </>
                        ) : isUpcoming ? (
                          <>
                            <Clock className="h-3 w-3" />
                            Planlagt{' '}
                            {matchTime.toLocaleDateString('nb-NO', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3" />
                            Pågår
                          </>
                        )}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {match.team1_logo ? (
                          <Image
                            src={match.team1_logo}
                            alt={match.team1}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            <span className="text-xs">
                              {match.team1.substring(0, 2)}
                            </span>
                          </div>
                        )}
                        <span
                          className={
                            match.predicted_winner === match.team1
                              ? 'font-bold'
                              : ''
                          }
                        >
                          {match.team1}
                        </span>
                      </div>
                      <div className="px-4 text-sm text-muted-foreground">
                        vs
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={
                            match.predicted_winner === match.team2
                              ? 'font-bold'
                              : ''
                          }
                        >
                          {match.team2}
                        </span>
                        {match.team2_logo ? (
                          <Image
                            src={match.team2_logo}
                            alt={match.team2}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            <span className="text-xs">
                              {match.team2.substring(0, 2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {match.predicted_winner && (
                      <div className="mt-4 text-center text-sm">
                        <span className="text-muted-foreground">
                          Valgt vinner:{' '}
                        </span>
                        <span className="font-medium">
                          {match.predicted_winner}
                        </span>
                        {match.is_finished && (
                          <span
                            className={
                              match.predicted_winner ===
                              (match.winner_id === match.team1_id
                                ? match.team1
                                : match.team2)
                                ? ' text-green-500'
                                : ' text-red-500'
                            }
                          >
                            {match.predicted_winner ===
                            (match.winner_id === match.team1_id
                              ? match.team1
                              : match.team2)
                              ? ' ✓'
                              : ' ✗'}
                          </span>
                        )}
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          </>
        )}

        <div className="mt-8 flex flex-col items-center gap-4">
          <Button asChild size="lg" className="w-full max-w-sm gap-2">
            <Link href="/matches">
              <Trophy className="h-5 w-5" />
              Lag Dine Egne Predictions
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
            Kopier Link
          </Button>
        </div>
      </Card>
    </div>
  )
}
