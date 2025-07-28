'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  TrendingUp,
  CalendarDays,
  ChevronRight,
  ShieldCheck,
  ShieldX,
  Sparkles,
  Zap,
  AlertTriangle,
  Flame,
  TrendingDown,
  Star,
  Crown,
  ArrowUpRight,
  ArrowDownRight,
  Gamepad2,
  Target,
  Medal,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { ChallengeWithDetails } from '@/lib/challenges/types'
import { createBrowserClient } from '@/utils/supabase-client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface ChallengeCardProps {
  challenge: ChallengeWithDetails & {
    challenge_matches?: any[] // From API response
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
        return <Clock className="h-4 w-4 animate-pulse text-warning" />
      case 'accepted':
        return <Swords className="h-4 w-4 text-primary" />
      case 'declined':
        return <XCircle className="h-4 w-4 text-destructive" />
      case 'completed':
        return challenge.winner_id === currentUserId ? (
          <Trophy className="h-4 w-4 text-warning" />
        ) : challenge.winner_id ? (
          <ShieldX className="h-4 w-4 text-destructive" />
        ) : (
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        )
      default:
        return null
    }
  }

  const getStatusColor = () => {
    switch (challenge.status) {
      case 'pending':
        return 'warning'
      case 'accepted':
        return 'default'
      case 'declined':
        return 'destructive'
      case 'completed':
        return challenge.winner_id === currentUserId
          ? 'success'
          : challenge.winner_id
            ? 'destructive'
            : 'secondary'
      default:
        return 'secondary'
    }
  }

  const getStatusLabel = () => {
    switch (challenge.status) {
      case 'pending':
        return isChallenged ? '⏳ Venter på deg' : '⏳ Venter på svar'
      case 'accepted':
        return '⚔️ Kamp pågår'
      case 'declined':
        return '❌ Avslått'
      case 'completed':
        if (challenge.winner_id === currentUserId) return '🏆 Du vant!'
        if (challenge.winner_id) return '💔 Du tapte'
        return '🤝 Uavgjort'
      default:
        return challenge.status
    }
  }

  const getStatusGradient = () => {
    switch (challenge.status) {
      case 'pending':
        return 'from-warning/20 to-warning/5'
      case 'accepted':
        return 'from-primary/20 to-primary/5'
      case 'declined':
        return 'from-destructive/20 to-destructive/5'
      case 'completed':
        return challenge.winner_id === currentUserId
          ? 'from-success/20 to-success/5'
          : challenge.winner_id
            ? 'from-destructive/20 to-destructive/5'
            : 'from-secondary/20 to-secondary/5'
      default:
        return 'from-secondary/20 to-secondary/5'
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

  // Calculate win streak
  const getWinStreak = (user: any) => {
    // This would be calculated from user's recent challenges
    // For now, we'll use a simple check
    return user.challenge_wins > 5 && user.challenge_losses === 0
      ? user.challenge_wins
      : 0
  }

  // Determine challenge difficulty/rarity
  const getChallengeRarity = () => {
    if (challenge.stake_points >= 100) return 'legendary'
    if (challenge.stake_points >= 50) return 'epic'
    if (challenge.stake_points >= 20) return 'rare'
    // Check for challenge_matches (from API) or matches (from type)
    const matchCount =
      challenge.challenge_matches?.length || challenge.matches?.length || 0
    if (matchCount >= 5) return 'rare'
    return 'common'
  }

  const rarity = getChallengeRarity()

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-shadow hover:shadow-md',
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
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
            <CardTitle className="flex items-center gap-2 text-lg">
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
                <span className="flex items-center gap-1 text-warning">
                  <Timer className="h-3 w-3" />
                  Utløper{' '}
                  {formatDistanceToNow(new Date(challenge.expires_at), {
                    addSuffix: true,
                  })}
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={getStatusColor() as any} className="shadow-sm">
              <AnimatePresence mode="wait">
                <motion.span
                  key={challenge.status}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex items-center gap-1"
                >
                  {getStatusLabel()}
                </motion.span>
              </AnimatePresence>
            </Badge>
            {challenge.stake_points > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
              >
                <Badge
                  variant="outline"
                  className="gap-1 border-amber-500/50 bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                >
                  <Zap className="h-3 w-3" />
                  {challenge.stake_points} poeng
                </Badge>
              </motion.div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {/* Opponent Info */}
        <motion.div
          className="flex items-center justify-between rounded-lg bg-muted/50 p-3 backdrop-blur-sm"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="border-2 border-background shadow-md">
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20">
                  {opponent.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Badges for achievements */}
              <div className="absolute -right-1 -top-1 flex">
                {opponent.challenge_wins > 20 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500 }}
                  >
                    <Crown className="h-4 w-4 text-amber-500" />
                  </motion.div>
                )}
                {opponent.challenge_wins > 10 &&
                  opponent.challenge_wins <= 20 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500 }}
                    >
                      <Medal className="h-4 w-4 text-purple-500" />
                    </motion.div>
                  )}
                {getWinStreak(opponent) >= 5 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, delay: 0.1 }}
                    className="-ml-1"
                  >
                    <Flame className="h-4 w-4 text-orange-500" />
                  </motion.div>
                )}
              </div>
            </div>
            <div>
              <p className="flex items-center gap-1 font-medium">
                {opponent.username}
                {opponent.challenge_wins > 20 && (
                  <Badge
                    variant="outline"
                    className="h-4 border-amber-500/50 px-1 text-[10px] text-amber-600 dark:text-amber-400"
                  >
                    Legende
                  </Badge>
                )}
                {opponent.challenge_wins > 10 &&
                  opponent.challenge_wins <= 20 && (
                    <Badge
                      variant="outline"
                      className="h-4 border-purple-500/50 px-1 text-[10px] text-purple-600 dark:text-purple-400"
                    >
                      Veteran
                    </Badge>
                  )}
                {getWinStreak(opponent) >= 5 && (
                  <Badge
                    variant="outline"
                    className="h-4 border-orange-500/50 px-1 text-[10px] text-orange-600 dark:text-orange-400"
                  >
                    <Flame className="mr-0.5 h-2.5 w-2.5" />
                    {getWinStreak(opponent)} streak
                  </Badge>
                )}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <motion.div
                    className="h-2 w-2 rounded-full bg-success"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  {opponent.challenge_wins}S
                </span>
                <span className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-destructive" />
                  {opponent.challenge_losses}T
                </span>
                <span className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                  {opponent.challenge_draws}U
                </span>
              </div>
            </div>
          </div>
          {opponent.challenge_wins +
            opponent.challenge_losses +
            opponent.challenge_draws >
            0 && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Vinnerprosent</p>
              <div className="flex items-center justify-end gap-1">
                {(opponent.challenge_wins /
                  (opponent.challenge_wins +
                    opponent.challenge_losses +
                    opponent.challenge_draws)) *
                  100 >=
                60 ? (
                  <TrendingUp className="h-3 w-3 text-success" />
                ) : (opponent.challenge_wins /
                    (opponent.challenge_wins +
                      opponent.challenge_losses +
                      opponent.challenge_draws)) *
                    100 <=
                  40 ? (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                ) : null}
                <p className="font-semibold">
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
            </div>
          )}
        </motion.div>

        {/* Message */}
        <AnimatePresence>
          {challenge.message && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 rounded-lg border border-border/50 bg-muted/30 p-3 backdrop-blur-sm">
                <MessageSquare className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <p className="text-sm italic">
                  &ldquo;{challenge.message}&rdquo;
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Match Progress */}
        <AnimatePresence>
          {challenge.status === 'accepted' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              <div className="flex justify-between text-sm font-medium">
                <span>Kampfremgang</span>
                <motion.span
                  key={calculateProgress()}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-primary"
                >
                  {(() => {
                    const matches =
                      challenge.matches || challenge.challenge_matches || []
                    const completed = matches.filter(
                      (cm) => cm.match?.is_finished,
                    ).length
                    return `${completed} / ${matches.length}`
                  })()}
                </motion.span>
              </div>
              <div className="relative">
                <Progress value={calculateProgress()} className="h-2" />
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: calculateProgress() > 50 ? 1 : 0 }}
                >
                  <span className="text-[10px] font-medium text-primary-foreground">
                    {calculateProgress().toFixed(0)}%
                  </span>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scores (if in progress or completed) */}
        <AnimatePresence>
          {(challenge.status === 'accepted' ||
            challenge.status === 'completed') && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative overflow-hidden"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10" />
              <div className="flex items-center justify-between rounded-lg border border-border/50 bg-card/50 p-4 backdrop-blur-sm">
                <motion.div
                  className="flex-1 text-center"
                  animate={{
                    scale: challengerScore > challengedScore ? [1, 1.05, 1] : 1,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.p
                    className="text-3xl font-bold"
                    key={challengerScore}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    {challengerScore}
                  </motion.p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {challenge.challenger.username}
                  </p>
                </motion.div>
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Swords className="h-6 w-6 text-primary/50" />
                </motion.div>
                <motion.div
                  className="flex-1 text-center"
                  animate={{
                    scale: challengedScore > challengerScore ? [1, 1.05, 1] : 1,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.p
                    className="text-3xl font-bold"
                    key={challengedScore}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    {challengedScore}
                  </motion.p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {challenge.challenged.username}
                  </p>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Winner Display */}
        <AnimatePresence>
          {challenge.status === 'completed' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
            >
              <div
                className={cn(
                  'relative overflow-hidden rounded-lg p-4 text-center',
                  challenge.winner_id === currentUserId
                    ? 'border border-success/20 bg-gradient-to-br from-success/20 to-success/5'
                    : challenge.winner_id
                      ? 'border border-destructive/20 bg-gradient-to-br from-destructive/20 to-destructive/5'
                      : 'border border-border bg-gradient-to-br from-muted to-muted/50',
                )}
              >
                {challenge.winner_id ? (
                  <motion.div
                    className="flex items-center justify-center gap-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, delay: 0.3 }}
                  >
                    <Trophy
                      className={cn(
                        'h-5 w-5',
                        challenge.winner_id === currentUserId
                          ? 'text-success'
                          : 'text-destructive',
                      )}
                    />
                    <span className="text-lg font-semibold">
                      {challenge.winner_id === currentUserId
                        ? 'Du vant!'
                        : `${challenge.winner?.username} vant!`}
                    </span>
                  </motion.div>
                ) : (
                  <motion.span
                    className="font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    Det ble uavgjort!
                  </motion.span>
                )}
                {challenge.stake_points > 0 && challenge.winner_id && (
                  <motion.p
                    className="mt-2 text-sm text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    {challenge.winner_id === currentUserId ? '+' : '-'}
                    {challenge.stake_points} poeng
                  </motion.p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {challenge.status === 'pending' && isChallenged && (
              <motion.div
                key="pending-actions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex gap-2"
              >
                <Button
                  onClick={handleAccept}
                  disabled={isLoading}
                  className="flex-1 shadow-md transition-all duration-200 hover:shadow-lg"
                  size="lg"
                >
                  <AnimatePresence mode="wait">
                    {isLoading && action === 'accept' ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="check"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  Aksepter
                </Button>
                <Button
                  onClick={handleDecline}
                  disabled={isLoading}
                  variant="outline"
                  className="flex-1 shadow-sm transition-all duration-200 hover:shadow-md"
                  size="lg"
                >
                  <AnimatePresence mode="wait">
                    {isLoading && action === 'decline' ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="x"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  Avslå
                </Button>
              </motion.div>
            )}

            {(challenge.status === 'accepted' ||
              challenge.status === 'completed') && (
              <motion.div
                key="details-action"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                <Button
                  onClick={() => router.push(`/challenges/${challenge.id}`)}
                  variant="outline"
                  className="group w-full transition-all duration-200 hover:shadow-md"
                  size="lg"
                >
                  <Gamepad2 className="mr-2 h-4 w-4" />
                  Se Kampdetaljer
                  <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                {challenge.status === 'completed' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Button
                      onClick={() => {
                        // TODO: Implement quick rematch
                        toast({
                          title: 'Revansj',
                          description: 'Revansjfunksjon kommer snart!',
                        })
                      }}
                      variant="default"
                      className="w-full bg-gradient-to-r from-primary to-primary/80 shadow-md transition-all duration-200 hover:shadow-lg"
                      size="lg"
                    >
                      <Target className="mr-2 h-4 w-4" />
                      Utfordre til revansj
                      <Sparkles className="ml-1 h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}
