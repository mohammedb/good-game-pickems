'use client'

import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/components/ui/use-toast'
import {
  Trophy,
  Swords,
  Clock,
  CheckCircle,
  XCircle,
  Timer,
  Loader2,
  MessageSquare,
  CalendarDays,
  ChevronRight,
  Zap,
  Gamepad2,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ChallengeWithDetails } from '@/lib/challenges/types'
import { createBrowserClient } from '@/utils/supabase-client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface ChallengeCardProps {
  challenge: ChallengeWithDetails & {
    challenge_matches?: any[]
  }
  currentUserId: string
  onAccept?: () => void
  onDecline?: () => void
  onUpdate?: () => void
}

export function ChallengeCard({
  challenge,
  currentUserId,
  onAccept,
  onDecline,
  onUpdate,
}: ChallengeCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [action, setAction] = useState<'accept' | 'decline' | null>(null)
  const router = useRouter()
  const supabase = createBrowserClient()

  const isChallenger = challenge.challenger_id === currentUserId
  const isChallenged = challenge.challenged_id === currentUserId
  const opponent = isChallenger ? challenge.challenged : challenge.challenger

  const handleAccept = async () => {
    setIsLoading(true)
    setAction('accept')

    try {
      const response = await fetch(`/api/challenges/${challenge.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted' }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to accept challenge')
      }

      toast({
        title: 'Utfordring Akseptert',
        description: 'La prediction-kampen begynne!',
      })

      onAccept?.()
      onUpdate?.()
    } catch (error) {
      toast({
        title: 'Feil',
        description:
          error instanceof Error
            ? error.message
            : 'Kunne ikke akseptere utfordring',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
      setAction(null)
    }
  }

  const handleDecline = async () => {
    setIsLoading(true)
    setAction('decline')

    try {
      const response = await fetch(`/api/challenges/${challenge.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'declined' }),
      })

      if (!response.ok) {
        throw new Error('Failed to decline challenge')
      }

      toast({
        title: 'Utfordring Avslått',
        description: 'Utfordringen har blitt avslått.',
      })

      onDecline?.()
      onUpdate?.()
    } catch (error) {
      toast({
        title: 'Feil',
        description: 'Kunne ikke avslå utfordring',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
      setAction(null)
    }
  }

  const getStatusIcon = () => {
    switch (challenge.status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-600" />
      case 'accepted':
        return <Swords className="h-4 w-4 text-blue-600" />
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'completed':
        return challenge.winner_id === currentUserId ? (
          <Trophy className="h-4 w-4 text-green-600" />
        ) : challenge.winner_id ? (
          <XCircle className="h-4 w-4 text-red-600" />
        ) : (
          <CheckCircle className="h-4 w-4 text-gray-600" />
        )
      default:
        return null
    }
  }

  const getStatusLabel = () => {
    switch (challenge.status) {
      case 'pending':
        return isChallenged ? 'Venter på deg' : 'Venter på svar'
      case 'accepted':
        return 'Kamp pågår'
      case 'declined':
        return 'Avslått'
      case 'completed':
        if (challenge.winner_id === currentUserId) return 'Du vant!'
        if (challenge.winner_id) return 'Du tapte'
        return 'Uavgjort'
      default:
        return challenge.status
    }
  }

  const calculateProgress = () => {
    const matches = challenge.matches || challenge.challenge_matches || []
    if (matches.length === 0) return 0
    const completedMatches = matches.filter(
      (cm) => cm.match?.is_finished,
    ).length
    return (completedMatches / matches.length) * 100
  }

  const getUserScore = (userId: string) => {
    if (!challenge.picks) return 0
    return (
      challenge.picks.filter(
        (pick) => pick.user_id === userId && pick.is_correct === true,
      ).length || 0
    )
  }

  const challengerScore = getUserScore(challenge.challenger_id)
  const challengedScore = getUserScore(challenge.challenged_id)

  return (
    <Card
      className={cn(
        'transition-shadow hover:shadow-md',
        challenge.status === 'completed' &&
          challenge.winner_id === currentUserId &&
          'border-green-200 dark:border-green-900',
        challenge.status === 'completed' &&
          challenge.winner_id &&
          challenge.winner_id !== currentUserId &&
          'border-red-200 dark:border-red-900',
        challenge.status === 'pending' &&
          isChallenged &&
          'border-orange-200 dark:border-orange-900',
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              {getStatusIcon()}
              <span className="truncate">
                {isChallenger ? 'Du' : challenge.challenger.username} vs{' '}
                {isChallenged ? 'Du' : challenge.challenged.username}
              </span>
            </CardTitle>
            <CardDescription className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {formatDistanceToNow(new Date(challenge.created_at), {
                  addSuffix: true,
                })}
              </span>
              {challenge.status === 'pending' && (
                <span className="flex items-center gap-1 text-orange-600">
                  <Timer className="h-3 w-3" />
                  Utløper{' '}
                  {formatDistanceToNow(new Date(challenge.expires_at), {
                    addSuffix: true,
                  })}
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="secondary" className="text-xs">
              {getStatusLabel()}
            </Badge>
            {challenge.stake_points > 0 && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Zap className="h-3 w-3" />
                {challenge.stake_points} poeng
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Opponent Info */}
        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {opponent.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{opponent.username}</p>
              <p className="text-xs text-muted-foreground">
                {opponent.challenge_wins}W - {opponent.challenge_losses}L -{' '}
                {opponent.challenge_draws}D
              </p>
            </div>
          </div>
          {opponent.challenge_wins +
            opponent.challenge_losses +
            opponent.challenge_draws >
            0 && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Vinnerprosent</p>
              <p className="text-sm font-semibold">
                {(
                  (opponent.challenge_wins /
                    (opponent.challenge_wins +
                      opponent.challenge_losses +
                      opponent.challenge_draws)) *
                  100
                ).toFixed(0)}
                %
              </p>
            </div>
          )}
        </div>

        {/* Message */}
        {challenge.message && (
          <div className="flex gap-2 rounded-lg bg-muted/30 p-3">
            <MessageSquare className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <p className="text-sm italic">&ldquo;{challenge.message}&rdquo;</p>
          </div>
        )}

        {/* Match Progress */}
        {challenge.status === 'accepted' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Kampfremgang</span>
              <span>
                {(() => {
                  const matches =
                    challenge.matches || challenge.challenge_matches || []
                  const completed = matches.filter(
                    (cm) => cm.match?.is_finished,
                  ).length
                  return `${completed} / ${matches.length}`
                })()}
              </span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>
        )}

        {/* Scores */}
        {(challenge.status === 'accepted' ||
          challenge.status === 'completed') && (
          <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
            <div className="flex-1 text-center">
              <p className="text-2xl font-bold">{challengerScore}</p>
              <p className="text-xs text-muted-foreground">
                {challenge.challenger.username}
              </p>
            </div>
            <Swords className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1 text-center">
              <p className="text-2xl font-bold">{challengedScore}</p>
              <p className="text-xs text-muted-foreground">
                {challenge.challenged.username}
              </p>
            </div>
          </div>
        )}

        {/* Winner Display */}
        {challenge.status === 'completed' && (
          <div
            className={cn(
              'rounded-lg p-3 text-center',
              challenge.winner_id === currentUserId
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                : challenge.winner_id
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                  : 'bg-gray-100 dark:bg-gray-900/20',
            )}
          >
            <div className="flex items-center justify-center gap-2">
              {challenge.winner_id ? (
                <>
                  <Trophy className="h-4 w-4" />
                  <span className="font-semibold">
                    {challenge.winner_id === currentUserId
                      ? 'Du vant!'
                      : `${challenge.winner?.username} vant!`}
                  </span>
                </>
              ) : (
                <span className="font-medium">Det ble uavgjort!</span>
              )}
            </div>
            {challenge.stake_points > 0 && challenge.winner_id && (
              <p className="mt-1 text-sm">
                {challenge.winner_id === currentUserId ? '+' : '-'}
                {challenge.stake_points} poeng
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {challenge.status === 'pending' && isChallenged && (
            <div className="flex gap-2">
              <Button
                onClick={handleAccept}
                disabled={isLoading}
                className="flex-1"
                size="sm"
              >
                {isLoading && action === 'accept' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Aksepter
              </Button>
              <Button
                onClick={handleDecline}
                disabled={isLoading}
                variant="outline"
                className="flex-1"
                size="sm"
              >
                {isLoading && action === 'decline' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                Avslå
              </Button>
            </div>
          )}

          {(challenge.status === 'accepted' ||
            challenge.status === 'completed') && (
            <Button
              onClick={() => router.push(`/challenges/${challenge.id}`)}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <Gamepad2 className="mr-2 h-4 w-4" />
              Se Kampdetaljer
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
