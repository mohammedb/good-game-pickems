'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/tailwind'
import { Flame, Shield, Snowflake } from 'lucide-react'
import { NumberTicker } from '@/components/magicui/number-ticker'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface StreakDisplayProps {
  currentStreak: number
  bestStreak: number
  streakFreezes: number
  onUseFreeze?: () => void
  className?: string
  showMultiplier?: boolean
  compact?: boolean
}

const getFireIntensity = (streak: number) => {
  if (streak >= 20) return 'inferno'
  if (streak >= 10) return 'blazing'
  if (streak >= 5) return 'hot'
  if (streak >= 3) return 'warm'
  return 'cold'
}

const getMultiplier = (streak: number) => {
  if (streak >= 20) return 2.0
  if (streak >= 10) return 1.5
  if (streak >= 5) return 1.2
  if (streak >= 3) return 1.1
  return 1.0
}

const fireColors = {
  cold: {
    flame: 'text-gray-400',
    bg: 'bg-gray-100 dark:bg-gray-800',
    glow: 'shadow-gray-200 dark:shadow-gray-700',
  },
  warm: {
    flame: 'text-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-950',
    glow: 'shadow-orange-300 dark:shadow-orange-700',
  },
  hot: {
    flame: 'text-orange-600',
    bg: 'bg-orange-100 dark:bg-orange-900',
    glow: 'shadow-orange-400 dark:shadow-orange-600',
  },
  blazing: {
    flame: 'text-red-600',
    bg: 'bg-red-100 dark:bg-red-900',
    glow: 'shadow-red-400 dark:shadow-red-600',
  },
  inferno: {
    flame: 'text-red-700',
    bg: 'bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900 dark:to-orange-900',
    glow: 'shadow-red-500 dark:shadow-red-500',
  },
}

export function StreakDisplay({
  currentStreak,
  bestStreak,
  streakFreezes,
  onUseFreeze,
  className,
  showMultiplier = true,
  compact = false,
}: StreakDisplayProps) {
  const intensity = getFireIntensity(currentStreak)
  const multiplier = getMultiplier(currentStreak)
  const colors = fireColors[intensity]

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5',
                colors.bg,
                'transition-all duration-300',
                currentStreak >= 3 && 'shadow-lg',
                currentStreak >= 3 && colors.glow,
                className,
              )}
              animate={
                currentStreak >= 3
                  ? {
                      scale: [1, 1.05, 1],
                    }
                  : {}
              }
              transition={{
                repeat: currentStreak >= 10 ? Infinity : 0,
                duration: 2,
                ease: 'easeInOut',
              }}
            >
              <Flame
                className={cn(
                  'h-4 w-4',
                  colors.flame,
                  currentStreak >= 10 && 'animate-pulse',
                )}
              />
              <span className="text-sm font-bold">
                <NumberTicker value={currentStreak} />
              </span>
              {showMultiplier && multiplier > 1 && (
                <span className="text-xs font-medium opacity-75">
                  x{multiplier}
                </span>
              )}
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">Current Streak: {currentStreak}</p>
              <p className="text-sm text-muted-foreground">
                Best Streak: {bestStreak}
              </p>
              {multiplier > 1 && (
                <p className="text-sm text-muted-foreground">
                  Points Multiplier: x{multiplier}
                </p>
              )}
              {streakFreezes > 0 && (
                <p className="text-sm text-muted-foreground">
                  Freezes Available: {streakFreezes}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <motion.div
      className={cn(
        'rounded-lg border p-4 shadow-sm',
        colors.bg,
        'transition-all duration-300',
        currentStreak >= 3 && 'shadow-lg',
        currentStreak >= 3 && colors.glow,
        className,
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div>
            <div className="text-sm font-medium text-muted-foreground">
              Prediction Streak
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <div className="flex items-center gap-2">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={intensity}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <Flame
                      className={cn(
                        'h-8 w-8',
                        colors.flame,
                        currentStreak >= 10 && 'animate-pulse',
                      )}
                    />
                  </motion.div>
                </AnimatePresence>
                <div className="text-3xl font-bold">
                  <NumberTicker value={currentStreak} />
                </div>
              </div>
              {showMultiplier && multiplier > 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                >
                  x{multiplier} bonus
                </motion.div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="text-muted-foreground">
              Best streak:{' '}
              <span className="font-medium text-foreground">{bestStreak}</span>
            </div>
            {streakFreezes > 0 && (
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {streakFreezes} freeze{streakFreezes !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {onUseFreeze && streakFreezes > 0 && currentStreak > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onUseFreeze}
                  className="gap-1.5"
                >
                  <Snowflake className="h-4 w-4" />
                  Freeze
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Protect your streak from one incorrect prediction</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Fire animation for high streaks */}
      {currentStreak >= 10 && (
        <motion.div
          className="pointer-events-none absolute -right-2 -top-2 opacity-30"
          animate={{
            y: [-5, -10, -5],
            rotate: [-5, 5, -5],
          }}
          transition={{
            repeat: Infinity,
            duration: 3,
            ease: 'easeInOut',
          }}
        >
          <Flame className="h-12 w-12 text-orange-500" />
        </motion.div>
      )}
    </motion.div>
  )
}
