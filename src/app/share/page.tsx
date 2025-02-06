'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Trophy, Share2, Clock, CheckCircle2, User } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import Image from 'next/image'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface SharePageProps {
  searchParams: {
    r?: string
    p?: string
    c?: string
    m?: string
    u?: string
  }
}

interface MatchPrediction {
  t1: string
  t2: string
  t1l?: string
  t2l?: string
  pw: string | null
  f: boolean
  w: string | null
  t1i: string
  t2i: string
  st: string
  t1m?: number | null
  t2m?: number | null
  at1m?: number | null
  at2m?: number | null
}

export default function SharePage({ searchParams }: SharePageProps) {
  const round = searchParams.r || 'Current Round'
  const picks = parseInt(searchParams.p || '0', 10)
  const correct = parseInt(searchParams.c || '0', 10)
  const accuracy = picks > 0 ? ((correct / picks) * 100).toFixed(1) : '0.0'
  const username = searchParams.u

  let matches: MatchPrediction[] = []
  try {
    matches = searchParams.m ? JSON.parse(atob(searchParams.m)) : []
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
                const matchTime = new Date(match.st)
                const now = new Date()
                const isUpcoming = matchTime > now

                return (
                  <Card key={index} className="p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <Badge
                        variant={match.f ? 'default' : 'secondary'}
                        className="gap-1"
                      >
                        {match.f ? (
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
                        {match.t1l ? (
                          <Image
                            src={match.t1l}
                            alt={match.t1}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            <span className="text-xs">
                              {match.t1.substring(0, 2)}
                            </span>
                          </div>
                        )}
                        <span
                          className={match.pw === match.t1 ? 'font-bold' : ''}
                        >
                          {match.t1}
                        </span>
                      </div>
                      <div className="px-4 text-sm text-muted-foreground">
                        vs
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={match.pw === match.t2 ? 'font-bold' : ''}
                        >
                          {match.t2}
                        </span>
                        {match.t2l ? (
                          <Image
                            src={match.t2l}
                            alt={match.t2}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            <span className="text-xs">
                              {match.t2.substring(0, 2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {match.pw && (
                      <div className="mt-4 space-y-4 text-center">
                        <div>
                          <div className="text-sm text-muted-foreground">
                            Valgt Vinner
                          </div>
                          <div className="font-medium">{match.pw}</div>
                          {(match.t1m !== null || match.t2m !== null) && (
                            <div className="mt-2">
                              <div className="text-sm text-muted-foreground">
                                Predicted Map Score
                              </div>
                              <div className="font-medium">
                                {match.t1} {match.t1m ?? 0} - {match.t2m ?? 0}{' '}
                                {match.t2}
                              </div>
                            </div>
                          )}
                        </div>

                        {match.f && match.w && (
                          <div className="border-t pt-2">
                            <div className="text-sm text-muted-foreground">
                              Resultat
                            </div>
                            <div
                              className={cn(
                                'font-medium',
                                match.pw === match.w
                                  ? 'text-green-500'
                                  : 'text-red-500',
                              )}
                            >
                              {match.w} vant
                            </div>
                            {match.at1m !== null && match.at2m !== null && (
                              <div className="mt-1">
                                <div className="text-sm text-muted-foreground">
                                  Faktisk Map Score
                                </div>
                                <div className="font-medium">
                                  {match.t1} {match.at1m} - {match.at2m}{' '}
                                  {match.t2}
                                </div>
                              </div>
                            )}
                          </div>
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
