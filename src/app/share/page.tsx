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
      // First shorten the URL
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: window.location.href }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Error response:', data)
        throw new Error(data.error || 'Failed to shorten URL')
      }

      const { shortUrl } = data

      // Copy the shortened URL
      await navigator.clipboard.writeText(shortUrl)
      toast({
        title: 'Link kopiert!',
        description: 'Kort link er kopiert til utklippstavlen',
      })
    } catch (error) {
      console.error('Error copying link:', error)
      toast({
        title: 'Feil',
        description:
          error instanceof Error ? error.message : 'Kunne ikke kopiere link',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="mx-auto max-w-5xl p-8">
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
            <div>
              <h2 className="mb-6 text-center text-xl font-semibold">
                Kampene
              </h2>
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
                {matches.map((match, index) => {
                  const matchTime = new Date(match.st)
                  const now = new Date()
                  const isUpcoming = matchTime > now

                  return (
                    <Card key={index} className="flex h-full flex-col p-4">
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

                      <div className="flex flex-grow items-center justify-between">
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
                            className={cn(
                              match.pw === match.t1 ? 'font-bold' : '',
                              match.f &&
                                match.w === match.t1 &&
                                'text-green-500',
                            )}
                          >
                            {match.t1}
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <div className="text-sm font-medium text-muted-foreground">
                            vs
                          </div>
                          {(match.t1m !== null || match.t2m !== null) && (
                            <div className="text-sm font-medium">
                              {match.t1m ?? 0} - {match.t2m ?? 0}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              match.pw === match.t2 ? 'font-bold' : '',
                              match.f &&
                                match.w === match.t2 &&
                                'text-green-500',
                            )}
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
                        <div className="mt-4 space-y-3">
                          <div className="flex items-center justify-center gap-2">
                            <Badge variant="outline" className="text-sm">
                              Din Prediction:{' '}
                              <span className="ml-1 font-semibold">
                                {match.pw}
                              </span>
                            </Badge>
                            {match.f && match.w && (
                              <Badge
                                variant={
                                  match.pw === match.w
                                    ? 'success'
                                    : 'destructive'
                                }
                                className="text-sm"
                              >
                                {match.pw === match.w ? '✓ Riktig' : '✗ Feil'}
                              </Badge>
                            )}
                          </div>

                          {match.f &&
                            match.w &&
                            match.at1m !== null &&
                            match.at2m !== null && (
                              <div className="rounded-lg bg-muted/50 p-2 text-center">
                                <div className="text-sm font-medium">
                                  Faktisk Resultat
                                </div>
                                <div className="mt-1 text-base font-semibold">
                                  {match.t1} {match.at1m} - {match.at2m}{' '}
                                  {match.t2}
                                </div>
                              </div>
                            )}
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
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
