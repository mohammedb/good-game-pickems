'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  TrendingUp,
  CalendarDays,
  Zap,
  ShieldX,
  Flame,
  Crown,
  Medal,
  ChevronRight,
  X,
  Check,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { ChallengeWithDetails } from '@/lib/challenges/types'
import { useRouter } from 'next/navigation'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ChallengeCardMobileProps {
  challenge: ChallengeWithDetails
  currentUserId: string
  onAccept?: () => void
  onDecline?: () => void
  onUpdate?: () => void
}

export function ChallengeCardMobile({
  challenge,
  currentUserId,
  onAccept,
  onDecline,
  onUpdate,
}: ChallengeCardMobileProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [action, setAction] = useState<'accept' | 'decline' | null>(null)
  const router = useRouter()

  const isChallenger = challenge.challenger_id === currentUserId
  const isChallenged = challenge.challenged_id === currentUserId
  const opponent = isChallenger ? challenge.challenged : challenge.challenger

  // Swipe gesture controls
  const x = useMotionValue(0)
  const scale = useTransform(x, [-200, 0, 200], [0.8, 1, 0.8])
  const rotate = useTransform(x, [-200, 0, 200], [-20, 0, 20])
  const acceptOpacity = useTransform(x, [0, 100], [0, 1])
  const declineOpacity = useTransform(x, [-100, 0], [1, 0])

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
        title: '✅ Utfordring Akseptert',
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
        title: '❌ Utfordring Avslått',
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

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 100

    if (challenge.status === 'pending' && isChallenged && !isLoading) {
      if (info.offset.x > threshold) {
        // Swipe right - accept
        handleAccept()
      } else if (info.offset.x < -threshold) {
        // Swipe left - decline
        handleDecline()
      }
    }
  }

  const getStatusIcon = () => {
    switch (challenge.status) {
      case 'pending':
        return <Clock className="h-5 w-5 animate-pulse text-warning" />
      case 'accepted':
        return <Swords className="h-5 w-5 text-primary" />
      case 'declined':
        return <XCircle className="h-5 w-5 text-destructive" />
      case 'completed':
        return challenge.winner_id === currentUserId ? (
          <Trophy className="h-5 w-5 text-warning" />
        ) : challenge.winner_id ? (
          <ShieldX className="h-5 w-5 text-destructive" />
        ) : (
          <CheckCircle className="h-5 w-5 text-muted-foreground" />
        )
      default:
        return null
    }
  }

  const getChallengeRarity = () => {
    if (challenge.stake_points >= 100) return 'legendary'
    if (challenge.stake_points >= 50) return 'epic'
    if (challenge.stake_points >= 20) return 'rare'
    if (challenge.matches.length >= 5) return 'rare'
    return 'common'
  }

  const rarity = getChallengeRarity()

  return (
    <div className="relative">
      {/* Swipe indicators for pending challenges */}
      {challenge.status === 'pending' && isChallenged && (
        <>
          <motion.div
            className="absolute inset-0 flex items-center justify-end rounded-xl bg-gradient-to-r from-transparent via-success/20 to-success/30 pr-8"
            style={{ opacity: acceptOpacity }}
          >
            <div className="text-white">
              <CheckCircle className="h-12 w-12" />
              <p className="mt-2 text-sm font-medium">Aksepter</p>
            </div>
          </motion.div>
          <motion.div
            className="absolute inset-0 flex items-center justify-start rounded-xl bg-gradient-to-r from-destructive/30 via-destructive/20 to-transparent pl-8"
            style={{ opacity: declineOpacity }}
          >
            <div className="text-white">
              <XCircle className="h-12 w-12" />
              <p className="mt-2 text-sm font-medium">Avslå</p>
            </div>
          </motion.div>
        </>
      )}

      <motion.div
        drag={challenge.status === 'pending' && isChallenged ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        style={{ x, scale, rotate }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          if (
            challenge.status === 'accepted' ||
            challenge.status === 'completed'
          ) {
            router.push(`/challenges/${challenge.id}`)
          }
        }}
      >
        <Card
          className={cn(
            'relative overflow-hidden border-0 shadow-lg',
            rarity === 'legendary' && 'ring-2 ring-amber-500/50',
            rarity === 'epic' && 'ring-2 ring-purple-500/30',
            rarity === 'rare' && 'ring-1 ring-blue-500/20',
          )}
        >
          {/* Header */}
          <div className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10 border-2 border-background">
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-sm">
                      {opponent.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {/* Achievement badges */}
                  {opponent.challenge_wins > 20 && (
                    <motion.div
                      className="absolute -right-1 -top-1"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <Crown className="h-3 w-3 text-amber-500" />
                    </motion.div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 truncate text-sm font-semibold">
                    {getStatusIcon()}
                    <span className="truncate">
                      {isChallenger ? 'Du' : challenge.challenger.username} vs{' '}
                      {isChallenged ? 'Du' : challenge.challenged.username}
                    </span>
                  </p>
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-3 w-3" />
                    {formatDistanceToNow(new Date(challenge.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {challenge.stake_points > 0 && (
                  <Badge
                    variant="outline"
                    className="gap-0.5 border-amber-500/50 bg-amber-500/10 text-xs"
                  >
                    <Zap className="h-2.5 w-2.5" />
                    {challenge.stake_points}
                  </Badge>
                )}
              </div>
            </div>

            {/* Opponent stats */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-success" />
                  {opponent.challenge_wins}S
                </span>
                <span className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                  {opponent.challenge_losses}T
                </span>
                <span className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                  {opponent.challenge_draws}U
                </span>
              </div>
              {opponent.challenge_wins +
                opponent.challenge_losses +
                opponent.challenge_draws >
                0 && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-success" />
                  <span className="font-medium">
                    {(
                      (opponent.challenge_wins /
                        (opponent.challenge_wins +
                          opponent.challenge_losses +
                          opponent.challenge_draws)) *
                      100
                    ).toFixed(0)}
                    %
                  </span>
                </div>
              )}
            </div>

            {/* Message */}
            {challenge.message && (
              <div className="flex gap-2 rounded-lg bg-muted/30 p-2.5">
                <MessageSquare className="mt-0.5 h-3 w-3 flex-shrink-0 text-muted-foreground" />
                <p className="line-clamp-2 text-xs italic">
                  &ldquo;{challenge.message}&rdquo;
                </p>
              </div>
            )}

            {/* Match info */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {challenge.matches.length}{' '}
                {challenge.matches.length === 1 ? 'kamp' : 'kamper'}
              </div>
              {challenge.status === 'accepted' && (
                <div className="flex items-center gap-2 text-xs">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(challenge.matches.filter((cm) => cm.match.is_finished).length / challenge.matches.length) * 100}%`,
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span className="text-muted-foreground">
                    {
                      challenge.matches.filter((cm) => cm.match.is_finished)
                        .length
                    }
                    /{challenge.matches.length}
                  </span>
                </div>
              )}
            </div>

            {/* Score display for active/completed */}
            {(challenge.status === 'accepted' ||
              challenge.status === 'completed') && (
              <div className="flex items-center justify-center gap-4 py-2">
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {challenge.picks?.filter(
                      (pick) =>
                        pick.user_id === challenge.challenger_id &&
                        pick.is_correct === true,
                    ).length || 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {challenge.challenger.username}
                  </p>
                </div>
                <Swords className="h-5 w-5 text-muted-foreground/50" />
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {challenge.picks?.filter(
                      (pick) =>
                        pick.user_id === challenge.challenged_id &&
                        pick.is_correct === true,
                    ).length || 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {challenge.challenged.username}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            {challenge.status === 'pending' && isChallenged && (
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAccept()
                  }}
                  disabled={isLoading}
                  className="h-10 flex-1"
                  size="sm"
                >
                  {isLoading && action === 'accept' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="mr-1.5 h-4 w-4" />
                      Aksepter
                    </>
                  )}
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDecline()
                  }}
                  disabled={isLoading}
                  variant="outline"
                  className="h-10 flex-1"
                  size="sm"
                >
                  {isLoading && action === 'decline' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="mr-1.5 h-4 w-4" />
                      Avslå
                    </>
                  )}
                </Button>
              </div>
            )}

            {(challenge.status === 'accepted' ||
              challenge.status === 'completed') && (
              <div className="flex items-center justify-center text-sm text-muted-foreground">
                <span>Trykk for detaljer</span>
                <ChevronRight className="ml-1 h-4 w-4" />
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
