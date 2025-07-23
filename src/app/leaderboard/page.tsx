'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProgressBar } from '@/components/ui/progress-bar'
import { BadgeCard } from '@/components/ui/badge-card'
import { createBrowserClient } from '@/utils/supabase-client'
import { SparklesText } from '@/components/magicui/sparkles-text'
import { NumberTicker } from '@/components/magicui/number-ticker'
import confetti from 'canvas-confetti'
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { RealtimeChannel } from '@supabase/supabase-js'
import Image from 'next/image'

type TimeRange = 'all' | 'weekly' | 'monthly'

interface LeaderboardEntry {
  user_id: string
  username: string
  points: number
  correct_picks: number
  total_picks: number
  map_score_points: number
  recentCorrectPicks?: RecentCorrectPick[]
  previousRank?: number
  currentRank?: number
  rankChange?: 'up' | 'down' | 'same' | 'new'
  winRate?: number
}

interface RecentCorrectPick {
  id: string
  match_id: string
  predicted_winner: string
  team1: string
  team2: string
  team1_logo: string | null
  team2_logo: string | null
  team1_score: number | null
  team2_score: number | null
  team1_map_score: number | null
  team2_map_score: number | null
  points_earned: number
  map_score_points: number
  match_date: string
  created_at: string
  round: string | null
}

interface LeaderboardResult {
  user_id: string
  username: string | null
  correct_picks: number
  total_picks: number
  map_score_points: number
  total_points: number
}

const getRankBadge = (index: number) => {
  if (index === 0) return { icon: 'crown' as const, variant: 'gold' as const }
  if (index === 1) return { icon: 'medal' as const, variant: 'silver' as const }
  if (index === 2) return { icon: 'medal' as const, variant: 'bronze' as const }
  return { icon: 'star' as const, variant: 'bronze' as const }
}

export default function LeaderboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('all')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>(
    {},
  )
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false)
  const previousLeaderboardRef = useRef<LeaderboardEntry[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const itemsPerPage = 20
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  const supabase = createBrowserClient()

  const triggerConfetti = () => {
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min
    }

    const interval: NodeJS.Timeout = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FFA500', '#FF6347'],
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FFA500', '#FF6347'],
      })
    }, 250)
  }

  const toggleUserExpand = (userId: string) => {
    setExpandedUsers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }))
  }

  const fetchLeaderboard = async () => {
    setIsLoading(true)
    setError(null)
    setExpandedUsers({})

    try {
      const now = new Date()
      let timeFilter = ''

      if (timeRange === 'weekly') {
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        timeFilter = `and p.created_at >= '${weekAgo.toISOString()}'`
      } else if (timeRange === 'monthly') {
        const monthAgo = new Date(now)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        timeFilter = `and p.created_at >= '${monthAgo.toISOString()}'`
      }

      const { data, error: queryError } = await supabase.rpc(
        'get_leaderboard',
        { time_filter: timeFilter },
      )

      if (queryError) throw queryError

      const allData = data as LeaderboardResult[]
      setTotalUsers(allData.length)

      // Calculate pagination
      const startIndex = (currentPage - 1) * itemsPerPage
      const endIndex = startIndex + itemsPerPage
      const paginatedData = allData.slice(startIndex, endIndex)

      const formattedData: LeaderboardEntry[] = paginatedData.map(
        (entry, index) => {
          const actualRank = startIndex + index + 1
          const winRate =
            entry.total_picks > 0
              ? (entry.correct_picks / entry.total_picks) * 100
              : 0

          // Find previous rank if exists
          const previousEntry = previousLeaderboardRef.current.find(
            (prev) => prev.user_id === entry.user_id,
          )

          let rankChange: 'up' | 'down' | 'same' | 'new' = 'new'
          if (previousEntry) {
            if (
              previousEntry.currentRank &&
              previousEntry.currentRank > actualRank
            ) {
              rankChange = 'up'
            } else if (
              previousEntry.currentRank &&
              previousEntry.currentRank < actualRank
            ) {
              rankChange = 'down'
            } else if (previousEntry.currentRank === actualRank) {
              rankChange = 'same'
            }
          }

          return {
            user_id: entry.user_id,
            username: entry.username || 'Anonym Bruker',
            points: entry.total_points,
            correct_picks: entry.correct_picks,
            total_picks: entry.total_picks,
            map_score_points: entry.map_score_points,
            winRate,
            currentRank: actualRank,
            previousRank: previousEntry?.currentRank,
            rankChange,
          }
        },
      )

      // Fetch recent correct picks for paginated users
      const topUsers = formattedData

      await Promise.all(
        topUsers.map(async (user) => {
          try {
            const { data: pickData, error: pickError } = await supabase.rpc(
              'get_user_recent_correct_picks',
              { user_id_param: user.user_id },
            )

            if (pickError) throw pickError

            user.recentCorrectPicks = pickData as RecentCorrectPick[]
            console.log(
              'Recent picks data for user',
              user.username,
              ':',
              pickData,
            )
          } catch (err) {
            console.error(`Error fetching picks for user ${user.user_id}:`, err)
          }
        }),
      )

      setLeaderboard(formattedData)

      // Trigger confetti for top 3 if it's the first load and we have a winner
      if (
        !hasTriggeredConfetti &&
        formattedData.length > 0 &&
        timeRange === 'all'
      ) {
        triggerConfetti()
        setHasTriggeredConfetti(true)
      }

      // Store current leaderboard for next comparison
      previousLeaderboardRef.current = formattedData
      setLastUpdate(new Date())
    } catch (err) {
      console.error('Error fetching leaderboard:', err)
      setError('Failed to load leaderboard data')
    } finally {
      setIsLoading(false)
    }
  }

  // Reset page when time range changes
  useEffect(() => {
    setCurrentPage(1)
  }, [timeRange])

  // Fetch leaderboard on mount and when dependencies change
  useEffect(() => {
    fetchLeaderboard()
  }, [timeRange, currentPage, hasTriggeredConfetti]) // eslint-disable-line react-hooks/exhaustive-deps

  // Set up real-time subscription
  useEffect(() => {
    // Clean up previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    // Subscribe to picks table changes
    channelRef.current = supabase
      .channel('leaderboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'picks',
        },
        (payload) => {
          console.log('Pick update received:', payload)
          // Debounce updates to avoid too many refreshes
          setTimeout(() => {
            fetchLeaderboard()
          }, 2000)
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
        },
        (payload) => {
          console.log('Match update received:', payload)
          // Refresh when match results are updated
          setTimeout(() => {
            fetchLeaderboard()
          }, 2000)
        },
      )
      .subscribe()

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [supabase, timeRange]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-gray-200" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="rounded bg-red-100 p-4 text-red-700">
          Kunne ikke laste inn topplisten
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Toppliste</h1>
          {lastUpdate && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              Oppdatert {lastUpdate.toLocaleTimeString('nb-NO')}
            </motion.div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant={timeRange === 'all' ? 'default' : 'outline'}
            onClick={() => setTimeRange('all')}
          >
            Totalt
          </Button>
          <Button
            variant={timeRange === 'monthly' ? 'default' : 'outline'}
            onClick={() => setTimeRange('monthly')}
          >
            Månedlig
          </Button>
          <Button
            variant={timeRange === 'weekly' ? 'default' : 'outline'}
            onClick={() => setTimeRange('weekly')}
          >
            Ukentlig
          </Button>
        </div>
      </motion.div>

      {/* Top 3 Players - Only show on first page */}
      {leaderboard.length > 0 && currentPage === 1 && (
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {leaderboard.slice(0, 3).map((entry, index) => {
            const { icon, variant } = getRankBadge(index)
            return (
              <motion.div
                key={entry.user_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, type: 'spring' }}
              >
                <Card
                  className={`relative overflow-hidden border-2 ${
                    index === 0
                      ? 'border-yellow-500 bg-yellow-500/5'
                      : index === 1
                        ? 'border-gray-400 bg-gray-400/5'
                        : 'border-amber-600 bg-amber-600/5'
                  }`}
                >
                  <div className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-full ${
                            index === 0
                              ? 'bg-yellow-500/20'
                              : index === 1
                                ? 'bg-gray-400/20'
                                : 'bg-amber-600/20'
                          }`}
                        >
                          <Trophy
                            className={`h-6 w-6 ${
                              index === 0
                                ? 'text-yellow-500'
                                : index === 1
                                  ? 'text-gray-400'
                                  : 'text-amber-600'
                            }`}
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold">
                            {index === 0 ? (
                              <SparklesText>{entry.username}</SparklesText>
                            ) : (
                              entry.username
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            #{index + 1} på topplisten
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Total poeng
                        </span>
                        <span className="text-2xl font-bold">
                          <NumberTicker value={entry.points} />
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Map poeng
                        </span>
                        <span className="font-semibold">
                          <NumberTicker value={entry.map_score_points} />
                        </span>
                      </div>

                      <div className="mt-4 flex flex-col items-center">
                        <div className="relative h-20 w-20">
                          <svg className="h-20 w-20 -rotate-90 transform">
                            <circle
                              cx="40"
                              cy="40"
                              r="36"
                              stroke="#e5e7eb"
                              strokeWidth="8"
                              fill="none"
                            />
                            <circle
                              cx="40"
                              cy="40"
                              r="36"
                              stroke={
                                index === 0
                                  ? '#fbbf24'
                                  : index === 1
                                    ? '#9ca3af'
                                    : '#f59e0b'
                              }
                              strokeWidth="8"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 36}`}
                              strokeDashoffset={`${2 * Math.PI * 36 * (1 - (entry.winRate || 0) / 100)}`}
                              className="transition-all duration-1000 ease-out"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg font-bold">
                              {entry.winRate?.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <p className="mt-2 text-center text-sm text-muted-foreground">
                          nøyaktighet
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      <div className="space-y-4">
        <AnimatePresence>
          {leaderboard.map((entry, index) => (
            <motion.div
              key={entry.user_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-4 transition-all duration-300 hover:bg-accent/5 hover:shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                      {entry.currentRank}
                    </div>
                    {entry.rankChange && entry.rankChange !== 'new' && (
                      <div
                        className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full ${
                          entry.rankChange === 'up'
                            ? 'bg-green-500'
                            : entry.rankChange === 'down'
                              ? 'bg-red-500'
                              : 'bg-gray-500'
                        } text-white`}
                      >
                        {entry.rankChange === 'up' ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : entry.rankChange === 'down' ? (
                          <TrendingDown className="h-3 w-3" />
                        ) : (
                          <Minus className="h-3 w-3" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold">
                            {entry.username}
                          </span>
                          {entry.rankChange === 'up' && entry.previousRank && (
                            <span className="text-xs font-medium text-green-600">
                              ↑ {entry.previousRank - entry.currentRank!}{' '}
                              plasser
                            </span>
                          )}
                          {entry.rankChange === 'down' &&
                            entry.previousRank && (
                              <span className="text-xs font-medium text-red-600">
                                ↓ {entry.currentRank! - entry.previousRank}{' '}
                                plasser
                              </span>
                            )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {entry.correct_picks} riktige av {entry.total_picks}{' '}
                          predictions
                          <span className="ml-2">
                            ({entry.map_score_points} map poeng)
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          <NumberTicker value={entry.points} /> p
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {entry.winRate?.toFixed(1)}% nøyaktighet
                        </div>
                      </div>
                    </div>
                    <ProgressBar
                      value={entry.correct_picks}
                      max={entry.total_picks}
                      variant={index < 3 ? 'success' : 'default'}
                      showValue
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 w-full justify-start text-xs text-muted-foreground"
                      onClick={() => toggleUserExpand(entry.user_id)}
                    >
                      {expandedUsers[entry.user_id] ? 'Skjul' : 'Vis'} siste 5
                      riktige picks
                      <span className="ml-2">↓</span>
                    </Button>

                    {expandedUsers[entry.user_id] &&
                      entry.recentCorrectPicks && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 overflow-hidden"
                        >
                          {entry.recentCorrectPicks.length > 0 ? (
                            <div className="space-y-2">
                              {entry.recentCorrectPicks.map(
                                (pick, pickIndex) => {
                                  const isTeam1Winner =
                                    pick.predicted_winner === pick.team1
                                  const winnerLogo = isTeam1Winner
                                    ? pick.team1_logo
                                    : pick.team2_logo
                                  const winnerName = isTeam1Winner
                                    ? pick.team1
                                    : pick.team2
                                  const loserLogo = isTeam1Winner
                                    ? pick.team2_logo
                                    : pick.team1_logo
                                  const loserName = isTeam1Winner
                                    ? pick.team2
                                    : pick.team1
                                  const winnerScore = isTeam1Winner
                                    ? pick.team1_score
                                    : pick.team2_score
                                  const loserScore = isTeam1Winner
                                    ? pick.team2_score
                                    : pick.team1_score
                                  const winnerMapScore = isTeam1Winner
                                    ? pick.team1_map_score
                                    : pick.team2_map_score
                                  const loserMapScore = isTeam1Winner
                                    ? pick.team2_map_score
                                    : pick.team1_map_score

                                  const hasScores =
                                    winnerScore !== null &&
                                    winnerScore !== undefined &&
                                    loserScore !== null &&
                                    loserScore !== undefined
                                  const hasMapScores =
                                    winnerMapScore !== null &&
                                    winnerMapScore !== undefined &&
                                    loserMapScore !== null &&
                                    loserMapScore !== undefined

                                  const matchDate = pick.match_date
                                    ? new Date(pick.match_date)
                                    : null
                                  const isValidDate =
                                    matchDate && !isNaN(matchDate.getTime())

                                  const formattedDate = isValidDate
                                    ? matchDate.toLocaleDateString('nb-NO', {
                                        day: 'numeric',
                                        month: 'short',
                                        year:
                                          matchDate.getFullYear() !==
                                          new Date().getFullYear()
                                            ? 'numeric'
                                            : undefined,
                                      })
                                    : null
                                  const formattedTime = isValidDate
                                    ? matchDate.toLocaleTimeString('nb-NO', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                    : null

                                  return (
                                    <motion.div
                                      key={pick.id}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: pickIndex * 0.05 }}
                                      className="group relative rounded-lg border border-border/50 bg-card/50 p-3 transition-all duration-200 hover:border-primary/20 hover:shadow-sm"
                                    >
                                      <div className="flex items-center gap-3">
                                        {/* Match info */}
                                        <div className="flex-1">
                                          <div className="mb-2 flex items-center gap-2">
                                            <div className="flex items-center gap-2">
                                              {/* Winner */}
                                              <div className="flex items-center gap-1.5">
                                                <div className="relative">
                                                  <div className="h-8 w-8 overflow-hidden rounded-full bg-white shadow-sm">
                                                    {winnerLogo ? (
                                                      <Image
                                                        src={winnerLogo}
                                                        alt={winnerName}
                                                        width={32}
                                                        height={32}
                                                        className="h-full w-full object-contain p-0.5"
                                                      />
                                                    ) : (
                                                      <div className="flex h-full w-full items-center justify-center bg-muted text-xs font-medium">
                                                        {winnerName
                                                          .substring(0, 2)
                                                          .toUpperCase()}
                                                      </div>
                                                    )}
                                                  </div>
                                                  <div className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-green-500">
                                                    <svg
                                                      width="8"
                                                      height="8"
                                                      viewBox="0 0 24 24"
                                                      fill="none"
                                                    >
                                                      <path
                                                        d="M20 6L9 17L4 12"
                                                        stroke="white"
                                                        strokeWidth="3"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                      />
                                                    </svg>
                                                  </div>
                                                </div>
                                                <span className="text-sm font-medium">
                                                  {winnerName}
                                                </span>
                                              </div>

                                              {/* Score - only show if we have valid scores */}
                                              {hasScores && (
                                                <div className="flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-bold">
                                                  <span>{winnerScore}</span>
                                                  <span className="text-muted-foreground">
                                                    -
                                                  </span>
                                                  <span className="text-muted-foreground">
                                                    {loserScore}
                                                  </span>
                                                </div>
                                              )}

                                              {/* VS text if no scores */}
                                              {!hasScores && (
                                                <span className="px-2 text-xs font-medium text-muted-foreground">
                                                  vs
                                                </span>
                                              )}

                                              {/* Loser */}
                                              <div className="flex items-center gap-1.5 opacity-60">
                                                <div className="h-6 w-6 overflow-hidden rounded-full bg-white shadow-sm">
                                                  {loserLogo ? (
                                                    <Image
                                                      src={loserLogo}
                                                      alt={loserName}
                                                      width={24}
                                                      height={24}
                                                      className="h-full w-full object-contain p-0.5"
                                                    />
                                                  ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-muted text-[10px] font-medium">
                                                      {loserName
                                                        .substring(0, 2)
                                                        .toUpperCase()}
                                                    </div>
                                                  )}
                                                </div>
                                                <span className="text-sm text-muted-foreground">
                                                  {loserName}
                                                </span>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Match details - only show items that have data */}
                                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            {isValidDate &&
                                              formattedDate &&
                                              formattedTime && (
                                                <span>
                                                  {formattedDate} kl.{' '}
                                                  {formattedTime}
                                                </span>
                                              )}
                                            {pick.round && (
                                              <span>
                                                {isValidDate ? '•' : ''} Runde{' '}
                                                {pick.round}
                                              </span>
                                            )}
                                            {hasMapScores && (
                                              <span>
                                                • Maps: {winnerMapScore}-
                                                {loserMapScore}
                                              </span>
                                            )}
                                            {/* Show "Riktig pick" if no other details */}
                                            {!isValidDate &&
                                              !pick.round &&
                                              !hasMapScores && (
                                                <span className="text-green-600">
                                                  ✓ Riktig pick
                                                </span>
                                              )}
                                          </div>
                                        </div>

                                        {/* Points */}
                                        <div className="text-right">
                                          <div className="text-lg font-bold text-primary">
                                            +{pick.points_earned || 2}
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            poeng
                                          </div>
                                          {pick.map_score_points > 0 && (
                                            <div className="mt-0.5 text-xs font-medium text-green-600">
                                              +{pick.map_score_points} map
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </motion.div>
                                  )
                                },
                              )}
                            </div>
                          ) : (
                            <p className="py-4 text-center text-xs text-muted-foreground">
                              Ingen riktige picks ennå
                            </p>
                          )}
                        </motion.div>
                      )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {leaderboard.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-lg border border-dashed p-8 text-center"
          >
            <p className="text-gray-500">
              Ingen predictions er lagt inn i denne perioden
            </p>
          </motion.div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalUsers > itemsPerPage && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Forrige
          </Button>

          <div className="flex gap-1">
            {Array.from(
              { length: Math.ceil(totalUsers / itemsPerPage) },
              (_, i) => i + 1,
            )
              .filter((page) => {
                // Show first page, last page, current page, and pages around current
                const totalPages = Math.ceil(totalUsers / itemsPerPage)
                return (
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 2
                )
              })
              .map((page, index, array) => (
                <React.Fragment key={page}>
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <span className="px-2 text-muted-foreground">...</span>
                  )}
                  <Button
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="min-w-[40px]"
                  >
                    {page}
                  </Button>
                </React.Fragment>
              ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(Math.ceil(totalUsers / itemsPerPage), prev + 1),
              )
            }
            disabled={currentPage === Math.ceil(totalUsers / itemsPerPage)}
          >
            Neste
          </Button>
        </div>
      )}
    </div>
  )
}
