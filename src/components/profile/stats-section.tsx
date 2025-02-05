'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/tailwind'
import { Trophy, Target, Sparkles, Medal, Crown } from 'lucide-react'

interface Achievement {
  id: string
  title: string
  description: string
  progress: number
  icon: 'trophy' | 'target' | 'sparkles' | 'medal' | 'crown'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

interface Stats {
  totalPredictions: number
  correctPredictions: number
  winStreak: number
  rank: number
  totalParticipants: number
  achievements: Achievement[]
}

interface StatsSectionProps {
  stats: Stats
  className?: string
}

const iconMap = {
  trophy: Trophy,
  target: Target,
  sparkles: Sparkles,
  medal: Medal,
  crown: Crown
}

const rarityColors = {
  common: 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100',
  rare: 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100',
  epic: 'bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100',
  legendary: 'bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100'
}

export function StatsSection({ stats, className }: StatsSectionProps) {
  const accuracy = React.useMemo(() => {
    return stats.totalPredictions > 0
      ? (stats.correctPredictions / stats.totalPredictions) * 100
      : 0
  }, [stats.totalPredictions, stats.correctPredictions])

  return (
    <div className={cn('space-y-8', className)}>
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border bg-card p-4 shadow-sm"
        >
          <div className="text-sm font-medium text-muted-foreground">
            Prediction Accuracy
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="text-2xl font-bold">
              {accuracy.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">
              ({stats.correctPredictions}/{stats.totalPredictions})
            </div>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-accent">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${accuracy}%` }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg border bg-card p-4 shadow-sm"
        >
          <div className="text-sm font-medium text-muted-foreground">
            Current Win Streak
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="text-2xl font-bold">{stats.winStreak}</div>
            <div className="text-sm text-muted-foreground">predictions</div>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Keep it going! 🔥
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg border bg-card p-4 shadow-sm"
        >
          <div className="text-sm font-medium text-muted-foreground">
            Leaderboard Rank
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="text-2xl font-bold">#{stats.rank}</div>
            <div className="text-sm text-muted-foreground">
              of {stats.totalParticipants}
            </div>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-accent">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(1 - (stats.rank / stats.totalParticipants)) * 100}%` }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-lg border bg-card p-4 shadow-sm"
        >
          <div className="text-sm font-medium text-muted-foreground">
            Total Predictions
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="text-2xl font-bold">{stats.totalPredictions}</div>
            <div className="text-sm text-muted-foreground">matches predicted</div>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Keep predicting to earn more achievements!
          </div>
        </motion.div>
      </div>

      {/* Achievements */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Achievements</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.achievements.map((achievement, index) => {
            const Icon = iconMap[achievement.icon]

            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: index * 0.1,
                  type: 'spring',
                  stiffness: 300,
                  damping: 20
                }}
                whileHover={{ scale: 1.02 }}
                className={cn(
                  'relative overflow-hidden rounded-lg border p-4 shadow-sm transition-colors',
                  rarityColors[achievement.rarity]
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium">{achievement.title}</h4>
                    <p className="text-sm opacity-90">
                      {achievement.description}
                    </p>
                  </div>
                  <Icon className="h-5 w-5 shrink-0" />
                </div>

                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <div>Progress</div>
                    <div>{achievement.progress}%</div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-black/10">
                    <div
                      className={cn(
                        'h-full rounded-full bg-current transition-all',
                        achievement.progress === 100 && 'animate-pulse'
                      )}
                      style={{ width: `${achievement.progress}%` }}
                    />
                  </div>
                </div>

                {achievement.progress === 100 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    className="absolute right-0 top-0"
                  >
                    <Sparkles className="h-16 w-16 rotate-12 opacity-20" />
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}