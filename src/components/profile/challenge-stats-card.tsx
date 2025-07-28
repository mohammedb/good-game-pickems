'use client'

import { motion } from 'framer-motion'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { NumberTicker } from '@/components/magicui/number-ticker'
import {
  Trophy,
  Swords,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChallengeStatsCardProps {
  stats: {
    challenge_wins: number
    challenge_losses: number
    challenge_draws: number
    challenge_points_won: number
    challenge_points_lost: number
  }
  className?: string
}

export function ChallengeStatsCard({
  stats,
  className,
}: ChallengeStatsCardProps) {
  const totalChallenges =
    stats.challenge_wins + stats.challenge_losses + stats.challenge_draws
  const winRate =
    totalChallenges > 0 ? (stats.challenge_wins / totalChallenges) * 100 : 0
  const pointsBalance = stats.challenge_points_won - stats.challenge_points_lost

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Swords className="h-5 w-5" />
              Challenge Stats
            </CardTitle>
            <CardDescription>Your head-to-head battle record</CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <Trophy className="h-3 w-3" />
            {totalChallenges} Total
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Win/Loss/Draw Record */}
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <div className="text-2xl font-bold text-green-500">
              <NumberTicker value={stats.challenge_wins} />
            </div>
            <p className="text-sm text-muted-foreground">Wins</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div className="text-2xl font-bold text-red-500">
              <NumberTicker value={stats.challenge_losses} />
            </div>
            <p className="text-sm text-muted-foreground">Losses</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <div className="text-2xl font-bold text-yellow-500">
              <NumberTicker value={stats.challenge_draws} />
            </div>
            <p className="text-sm text-muted-foreground">Draws</p>
          </motion.div>
        </div>

        {/* Win Rate */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Win Rate</span>
            </div>
            <span className="text-sm font-bold">
              <NumberTicker value={parseFloat(winRate.toFixed(1))} />%
            </span>
          </div>
          <Progress value={winRate} className="h-2" />
        </motion.div>

        {/* Points Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-lg bg-muted p-4"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Points Balance
              </p>
              <div className="flex items-center gap-2">
                {pointsBalance >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={cn(
                    'text-2xl font-bold',
                    pointsBalance >= 0 ? 'text-green-500' : 'text-red-500',
                  )}
                >
                  {pointsBalance >= 0 ? '+' : ''}
                  <NumberTicker value={pointsBalance} />
                </span>
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>Won: {stats.challenge_points_won}</p>
              <p>Lost: {stats.challenge_points_lost}</p>
            </div>
          </div>
        </motion.div>

        {/* Achievement Progress */}
        {totalChallenges >= 10 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, type: 'spring' }}
            className="flex items-center gap-2 rounded-md bg-primary/10 p-2"
          >
            <Award className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Challenge Veteran</span>
            {winRate >= 60 && (
              <Badge variant="secondary" className="ml-auto">
                Elite
              </Badge>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
