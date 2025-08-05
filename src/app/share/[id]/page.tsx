'use client'

import { use, useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Trophy,
  Share2,
  Clock,
  CheckCircle2,
  User,
  Eye,
  Twitter,
  Facebook,
  Link as LinkIcon,
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import Image from 'next/image'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { NumberTicker } from '@/components/magicui/number-ticker'
import { SparklesText } from '@/components/magicui/sparkles-text'

interface SharePageProps {
  params: Promise<{
    id: string
  }>
}

interface SharedPrediction {
  id: string
  user_id: string
  username: string | null
  round: string
  total_picks: number
  correct_picks: number
  predictions: MatchPrediction[]
  game_type: string
  season_id: string | null
  created_at: string
  view_count: number
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

export default function SharePage({ params }: SharePageProps) {
  const { id } = use(params)
  const [sharedPrediction, setSharedPrediction] =
    useState<SharedPrediction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function fetchPrediction() {
      try {
        const response = await fetch(`/api/share-predictions?id=${id}`)

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to load prediction')
        }

        const data = await response.json()
        setSharedPrediction(data)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load prediction',
        )
      } finally {
        setLoading(false)
      }
    }

    fetchPrediction()
  }, [id])

  // Update document title dynamically
  useEffect(() => {
    if (sharedPrediction) {
      const pageTitle = sharedPrediction.username
        ? `${sharedPrediction.username}s ${sharedPrediction.round} Predictions - GGWP.no`
        : `${sharedPrediction.round} Predictions - GGWP.no`
      document.title = pageTitle
    }
  }, [sharedPrediction])

  const handleShare = async (platform?: 'twitter' | 'facebook') => {
    if (!sharedPrediction) return

    const { round, total_picks, correct_picks, username } = sharedPrediction
    const accuracy =
      total_picks > 0 ? ((correct_picks / total_picks) * 100).toFixed(1) : '0.0'

    try {
      const shareUrl = `${window.location.origin}/share/${id}`
      const shareText = username
        ? `Sjekk ut ${username}s ${round} predictions - ${correct_picks}/${total_picks} riktige (${accuracy}%)`
        : `${round} Predictions - ${correct_picks}/${total_picks} riktige (${accuracy}%)`

      if (platform === 'twitter') {
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
          '_blank',
        )
        return
      }

      if (platform === 'facebook') {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
          '_blank',
        )
        return
      }

      // Default: copy link
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: shareUrl }),
      })

      if (!response.ok) {
        throw new Error('Failed to shorten URL')
      }

      const { shortUrl } = await response.json()

      // Copy the shortened URL
      await navigator.clipboard.writeText(shortUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: 'Link kopiert!',
        description: 'Kort link er kopiert til utklippstavlen',
      })
    } catch (error) {
      console.error('Error sharing:', error)
      toast({
        title: 'Feil',
        description: 'Kunne ikke dele link',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <Card className="mx-auto max-w-5xl animate-pulse p-8">
          <div className="space-y-8">
            <div className="mx-auto h-8 w-64 rounded bg-muted"></div>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <div className="mx-auto h-12 w-24 rounded bg-muted"></div>
                <div className="mx-auto h-4 w-32 rounded bg-muted"></div>
              </div>
              <div className="space-y-2">
                <div className="mx-auto h-12 w-24 rounded bg-muted"></div>
                <div className="mx-auto h-4 w-32 rounded bg-muted"></div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-32 rounded bg-muted"></div>
              <div className="h-32 rounded bg-muted"></div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (error || !sharedPrediction) {
    return (
      <div className="container mx-auto p-4">
        <Card className="mx-auto max-w-5xl p-8">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold">Prediction ikke funnet</h1>
            <p className="mb-8 text-muted-foreground">
              {error || 'Kunne ikke laste prediction'}
            </p>
            <Button asChild>
              <Link href="/matches">Gå til kamper</Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const {
    round,
    total_picks,
    correct_picks,
    predictions,
    username,
    view_count,
  } = sharedPrediction
  const accuracy =
    total_picks > 0 ? ((correct_picks / total_picks) * 100).toFixed(1) : '0.0'

  return (
    <div className="container mx-auto p-4">
      <Card className="mx-auto max-w-5xl overflow-hidden">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-8">
          <div className="text-center">
            <Badge className="mb-4 gap-1">
              {sharedPrediction.game_type || 'CS2'}
            </Badge>
            <h1 className="mb-2 text-3xl font-bold">{round} Predictions</h1>
            {username && (
              <div className="mb-2 flex items-center justify-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="font-medium">{username}</span>
              </div>
            )}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Eye className="h-3 w-3" />
              <span>{view_count} visninger</span>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Stats Section */}
          <div className="mb-8 grid grid-cols-2 gap-4 sm:gap-8">
            <Card className="group relative overflow-hidden p-6 text-center transition-all hover:scale-105">
              <div className="mb-2 text-4xl font-bold text-primary">
                <NumberTicker value={correct_picks} delay={0.5} />
              </div>
              <div className="text-sm text-muted-foreground">Riktige Picks</div>
              {correct_picks >= total_picks && total_picks > 0 && (
                <div className="absolute -right-2 -top-2 rotate-12">
                  <SparklesText
                    className="text-xs font-bold text-primary"
                    sparklesCount={8}
                  >
                    Perfect!
                  </SparklesText>
                </div>
              )}
            </Card>
            <Card className="group p-6 text-center transition-all hover:scale-105">
              <div className="mb-2 flex items-center justify-center text-4xl font-bold text-primary">
                <NumberTicker
                  value={parseFloat(accuracy)}
                  delay={0.5}
                  decimalPlaces={1}
                />
                <span>%</span>
              </div>
              <div className="text-sm text-muted-foreground">Nøyaktighet</div>
            </Card>
          </div>

          {predictions.length > 0 && (
            <>
              <Separator className="my-8" />
              <div>
                <h2 className="mb-6 text-center text-xl font-semibold">
                  Kampene
                </h2>
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
                  {predictions.map((match, index) => {
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
                                'transition-colors',
                                match.pw === match.t1 ? 'font-bold' : '',
                                match.f &&
                                  match.w === match.t1 &&
                                  'text-green-500',
                                match.pw === match.t1 && 'text-primary',
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
                                'transition-colors',
                                match.pw === match.t2 ? 'font-bold' : '',
                                match.f &&
                                  match.w === match.t2 &&
                                  'text-green-500',
                                match.pw === match.t2 && 'text-primary',
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
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-full rounded-lg border-2 border-primary/20 bg-primary/5 p-3 text-center">
                                <div className="mb-2 text-sm font-medium text-muted-foreground">
                                  Prediction
                                </div>
                                <div className="flex items-center justify-center gap-2">
                                  <span className="font-semibold">
                                    {match.pw}
                                  </span>
                                  {match.t1m !== null && match.t2m !== null && (
                                    <span className="text-muted-foreground">
                                      ({match.t1m}-{match.t2m})
                                    </span>
                                  )}
                                </div>
                                {match.f && match.w && (
                                  <div className="mt-3 flex items-center justify-center gap-2">
                                    <Badge
                                      variant={
                                        match.pw === match.w
                                          ? 'success'
                                          : 'destructive'
                                      }
                                      className="text-sm"
                                    >
                                      {match.pw === match.w ? (
                                        <div className="flex items-center gap-1">
                                          <CheckCircle2 className="h-3 w-3 animate-pulse" />
                                          <span>Riktig Vinner (+2)</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1">
                                          <span>✗</span>
                                          <span>Feil Vinner</span>
                                        </div>
                                      )}
                                    </Badge>
                                    {match.at1m !== null &&
                                      match.at2m !== null &&
                                      match.t1m !== null &&
                                      match.t2m !== null && (
                                        <Badge
                                          variant={
                                            match.t1m === match.at1m &&
                                            match.t2m === match.at2m
                                              ? 'success'
                                              : 'destructive'
                                          }
                                          className="text-sm"
                                        >
                                          {match.t1m === match.at1m &&
                                          match.t2m === match.at2m ? (
                                            <div className="flex items-center gap-1">
                                              <CheckCircle2 className="h-3 w-3 animate-pulse" />
                                              <span>Riktig Maps (+1)</span>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-1">
                                              <span>✗</span>
                                              <span>Feil Maps</span>
                                            </div>
                                          )}
                                        </Badge>
                                      )}
                                  </div>
                                )}
                              </div>

                              {match.f &&
                                match.w &&
                                match.at1m !== null &&
                                match.at2m !== null && (
                                  <div className="w-full rounded-lg bg-muted/50 p-3 text-center">
                                    <div className="mb-2 text-sm font-medium text-muted-foreground">
                                      Faktisk Resultat
                                    </div>
                                    <div className="flex items-center justify-center gap-3">
                                      <span
                                        className={cn(
                                          'font-semibold',
                                          match.w === match.t1 &&
                                            'text-green-500',
                                        )}
                                      >
                                        {match.t1}
                                      </span>
                                      <span className="font-bold">
                                        {match.at1m} - {match.at2m}
                                      </span>
                                      <span
                                        className={cn(
                                          'font-semibold',
                                          match.w === match.t2 &&
                                            'text-green-500',
                                        )}
                                      >
                                        {match.t2}
                                      </span>
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>
                        )}
                      </Card>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* Call to Action Section */}
          <Separator className="my-8" />

          <div className="space-y-6">
            <div className="text-center">
              <p className="mb-4 text-muted-foreground">
                Del denne prediction med vennene dine!
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => handleShare('twitter')}
                >
                  <Twitter className="h-4 w-4" />
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => handleShare('facebook')}
                >
                  <Facebook className="h-4 w-4" />
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => handleShare()}
                >
                  <LinkIcon className="h-4 w-4" />
                  {copied ? 'Kopiert!' : 'Kopier Link'}
                </Button>
              </div>
            </div>

            <div className="text-center">
              <Button asChild size="lg" className="gap-2">
                <Link href="/matches">
                  <Trophy className="h-5 w-5" />
                  Lag Dine Egne Predictions
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
