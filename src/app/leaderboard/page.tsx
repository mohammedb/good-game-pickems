'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProgressBar } from '@/components/ui/progress-bar'
import { BadgeCard } from '@/components/ui/badge-card'
import { createBrowserClient } from '@/utils/supabase'

type TimeRange = 'all' | 'weekly' | 'monthly'

interface LeaderboardEntry {
  user_id: string
  username: string
  points: number
  correct_picks: number
  total_picks: number
  map_score_points: number
  recentCorrectPicks?: RecentCorrectPick[]
}

interface RecentCorrectPick {
  id: string
  match_id: string
  predicted_winner: string
  team1: string
  team2: string
  team1_logo: string | null
  team2_logo: string | null
  created_at: string
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

  const supabase = createBrowserClient()

  const toggleUserExpand = (userId: string) => {
    setExpandedUsers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }))
  }

  useEffect(() => {
    async function fetchLeaderboard() {
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

        const formattedData: LeaderboardEntry[] = (
          data as LeaderboardResult[]
        ).map((entry) => ({
          user_id: entry.user_id,
          username: entry.username || 'Anonym Bruker',
          points: entry.total_points,
          correct_picks: entry.correct_picks,
          total_picks: entry.total_picks,
          map_score_points: entry.map_score_points,
        }))

        // Fetch recent correct picks for all users in parallel
        const topUsers = formattedData.slice(0, 20) // Limit to top 20 for performance

        await Promise.all(
          topUsers.map(async (user) => {
            try {
              const { data: pickData, error: pickError } = await supabase.rpc(
                'get_user_recent_correct_picks',
                { user_id_param: user.user_id },
              )

              if (pickError) throw pickError

              user.recentCorrectPicks = pickData as RecentCorrectPick[]
            } catch (err) {
              console.error(
                `Error fetching picks for user ${user.user_id}:`,
                err,
              )
            }
          }),
        )

        setLeaderboard(formattedData)
      } catch (err) {
        console.error('Error fetching leaderboard:', err)
        setError('Failed to load leaderboard data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboard()
  }, [timeRange, supabase])

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
        <h1 className="mb-6 text-3xl font-bold">Toppliste</h1>
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

      {/* Top 3 Players */}
      {leaderboard.length > 0 && (
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {leaderboard.slice(0, 3).map((entry, index) => {
            const { icon, variant } = getRankBadge(index)
            return (
              <BadgeCard
                key={entry.user_id}
                title={entry.username}
                description={`${entry.points} poeng (${entry.map_score_points} map)`}
                icon={icon}
                variant={variant}
                progress={(entry.correct_picks / entry.total_picks) * 100}
              />
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
              <Card className="p-4 hover:bg-accent/5">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{entry.username}</div>
                        <div className="text-sm text-muted-foreground">
                          {entry.correct_picks} riktige av {entry.total_picks}{' '}
                          predictions
                          <span className="ml-2">
                            ({entry.map_score_points} map poeng)
                          </span>
                        </div>
                      </div>
                      <div className="text-xl font-bold">{entry.points} p</div>
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
                          className="mt-2 overflow-hidden rounded-md bg-muted/50 p-3"
                        >
                          {entry.recentCorrectPicks.length > 0 ? (
                            <div className="flex flex-wrap justify-center gap-2">
                              {entry.recentCorrectPicks.map((pick) => {
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

                                return (
                                  <div
                                    key={pick.id}
                                    className="relative flex flex-col items-center"
                                    title={`${pick.team1} vs ${pick.team2} - Valgte: ${winnerName}`}
                                  >
                                    <div className="relative mb-1 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 p-1 shadow-md">
                                      {/* Winner logo */}
                                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white">
                                        {winnerLogo ? (
                                          <img
                                            src={winnerLogo}
                                            alt={winnerName}
                                            className="h-10 w-10 object-contain"
                                          />
                                        ) : (
                                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs font-medium">
                                            {winnerName
                                              .substring(0, 2)
                                              .toUpperCase()}
                                          </div>
                                        )}
                                      </div>

                                      {/* Checkmark badge */}
                                      <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white shadow-md">
                                        <svg
                                          width="12"
                                          height="12"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          xmlns="http://www.w3.org/2000/svg"
                                        >
                                          <path
                                            d="M20 6L9 17L4 12"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                        </svg>
                                      </div>

                                      {/* Loser logo small */}
                                      <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white/90 shadow-md">
                                        {loserLogo ? (
                                          <img
                                            src={loserLogo}
                                            alt={loserName}
                                            className="h-6 w-6 object-contain opacity-60"
                                          />
                                        ) : (
                                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium opacity-60">
                                            {loserName
                                              .substring(0, 2)
                                              .toUpperCase()}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <span className="mt-1 text-center text-xs font-medium leading-tight">
                                      {winnerName}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
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
    </div>
  )
}
