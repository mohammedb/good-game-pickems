'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Trophy,
  ShieldX,
  Handshake,
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  Zap,
  Clock,
  User,
  BarChart3,
  Filter,
  ChevronRight,
  Sparkles,
  Flame,
} from 'lucide-react'
import { format } from 'date-fns'
import { ChallengeWithDetails } from '@/lib/challenges/types'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'

interface ChallengeHistoryProps {
  challenges: ChallengeWithDetails[]
  currentUserId: string
}

interface HistoryStats {
  totalChallenges: number
  wins: number
  losses: number
  draws: number
  winRate: number
  pointsWon: number
  pointsLost: number
  currentStreak: number
  bestStreak: number
  mostFrequentOpponent: {
    username: string
    matchCount: number
    record: string
  } | null
}

export function ChallengeHistory({
  challenges,
  currentUserId,
}: ChallengeHistoryProps) {
  const [filter, setFilter] = useState<'all' | 'wins' | 'losses' | 'draws'>(
    'all',
  )
  const [timeRange, setTimeRange] = useState<'all' | 'month' | 'week'>('all')

  // Calculate stats
  const calculateStats = (): HistoryStats => {
    const completedChallenges = challenges.filter(
      (c) => c.status === 'completed',
    )
    const wins = completedChallenges.filter(
      (c) => c.winner_id === currentUserId,
    ).length
    const losses = completedChallenges.filter(
      (c) => c.winner_id && c.winner_id !== currentUserId,
    ).length
    const draws = completedChallenges.filter((c) => !c.winner_id).length

    // Calculate streaks
    let currentStreak = 0
    let bestStreak = 0
    let tempStreak = 0

    completedChallenges
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .forEach((challenge, index) => {
        if (challenge.winner_id === currentUserId) {
          tempStreak++
          if (index === 0) currentStreak = tempStreak
          bestStreak = Math.max(bestStreak, tempStreak)
        } else {
          tempStreak = 0
          if (index === 0) currentStreak = 0
        }
      })

    // Calculate opponent stats
    const opponentMap = new Map<
      string,
      { wins: number; losses: number; draws: number; username: string }
    >()

    completedChallenges.forEach((challenge) => {
      const opponent =
        challenge.challenger_id === currentUserId
          ? challenge.challenged
          : challenge.challenger
      const key = opponent.id

      if (!opponentMap.has(key)) {
        opponentMap.set(key, {
          wins: 0,
          losses: 0,
          draws: 0,
          username: opponent.username,
        })
      }

      const stats = opponentMap.get(key)!
      if (challenge.winner_id === currentUserId) {
        stats.wins++
      } else if (challenge.winner_id) {
        stats.losses++
      } else {
        stats.draws++
      }
    })

    let mostFrequentOpponent = null
    let maxMatches = 0

    opponentMap.forEach((stats, id) => {
      const totalMatches = stats.wins + stats.losses + stats.draws
      if (totalMatches > maxMatches) {
        maxMatches = totalMatches
        mostFrequentOpponent = {
          username: stats.username,
          matchCount: totalMatches,
          record: `${stats.wins}S-${stats.losses}T-${stats.draws}U`,
        }
      }
    })

    // Calculate points
    const pointsWon = completedChallenges
      .filter((c) => c.winner_id === currentUserId && c.stake_points > 0)
      .reduce((sum, c) => sum + c.stake_points, 0)

    const pointsLost = completedChallenges
      .filter(
        (c) =>
          c.winner_id && c.winner_id !== currentUserId && c.stake_points > 0,
      )
      .reduce((sum, c) => sum + c.stake_points, 0)

    return {
      totalChallenges: completedChallenges.length,
      wins,
      losses,
      draws,
      winRate:
        completedChallenges.length > 0
          ? (wins / completedChallenges.length) * 100
          : 0,
      pointsWon,
      pointsLost,
      currentStreak,
      bestStreak,
      mostFrequentOpponent,
    }
  }

  const stats = calculateStats()

  // Filter challenges
  const getFilteredChallenges = () => {
    let filtered = challenges.filter((c) => c.status === 'completed')

    // Apply result filter
    switch (filter) {
      case 'wins':
        filtered = filtered.filter((c) => c.winner_id === currentUserId)
        break
      case 'losses':
        filtered = filtered.filter(
          (c) => c.winner_id && c.winner_id !== currentUserId,
        )
        break
      case 'draws':
        filtered = filtered.filter((c) => !c.winner_id)
        break
    }

    // Apply time filter
    const now = new Date()
    switch (timeRange) {
      case 'week':
        filtered = filtered.filter((c) => {
          const created = new Date(c.created_at)
          const diffDays =
            (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
          return diffDays <= 7
        })
        break
      case 'month':
        filtered = filtered.filter((c) => {
          const created = new Date(c.created_at)
          const diffDays =
            (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
          return diffDays <= 30
        })
        break
    }

    return filtered.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
  }

  // Prepare chart data
  const prepareChartData = () => {
    const completedChallenges = challenges
      .filter((c) => c.status === 'completed')
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )

    let runningWins = 0
    let runningTotal = 0

    return completedChallenges.map((challenge, index) => {
      runningTotal++
      if (challenge.winner_id === currentUserId) runningWins++

      return {
        date: format(new Date(challenge.created_at), 'dd/MM'),
        winRate:
          runningTotal > 0 ? Math.round((runningWins / runningTotal) * 100) : 0,
        total: runningTotal,
      }
    })
  }

  const chartData = prepareChartData()
  const filteredChallenges = getFilteredChallenges()

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 bg-gradient-to-br from-background to-muted/20 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              Vinnerprosent
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {stats.winRate.toFixed(1)}%
              </span>
              {stats.winRate >= 50 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats.wins}S - {stats.losses}T - {stats.draws}U
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-background to-muted/20 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              Nåværende Streak
              <Flame className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{stats.currentStreak}</span>
              {stats.currentStreak >= 3 && (
                <Flame className="h-4 w-4 animate-pulse text-orange-500" />
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Beste: {stats.bestStreak} seire
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-background to-muted/20 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              Poeng Balanse
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  'text-2xl font-bold',
                  stats.pointsWon - stats.pointsLost >= 0
                    ? 'text-success'
                    : 'text-destructive',
                )}
              >
                {stats.pointsWon - stats.pointsLost >= 0 ? '+' : ''}
                {stats.pointsWon - stats.pointsLost}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Vunnet: {stats.pointsWon} • Tapt: {stats.pointsLost}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-background to-muted/20 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              Hovedrival
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.mostFrequentOpponent ? (
              <>
                <p className="truncate text-lg font-bold">
                  {stats.mostFrequentOpponent.username}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stats.mostFrequentOpponent.matchCount} kamper •{' '}
                  {stats.mostFrequentOpponent.record}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Ingen kamper ennå</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Win Rate Chart */}
      {chartData.length > 2 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Vinnerprosent Over Tid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="colorWinRate"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(0, 0, 0, 0.8)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 12px',
                    }}
                    formatter={(value: any) => `${value}%`}
                  />
                  <Area
                    type="monotone"
                    dataKey="winRate"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorWinRate)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History List */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Kamphistorikk
            </CardTitle>
            <div className="flex gap-2">
              <Tabs
                value={timeRange}
                onValueChange={(v) => setTimeRange(v as any)}
              >
                <TabsList className="h-8">
                  <TabsTrigger value="all" className="text-xs">
                    Alle
                  </TabsTrigger>
                  <TabsTrigger value="month" className="text-xs">
                    Måned
                  </TabsTrigger>
                  <TabsTrigger value="week" className="text-xs">
                    Uke
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            value={filter}
            onValueChange={(v) => setFilter(v as any)}
            className="w-full"
          >
            <TabsList className="mb-4 grid w-full grid-cols-4">
              <TabsTrigger value="all">
                Alle (
                {challenges.filter((c) => c.status === 'completed').length})
              </TabsTrigger>
              <TabsTrigger value="wins" className="text-success">
                Seire ({stats.wins})
              </TabsTrigger>
              <TabsTrigger value="losses" className="text-destructive">
                Tap ({stats.losses})
              </TabsTrigger>
              <TabsTrigger value="draws">Uavgjort ({stats.draws})</TabsTrigger>
            </TabsList>

            <div className="space-y-3">
              {filteredChallenges.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Trophy className="mx-auto mb-3 h-12 w-12 opacity-20" />
                  <p>Ingen kamper i valgt periode</p>
                </div>
              ) : (
                filteredChallenges.map((challenge, index) => {
                  const isChallenger = challenge.challenger_id === currentUserId
                  const opponent = isChallenger
                    ? challenge.challenged
                    : challenge.challenger
                  const won = challenge.winner_id === currentUserId
                  const lost =
                    challenge.winner_id && challenge.winner_id !== currentUserId
                  const draw = !challenge.winner_id

                  return (
                    <motion.div
                      key={challenge.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        className={cn(
                          'cursor-pointer p-4 transition-all hover:shadow-md',
                          won && 'border-success/20 bg-success/5',
                          lost && 'border-destructive/20 bg-destructive/5',
                          draw && 'border-muted',
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {opponent.username[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="flex items-center gap-2 font-medium">
                                vs {opponent.username}
                                {challenge.stake_points > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="gap-0.5 text-xs"
                                  >
                                    <Zap className="h-2.5 w-2.5" />
                                    {challenge.stake_points}
                                  </Badge>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(
                                  new Date(challenge.created_at),
                                  'dd. MMM yyyy',
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {challenge.picks?.filter(
                                  (p) =>
                                    p.user_id === currentUserId && p.is_correct,
                                ).length || 0}
                                -
                                {challenge.picks?.filter(
                                  (p) =>
                                    p.user_id !== currentUserId && p.is_correct,
                                ).length || 0}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {challenge.matches.length} kamper
                              </p>
                            </div>
                            <div
                              className={cn(
                                'rounded-full p-2',
                                won && 'bg-success/10',
                                lost && 'bg-destructive/10',
                                draw && 'bg-muted',
                              )}
                            >
                              {won ? (
                                <Trophy className="h-4 w-4 text-success" />
                              ) : lost ? (
                                <ShieldX className="h-4 w-4 text-destructive" />
                              ) : (
                                <Handshake className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  )
                })
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
