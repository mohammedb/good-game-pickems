'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  Trophy,
  Flame,
  Crown,
  Medal,
  Star,
  Target,
  Sparkles,
  Zap,
  TrendingUp,
  Award,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SparklesText } from '@/components/magicui/sparkles-text'
import { toast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'

export interface Achievement {
  id: string
  type:
    | 'first_win'
    | 'win_streak'
    | 'high_stakes_win'
    | 'perfect_predictions'
    | 'milestone_wins'
    | 'comeback_king'
  title: string
  description: string
  icon: React.ReactNode
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  points?: number
}

const achievements: Record<string, Achievement> = {
  first_win: {
    id: 'first_win',
    type: 'first_win',
    title: 'Første Seier!',
    description: 'Du vant din første utfordring',
    icon: <Trophy className="h-6 w-6" />,
    rarity: 'common',
    points: 10,
  },
  win_streak_3: {
    id: 'win_streak_3',
    type: 'win_streak',
    title: 'På Fyr!',
    description: '3 seire på rad',
    icon: <Flame className="h-6 w-6" />,
    rarity: 'rare',
    points: 25,
  },
  win_streak_5: {
    id: 'win_streak_5',
    type: 'win_streak',
    title: 'Ustoppelig!',
    description: '5 seire på rad',
    icon: <Flame className="h-6 w-6" />,
    rarity: 'epic',
    points: 50,
  },
  win_streak_10: {
    id: 'win_streak_10',
    type: 'win_streak',
    title: 'Legende!',
    description: '10 seire på rad',
    icon: <Crown className="h-6 w-6" />,
    rarity: 'legendary',
    points: 100,
  },
  high_stakes_win: {
    id: 'high_stakes_win',
    type: 'high_stakes_win',
    title: 'Høy Innsats Mester',
    description: 'Vant en utfordring med 100+ poeng innsats',
    icon: <Zap className="h-6 w-6" />,
    rarity: 'epic',
    points: 75,
  },
  perfect_predictions: {
    id: 'perfect_predictions',
    type: 'perfect_predictions',
    title: 'Perfekt Prediksjon',
    description: 'Alle prediksjoner korrekte i en utfordring',
    icon: <Star className="h-6 w-6" />,
    rarity: 'rare',
    points: 30,
  },
  milestone_10_wins: {
    id: 'milestone_10_wins',
    type: 'milestone_wins',
    title: 'Veteran',
    description: '10 utfordringer vunnet',
    icon: <Medal className="h-6 w-6" />,
    rarity: 'rare',
    points: 40,
  },
  milestone_25_wins: {
    id: 'milestone_25_wins',
    type: 'milestone_wins',
    title: 'Mester',
    description: '25 utfordringer vunnet',
    icon: <Award className="h-6 w-6" />,
    rarity: 'epic',
    points: 80,
  },
  comeback_king: {
    id: 'comeback_king',
    type: 'comeback_king',
    title: 'Comeback King',
    description: 'Vant etter å ligge under med 3+ poeng',
    icon: <TrendingUp className="h-6 w-6" />,
    rarity: 'epic',
    points: 60,
  },
}

export function showAchievementToast(achievementId: string) {
  const achievement = achievements[achievementId]
  if (!achievement) return

  const rarityColors = {
    common: 'from-gray-400 to-gray-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-amber-400 to-amber-600',
  }

  const rarityGlow = {
    common: 'shadow-gray-400/50',
    rare: 'shadow-blue-400/50',
    epic: 'shadow-purple-400/50',
    legendary: 'shadow-amber-400/50',
  }

  toast({
    duration: 5000,
    className: 'border-0 bg-background/95 backdrop-blur-md',
    description: (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative overflow-hidden"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />

        <div className="relative flex items-start gap-4">
          <motion.div
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className={cn(
              'rounded-xl bg-gradient-to-br p-3 shadow-2xl',
              rarityColors[achievement.rarity],
              rarityGlow[achievement.rarity],
            )}
          >
            {achievement.icon}
          </motion.div>

          <div className="flex-1 space-y-1">
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2"
            >
              <SparklesText
                className="text-lg font-bold"
                sparklesCount={achievement.rarity === 'legendary' ? 10 : 5}
              >
                {achievement.title}
              </SparklesText>
              {achievement.points && (
                <Badge variant="outline" className="gap-0.5 text-xs">
                  +{achievement.points}
                </Badge>
              )}
            </motion.div>

            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-muted-foreground"
            >
              {achievement.description}
            </motion.p>
          </div>
        </div>

        {/* Animated sparkles for legendary achievements */}
        {achievement.rarity === 'legendary' && (
          <>
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{
                  x: 0,
                  y: 0,
                  scale: 0,
                  opacity: 1,
                }}
                animate={{
                  x: Math.random() * 400 - 200,
                  y: Math.random() * 200 - 100,
                  scale: [0, 1, 0],
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.1,
                  ease: 'easeOut',
                }}
                style={{
                  left: '50%',
                  top: '50%',
                }}
              >
                <Sparkles className="h-4 w-4 text-amber-400" />
              </motion.div>
            ))}
          </>
        )}
      </motion.div>
    ),
  } as any)
}

interface AchievementBadgeProps {
  achievement: Achievement
  className?: string
}

export function AchievementBadge({
  achievement,
  className,
}: AchievementBadgeProps) {
  const rarityColors = {
    common: 'border-gray-400/50 bg-gray-400/10',
    rare: 'border-blue-400/50 bg-blue-400/10',
    epic: 'border-purple-400/50 bg-purple-400/10',
    legendary: 'border-amber-400/50 bg-amber-400/10 ring-2 ring-amber-400/20',
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5',
        rarityColors[achievement.rarity],
        className,
      )}
    >
      <div className="text-current opacity-80">{achievement.icon}</div>
      <span className="text-sm font-medium">{achievement.title}</span>
    </motion.div>
  )
}

// Helper function to check for new achievements after a challenge
export function checkForAchievements(
  challengeResult: {
    won: boolean
    perfectPredictions: boolean
    stakePoints: number
    comebackVictory: boolean
  },
  userStats: {
    totalWins: number
    currentStreak: number
  },
): string[] {
  const newAchievements: string[] = []

  if (challengeResult.won) {
    // First win
    if (userStats.totalWins === 1) {
      newAchievements.push('first_win')
    }

    // Win streaks
    if (userStats.currentStreak === 3) {
      newAchievements.push('win_streak_3')
    } else if (userStats.currentStreak === 5) {
      newAchievements.push('win_streak_5')
    } else if (userStats.currentStreak === 10) {
      newAchievements.push('win_streak_10')
    }

    // High stakes win
    if (challengeResult.stakePoints >= 100) {
      newAchievements.push('high_stakes_win')
    }

    // Perfect predictions
    if (challengeResult.perfectPredictions) {
      newAchievements.push('perfect_predictions')
    }

    // Milestone wins
    if (userStats.totalWins === 10) {
      newAchievements.push('milestone_10_wins')
    } else if (userStats.totalWins === 25) {
      newAchievements.push('milestone_25_wins')
    }

    // Comeback victory
    if (challengeResult.comebackVictory) {
      newAchievements.push('comeback_king')
    }
  }

  return newAchievements
}
