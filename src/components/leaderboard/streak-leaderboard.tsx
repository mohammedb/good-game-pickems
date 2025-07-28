'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/tailwind'
import { Flame, Trophy, TrendingUp, Crown } from 'lucide-react'
import { NumberTicker } from '@/components/magicui/number-ticker'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface StreakLeaderboardEntry {
  userId: string
  username: string
  email: string
  streak: number
  totalPoints: number
  rank: number
}

interface StreakLeaderboardProps {
  currentStreaks: StreakLeaderboardEntry[]
  allTimeStreaks: StreakLeaderboardEntry[]
  currentUserId?: string
  isLoading?: boolean
  className?: string
}

const getFireIntensity = (streak: number) => {
  if (streak >= 20) return 'inferno'
  if (streak >= 10) return 'blazing'
  if (streak >= 5) return 'hot'
  if (streak >= 3) return 'warm'
  return 'cold'
}

const fireColors = {
  cold: 'text-gray-400',
  warm: 'text-orange-500',
  hot: 'text-orange-600',
  blazing: 'text-red-600',
  inferno: 'text-red-700',
}

function LeaderboardRow({
  entry,
  isCurrentUser,
  index,
}: {
  entry: StreakLeaderboardEntry
  isCurrentUser: boolean
  index: number
}) {
  const intensity = getFireIntensity(entry.streak)
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />
    if (rank === 2) return <Trophy className="h-5 w-5 text-gray-400" />
    if (rank === 3) return <Trophy className="h-5 w-5 text-orange-600" />
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'flex items-center justify-between rounded-lg p-4 transition-colors',
        isCurrentUser
          ? 'border border-primary/20 bg-primary/10'
          : 'hover:bg-muted/50',
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center">
          {getRankIcon(entry.rank) || (
            <span className="text-lg font-bold text-muted-foreground">
              #{entry.rank}
            </span>
          )}
        </div>

        <Avatar className="h-10 w-10">
          <AvatarFallback>
            {entry.username?.charAt(0).toUpperCase() ||
              entry.email.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div>
          <div className="font-medium">
            {entry.username || entry.email.split('@')[0]}
            {isCurrentUser && (
              <Badge variant="secondary" className="ml-2">
                You
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {entry.totalPoints.toLocaleString()} points
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Flame
          className={cn(
            'h-5 w-5',
            fireColors[intensity],
            entry.streak >= 10 && 'animate-pulse',
          )}
        />
        <div className="text-2xl font-bold">
          <NumberTicker value={entry.streak} />
        </div>
      </div>
    </motion.div>
  )
}

export function StreakLeaderboard({
  currentStreaks,
  allTimeStreaks,
  currentUserId,
  isLoading,
  className,
}: StreakLeaderboardProps) {
  const [activeTab, setActiveTab] = React.useState('current')

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5" />
            Streak Leaderboard
          </CardTitle>
          <CardDescription>Loading streak leaders...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg bg-muted/50"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5" />
          Streak Leaderboard
        </CardTitle>
        <CardDescription>Top prediction streaks in the league</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Current Streaks
            </TabsTrigger>
            <TabsTrigger value="alltime" className="gap-2">
              <Trophy className="h-4 w-4" />
              All-Time Best
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="mt-6">
            <div className="space-y-2">
              {currentStreaks.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No active streaks yet. Start predicting to climb the
                  leaderboard!
                </div>
              ) : (
                currentStreaks.map((entry, index) => (
                  <LeaderboardRow
                    key={entry.userId}
                    entry={entry}
                    isCurrentUser={entry.userId === currentUserId}
                    index={index}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="alltime" className="mt-6">
            <div className="space-y-2">
              {allTimeStreaks.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No streak records yet. Be the first to set a record!
                </div>
              ) : (
                allTimeStreaks.map((entry, index) => (
                  <LeaderboardRow
                    key={entry.userId}
                    entry={entry}
                    isCurrentUser={entry.userId === currentUserId}
                    index={index}
                  />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
