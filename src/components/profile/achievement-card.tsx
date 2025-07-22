'use client'

import { motion } from 'framer-motion'
import { Trophy, Target, Sparkles, Medal, Crown, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface AchievementCardProps {
  title: string
  description: string
  icon: 'trophy' | 'target' | 'sparkles' | 'medal' | 'crown'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  progress: number
  unlocked: boolean
  unlockedAt?: string
  points: number
}

const iconMap = {
  trophy: Trophy,
  target: Target,
  sparkles: Sparkles,
  medal: Medal,
  crown: Crown,
}

const rarityStyles = {
  common: {
    border: 'border-zinc-300 dark:border-zinc-700',
    bg: 'bg-zinc-100 dark:bg-zinc-800',
    iconBg: 'bg-zinc-200 dark:bg-zinc-700',
    text: 'text-zinc-900 dark:text-zinc-100',
    progressBar: 'bg-zinc-400',
  },
  rare: {
    border: 'border-blue-300 dark:border-blue-700',
    bg: 'bg-blue-50 dark:bg-blue-950/50',
    iconBg: 'bg-blue-200 dark:bg-blue-800',
    text: 'text-blue-900 dark:text-blue-100',
    progressBar: 'bg-blue-500',
  },
  epic: {
    border: 'border-purple-300 dark:border-purple-700',
    bg: 'bg-purple-50 dark:bg-purple-950/50',
    iconBg: 'bg-purple-200 dark:bg-purple-800',
    text: 'text-purple-900 dark:text-purple-100',
    progressBar: 'bg-purple-500',
  },
  legendary: {
    border: 'border-amber-300 dark:border-amber-700',
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    iconBg: 'bg-amber-200 dark:bg-amber-800',
    text: 'text-amber-900 dark:text-amber-100',
    progressBar: 'bg-amber-500',
  },
}

export function AchievementCard({
  title,
  description,
  icon,
  rarity,
  progress,
  unlocked,
  unlockedAt,
  points,
}: AchievementCardProps) {
  const Icon = iconMap[icon]
  const styles = rarityStyles[rarity]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: unlocked ? 1.02 : 1 }}
            className="relative cursor-pointer"
          >
            <Card
              className={cn(
                'relative overflow-hidden p-4 transition-all duration-300',
                unlocked
                  ? styles.border
                  : 'border-gray-200 dark:border-gray-800',
                unlocked ? styles.bg : 'bg-gray-50 dark:bg-gray-900/50',
                !unlocked && 'opacity-75',
              )}
            >
              {/* Lock overlay for locked achievements */}
              {!unlocked && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                  <Lock className="h-8 w-8 text-gray-400" />
                </div>
              )}

              {/* Sparkle effect for legendary achievements */}
              {unlocked && rarity === 'legendary' && (
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute left-4 top-2 h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                  <div className="absolute bottom-4 right-6 h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300 delay-300" />
                  <div className="absolute right-8 top-6 h-1 w-1 animate-pulse rounded-full bg-amber-500 delay-700" />
                </div>
              )}

              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full',
                    unlocked ? styles.iconBg : 'bg-gray-200 dark:bg-gray-800',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-6 w-6',
                      unlocked ? styles.text : 'text-gray-500',
                    )}
                  />
                </div>

                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <h3
                      className={cn(
                        'font-semibold',
                        unlocked
                          ? styles.text
                          : 'text-gray-700 dark:text-gray-300',
                      )}
                    >
                      {title}
                    </h3>
                    {points > 0 && (
                      <span
                        className={cn(
                          'text-sm font-medium',
                          unlocked ? styles.text : 'text-gray-500',
                        )}
                      >
                        +{points}p
                      </span>
                    )}
                  </div>

                  <p
                    className={cn(
                      'mb-3 text-sm',
                      unlocked
                        ? 'text-muted-foreground'
                        : 'text-gray-500 dark:text-gray-600',
                    )}
                  >
                    {description}
                  </p>

                  {/* Progress bar */}
                  <div className="relative h-2 w-full rounded-full bg-gray-200 dark:bg-gray-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={cn(
                        'h-full rounded-full',
                        unlocked ? styles.progressBar : 'bg-gray-400',
                      )}
                    />
                  </div>

                  {/* Unlocked date */}
                  {unlocked && unlockedAt && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Låst opp{' '}
                      {new Date(unlockedAt).toLocaleDateString('nb-NO')}
                    </p>
                  )}
                </div>
              </div>

              {/* Completion badge for 100% progress */}
              {unlocked && progress === 100 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  className="absolute -right-1 -top-1"
                >
                  <Sparkles className="h-6 w-6 text-green-500" />
                </motion.div>
              )}
            </Card>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
            {!unlocked && (
              <>
                <div className="h-px bg-border" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Fremgang: {progress}%</p>
                  {progress < 100 && (
                    <p className="text-xs text-muted-foreground">
                      {progress === 0
                        ? 'Ikke startet ennå'
                        : progress < 25
                          ? 'Nettopp startet!'
                          : progress < 50
                            ? 'På god vei!'
                            : progress < 75
                              ? 'Snart der!'
                              : 'Nesten ferdig!'}
                    </p>
                  )}
                </div>
              </>
            )}
            {unlocked && unlockedAt && (
              <>
                <div className="h-px bg-border" />
                <p className="text-xs text-muted-foreground">
                  Låst opp{' '}
                  {new Date(unlockedAt).toLocaleDateString('nb-NO', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </>
            )}
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between text-sm">
              <span
                className={cn(
                  'font-medium capitalize',
                  rarity === 'legendary'
                    ? 'text-amber-600'
                    : rarity === 'epic'
                      ? 'text-purple-600'
                      : rarity === 'rare'
                        ? 'text-blue-600'
                        : 'text-gray-600',
                )}
              >
                {rarity === 'legendary'
                  ? 'Legendarisk'
                  : rarity === 'epic'
                    ? 'Episk'
                    : rarity === 'rare'
                      ? 'Sjelden'
                      : 'Vanlig'}
              </span>
              <span className="font-medium">+{points} poeng</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
