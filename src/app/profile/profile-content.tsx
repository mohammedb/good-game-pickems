'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatsCard } from '@/components/ui/stats-card'
import { BadgeCard } from '@/components/ui/badge-card'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'

interface Match {
  team1: string
  team2: string
  start_time: string
}

interface Pick {
  id: string
  user_id: string
  match_id: string
  predicted_winner: string
  is_correct: boolean | null
  created_at: string
  match: Match
}

interface ProfileStats {
  totalPicks: number
  correctPicks: number
  totalPoints: number
  recentPicks: Pick[]
}

interface ProfileContentProps {
  user: User
  stats: ProfileStats
}

const getAchievements = (stats: ProfileStats) => {
  const achievements = [
    {
      title: 'First Pick',
      description: 'Made your first prediction',
      icon: 'star' as const,
      variant: 'bronze' as const,
      isLocked: stats.totalPicks === 0,
      progress: stats.totalPicks > 0 ? 100 : 0
    },
    {
      title: 'Perfect Streak',
      description: 'Get 5 predictions correct in a row',
      icon: 'trophy' as const,
      variant: 'silver' as const,
      isLocked: stats.correctPicks < 5,
      progress: (stats.correctPicks / 5) * 100
    },
    {
      title: 'Prediction Master',
      description: 'Achieve 80% accuracy with 20+ picks',
      icon: 'crown' as const,
      variant: 'gold' as const,
      isLocked: stats.totalPicks < 20 || (stats.correctPicks / stats.totalPicks) < 0.8,
      progress: stats.totalPicks >= 20 ? (stats.correctPicks / stats.totalPicks) * 100 : (stats.totalPicks / 20) * 100
    }
  ]

  return achievements
}

export default function ProfileContent({ user, stats }: ProfileContentProps) {
  const achievements = getAchievements(stats)

  return (
    <div className="container mx-auto p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="mb-2 text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">{user.email}</p>
      </motion.div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Total Points"
          value={stats.totalPoints}
          trend={10}
        />
        <StatsCard
          title="Correct Picks"
          value={stats.correctPicks}
          total={stats.totalPicks}
        />
        <StatsCard
          title="Accuracy"
          value={stats.totalPicks > 0 ? Math.round((stats.correctPicks / stats.totalPicks) * 100) : 0}
          trend={stats.totalPicks > 0 ? Math.round((stats.correctPicks / stats.totalPicks) * 100 - 50) : 0}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <h2 className="mb-4 text-xl font-semibold">Achievements</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {achievements.map((achievement) => (
            <BadgeCard key={achievement.title} {...achievement} />
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <h2 className="mb-4 text-xl font-semibold">Recent Predictions</h2>
        <div className="space-y-4">
          {stats.recentPicks.length > 0 ? (
            stats.recentPicks.map((pick) => (
              <Card key={pick.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {pick.match.team1} vs {pick.match.team2}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Predicted: {pick.predicted_winner}
                    </div>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-sm ${
                    pick.is_correct 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : pick.is_correct === false 
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {pick.is_correct === null 
                      ? 'Pending' 
                      : pick.is_correct 
                        ? 'Correct' 
                        : 'Incorrect'}
                  </div>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {new Date(pick.match.start_time).toLocaleString()}
                </div>
              </Card>
            ))
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-muted-foreground mb-4">No predictions made yet</p>
              <Link href="/matches">
                <Button>
                  Make Your First Prediction
                </Button>
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
} 