'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/use-toast'
import {
  ArrowLeft,
  Trophy,
  Swords,
  CheckCircle,
  XCircle,
  Calendar,
  TrendingUp,
  Loader2,
  AlertCircle,
  Zap,
  Shield,
  Target,
  Clock,
  Sparkles,
} from 'lucide-react'
import { format } from 'date-fns'
import { ChallengeWithDetails } from '@/lib/challenges/types'
import { createBrowserClient } from '@/utils/supabase-client'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { NumberTicker } from '@/components/magicui/number-ticker'

interface MatchPick {
  match_id: string
  team1: string
  team2: string
  team1_id: string
  team2_id: string
  team1_logo?: string
  team2_logo?: string
  start_time: string
  is_finished: boolean
  winner_id: string | null
  user_pick?: string
  opponent_pick?: string
  user_correct?: boolean
  opponent_correct?: boolean
}

export default function ChallengeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [challenge, setChallenge] = useState<ChallengeWithDetails | null>(null)
  const [matchPicks, setMatchPicks] = useState<MatchPick[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [selectedPicks, setSelectedPicks] = useState<Record<string, string>>({})

  const supabase = createBrowserClient()
  const challengeId = params.id as string

  const fetchChallengeDetails = async () => {
    try {
      setLoading(true)

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setCurrentUserId(user.id)

      // Fetch challenge details
      const response = await fetch(`/api/challenges/${challengeId}`)
      if (!response.ok) throw new Error('Failed to fetch challenge')

      const data = await response.json()
      const challengeData = data.challenge as ChallengeWithDetails
      setChallenge(challengeData)

      // Process match picks
      if ((challengeData as any).challenge_matches) {
        const picks: MatchPick[] = (challengeData as any).challenge_matches.map(
          (cm: any) => {
            const userPick = challengeData.user_picks?.find(
              (p) => p.match_id === cm.match_id,
            )
            const opponentPick = challengeData.opponent_picks?.find(
              (p) => p.match_id === cm.match_id,
            )
            const match = Array.isArray(cm.matches) ? cm.matches[0] : cm.matches

            return {
              match_id: cm.match_id,
              team1: match.team1,
              team2: match.team2,
              team1_logo: match.team1_logo,
              team2_logo: match.team2_logo,
              team1_id: match.team1_id,
              team2_id: match.team2_id,
              start_time: match.start_time,
              is_finished: match.is_finished,
              winner_id: match.winner_id,
              user_pick: userPick?.predicted_winner,
              opponent_pick: opponentPick?.predicted_winner,
              user_correct: userPick?.is_correct || false,
              opponent_correct: opponentPick?.is_correct || false,
            }
          },
        )

        setMatchPicks(picks)

        // Initialize selected picks
        const initialPicks: Record<string, string> = {}
        picks.forEach((pick) => {
          if (pick.user_pick) {
            initialPicks[pick.match_id] = pick.user_pick
          }
        })
        setSelectedPicks(initialPicks)
      }
    } catch (error) {
      console.error('Error fetching challenge:', error)
      toast({
        title: 'Error',
        description: 'Failed to load challenge details',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChallengeDetails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeId])

  const handlePickChange = (matchId: string, teamId: string) => {
    setSelectedPicks((prev) => ({
      ...prev,
      [matchId]: teamId,
    }))
  }

  const handleSubmitPick = async (matchId: string) => {
    if (!selectedPicks[matchId]) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/challenges/${challengeId}/picks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_id: matchId,
          predicted_winner: selectedPicks[matchId],
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit pick')
      }

      toast({
        title: 'Pick Submitted',
        description: 'Your prediction has been saved',
      })

      // Refresh challenge details
      await fetchChallengeDetails()
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to submit pick',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-48 w-full rounded-lg" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-96 w-full rounded-lg" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  if (!challenge || !currentUserId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Challenge not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  const isChallenger = challenge.challenger_id === currentUserId
  const opponent = isChallenger ? challenge.challenged : challenge.challenger
  const userScore = matchPicks.filter((p) => p.user_correct).length
  const opponentScore = matchPicks.filter((p) => p.opponent_correct).length

  return (
    <div className="container mx-auto max-w-5xl space-y-6 px-4 py-4 sm:py-8">
      {/* Header */}
      <motion.div
        className="flex items-center gap-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/')}
          className="transition-transform hover:scale-110"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
          <Target className="h-5 w-5 text-primary" />
          Utfordringsdetaljer
        </h1>
      </motion.div>

      {/* Challenge Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="overflow-hidden border-0 shadow-xl">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
          <CardHeader className="relative">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div className="space-y-2">
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <Swords className="h-5 w-5 text-primary" />
                  </motion.div>
                  <span className="truncate">
                    {challenge.challenger.username} vs{' '}
                    {challenge.challenged.username}
                  </span>
                </CardTitle>
                <CardDescription className="flex items-center gap-3">
                  <Calendar className="h-4 w-4" />
                  Opprettet{' '}
                  {format(
                    new Date(challenge.created_at),
                    'dd. MMM yyyy, HH:mm',
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    challenge.status === 'completed'
                      ? challenge.winner_id === currentUserId
                        ? 'default'
                        : 'destructive'
                      : challenge.status === 'accepted'
                        ? 'default'
                        : 'secondary'
                  }
                  className="shadow-sm"
                >
                  {challenge.status === 'accepted'
                    ? 'Aktiv'
                    : challenge.status === 'completed'
                      ? 'Fullført'
                      : challenge.status}
                </Badge>
                {challenge.stake_points > 0 && (
                  <Badge
                    variant="outline"
                    className="gap-1 border-amber-500/50 bg-amber-500/10 text-amber-700 shadow-sm dark:bg-amber-500/20 dark:text-amber-300"
                  >
                    <Zap className="h-3 w-3" />
                    {challenge.stake_points} poeng
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative space-y-6">
            {/* Score Display */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="relative overflow-hidden"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10" />
              <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
                <motion.div
                  className="flex-1 text-center"
                  animate={{
                    scale: userScore > opponentScore ? [1, 1.05, 1] : 1,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className="text-4xl font-bold sm:text-5xl"
                    key={userScore}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <NumberTicker value={userScore} />
                  </motion.div>
                  <p className="mt-2 text-sm font-medium text-muted-foreground">
                    Du
                  </p>
                  {userScore > opponentScore &&
                    challenge.status === 'completed' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: 'spring' }}
                      >
                        <Trophy className="mx-auto mt-2 h-5 w-5 text-warning" />
                      </motion.div>
                    )}
                </motion.div>
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="px-4"
                >
                  <Swords className="h-8 w-8 text-primary/50" />
                </motion.div>
                <motion.div
                  className="flex-1 text-center"
                  animate={{
                    scale: opponentScore > userScore ? [1, 1.05, 1] : 1,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className="text-4xl font-bold sm:text-5xl"
                    key={opponentScore}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <NumberTicker value={opponentScore} />
                  </motion.div>
                  <p className="mt-2 text-sm font-medium text-muted-foreground">
                    {opponent.username}
                  </p>
                  {opponentScore > userScore &&
                    challenge.status === 'completed' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: 'spring' }}
                      >
                        <Trophy className="mx-auto mt-2 h-5 w-5 text-warning" />
                      </motion.div>
                    )}
                </motion.div>
              </div>
            </motion.div>

            {/* Winner Display */}
            <AnimatePresence>
              {challenge.status === 'completed' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ type: 'spring', stiffness: 300, delay: 0.3 }}
                >
                  <Alert
                    className={cn(
                      'relative overflow-hidden border',
                      challenge.winner_id === currentUserId
                        ? 'border-success/20 bg-gradient-to-br from-success/20 to-success/5'
                        : challenge.winner_id
                          ? 'border-destructive/20 bg-gradient-to-br from-destructive/20 to-destructive/5'
                          : 'border-border bg-gradient-to-br from-muted to-muted/50',
                    )}
                  >
                    {challenge.winner_id && (
                      <motion.div
                        className="absolute -right-10 -top-10 opacity-10"
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 20,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                      >
                        <Trophy className="h-32 w-32" />
                      </motion.div>
                    )}
                    <div className="relative flex items-start gap-3">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: 'spring',
                          stiffness: 300,
                          delay: 0.4,
                        }}
                      >
                        {challenge.winner_id ? (
                          <Trophy
                            className={cn(
                              'mt-0.5 h-5 w-5',
                              challenge.winner_id === currentUserId
                                ? 'text-success'
                                : 'text-destructive',
                            )}
                          />
                        ) : (
                          <Shield className="mt-0.5 h-5 w-5 text-muted-foreground" />
                        )}
                      </motion.div>
                      <AlertDescription className="text-base font-medium">
                        {challenge.winner_id === currentUserId
                          ? 'Gratulerer! Du vant denne utfordringen!'
                          : challenge.winner_id
                            ? `${challenge.winner?.username} vant denne utfordringen`
                            : 'Det ble uavgjort!'}
                        {challenge.stake_points > 0 && challenge.winner_id && (
                          <motion.span
                            className="mt-1 block text-sm text-muted-foreground"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                          >
                            {challenge.winner_id === currentUserId
                              ? `Du vant ${challenge.stake_points} poeng!`
                              : `Du tapte ${challenge.stake_points} poeng.`}
                          </motion.span>
                        )}
                      </AlertDescription>
                    </div>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Match Predictions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="overflow-hidden border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Kampprediksjoner
            </CardTitle>
            <CardDescription>
              {challenge.status === 'accepted'
                ? 'Gjør dine prediksjoner før kampene starter'
                : 'Se alle prediksjoner og resultater'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <AnimatePresence>
                {matchPicks.map((pick, index) => {
                  const matchStarted = new Date(pick.start_time) <= new Date()
                  const canEdit =
                    challenge.status === 'accepted' && !matchStarted

                  return (
                    <motion.div
                      key={pick.match_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="border-border/50 p-4 transition-all duration-200 hover:shadow-lg sm:p-6">
                        <div className="space-y-4">
                          {/* Match Info */}
                          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                            <div className="flex items-center gap-2 sm:gap-4">
                              <span className="text-base font-semibold sm:text-lg">
                                {pick.team1}
                              </span>
                              <span className="text-muted-foreground">vs</span>
                              <span className="text-base font-semibold sm:text-lg">
                                {pick.team2}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="gap-1 text-xs"
                              >
                                <Calendar className="h-3 w-3" />
                                {format(
                                  new Date(pick.start_time),
                                  'dd. MMM HH:mm',
                                )}
                              </Badge>
                              {pick.is_finished && (
                                <Badge variant="secondary" className="gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Ferdig
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Predictions */}
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {/* Your Pick */}
                            <div className="space-y-3">
                              <p className="flex items-center gap-2 text-sm font-medium">
                                <Shield className="h-4 w-4 text-primary" />
                                Din prediksjon
                              </p>
                              {canEdit ? (
                                <div className="flex gap-2">
                                  <motion.div
                                    className="flex-1"
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <Button
                                      size="lg"
                                      variant={
                                        selectedPicks[pick.match_id] ===
                                        pick.team1_id
                                          ? 'default'
                                          : 'outline'
                                      }
                                      onClick={() =>
                                        handlePickChange(
                                          pick.match_id,
                                          pick.team1_id,
                                        )
                                      }
                                      className="h-auto w-full px-4 py-3 transition-all duration-200"
                                    >
                                      <span className="font-medium">
                                        {pick.team1}
                                      </span>
                                    </Button>
                                  </motion.div>
                                  <motion.div
                                    className="flex-1"
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <Button
                                      size="lg"
                                      variant={
                                        selectedPicks[pick.match_id] ===
                                        pick.team2_id
                                          ? 'default'
                                          : 'outline'
                                      }
                                      onClick={() =>
                                        handlePickChange(
                                          pick.match_id,
                                          pick.team2_id,
                                        )
                                      }
                                      className="h-auto w-full px-4 py-3 transition-all duration-200"
                                    >
                                      <span className="font-medium">
                                        {pick.team2}
                                      </span>
                                    </Button>
                                  </motion.div>
                                </div>
                              ) : pick.user_pick ? (
                                <motion.div
                                  className="flex items-center gap-2"
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                >
                                  <Badge
                                    variant={
                                      pick.user_correct
                                        ? 'default'
                                        : pick.is_finished
                                          ? 'destructive'
                                          : 'secondary'
                                    }
                                    className="px-3 py-1.5 text-sm"
                                  >
                                    {pick.user_pick === pick.team1_id
                                      ? pick.team1
                                      : pick.team2}
                                  </Badge>
                                  <AnimatePresence>
                                    {pick.is_finished && (
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                        transition={{
                                          type: 'spring',
                                          stiffness: 300,
                                        }}
                                      >
                                        {pick.user_correct ? (
                                          <CheckCircle className="h-5 w-5 text-success" />
                                        ) : (
                                          <XCircle className="h-5 w-5 text-destructive" />
                                        )}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.div>
                              ) : (
                                <span className="text-sm italic text-muted-foreground">
                                  Ingen prediksjon gjort
                                </span>
                              )}
                            </div>

                            {/* Opponent Pick */}
                            <div className="space-y-3">
                              <p className="flex items-center gap-2 text-sm font-medium">
                                <Shield className="h-4 w-4 text-secondary" />
                                {opponent.username}s prediksjon
                              </p>
                              {matchStarted ||
                              challenge.status === 'completed' ? (
                                pick.opponent_pick ? (
                                  <motion.div
                                    className="flex items-center gap-2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                  >
                                    <Badge
                                      variant={
                                        pick.opponent_correct
                                          ? 'default'
                                          : pick.is_finished
                                            ? 'destructive'
                                            : 'secondary'
                                      }
                                      className="px-3 py-1.5 text-sm"
                                    >
                                      {pick.opponent_pick === pick.team1_id
                                        ? pick.team1
                                        : pick.team2}
                                    </Badge>
                                    <AnimatePresence>
                                      {pick.is_finished && (
                                        <motion.div
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          exit={{ scale: 0 }}
                                          transition={{
                                            type: 'spring',
                                            stiffness: 300,
                                          }}
                                        >
                                          {pick.opponent_correct ? (
                                            <CheckCircle className="h-5 w-5 text-success" />
                                          ) : (
                                            <XCircle className="h-5 w-5 text-destructive" />
                                          )}
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </motion.div>
                                ) : (
                                  <span className="text-sm italic text-muted-foreground">
                                    Ingen prediksjon gjort
                                  </span>
                                )
                              ) : (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  <span>Skjult til kampen starter</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Submit Button */}
                          <AnimatePresence>
                            {canEdit &&
                              selectedPicks[pick.match_id] &&
                              selectedPicks[pick.match_id] !==
                                pick.user_pick && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <Button
                                    onClick={() =>
                                      handleSubmitPick(pick.match_id)
                                    }
                                    disabled={submitting}
                                    size="lg"
                                    className="mt-3 w-full shadow-md transition-all duration-200 hover:shadow-lg"
                                  >
                                    <AnimatePresence mode="wait">
                                      {submitting ? (
                                        <motion.div
                                          key="loading"
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          exit={{ opacity: 0 }}
                                          className="flex items-center gap-2"
                                        >
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                          Lagrer...
                                        </motion.div>
                                      ) : (
                                        <motion.div
                                          key="save"
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          exit={{ opacity: 0 }}
                                          className="flex items-center gap-2"
                                        >
                                          <CheckCircle className="h-4 w-4" />
                                          Lagre prediksjon
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </Button>
                                </motion.div>
                              )}
                          </AnimatePresence>

                          {/* Match Result */}
                          <AnimatePresence>
                            {pick.is_finished && pick.winner_id && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ delay: 0.2 }}
                              >
                                <Alert className="border-primary/20 bg-muted/50">
                                  <Trophy className="h-4 w-4 text-primary" />
                                  <AlertDescription className="font-medium">
                                    Vinner:{' '}
                                    <strong>
                                      {pick.winner_id === pick.team1_id
                                        ? pick.team1
                                        : pick.team2}
                                    </strong>
                                  </AlertDescription>
                                </Alert>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
