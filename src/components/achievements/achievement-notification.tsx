'use client'

import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import { motion, AnimatePresence } from 'framer-motion'
import { AchievementBadge } from './achievement-badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Achievement } from '@/lib/achievements/types'

interface AchievementNotificationProps {
  achievement: Achievement | null
  isVisible: boolean
  onClose: () => void
}

export function AchievementNotification({
  achievement,
  isVisible,
  onClose,
}: AchievementNotificationProps) {
  useEffect(() => {
    if (isVisible && achievement) {
      // Auto-close after 5 seconds
      const timer = setTimeout(onClose, 5000)

      // Trigger confetti for rare, epic, and legendary achievements
      if (['rare', 'epic', 'legendary'].includes(achievement.rarity)) {
        const duration = achievement.rarity === 'legendary' ? 3000 : 2000
        const particleCount = achievement.rarity === 'legendary' ? 150 : 100
        const spread = achievement.rarity === 'legendary' ? 90 : 70

        const colors = {
          rare: ['#3b82f6', '#60a5fa', '#93bbfc'],
          epic: ['#a855f7', '#c084fc', '#d8b4fe'],
          legendary: ['#eab308', '#facc15', '#fde047'],
        }

        const animationEnd = Date.now() + duration

        const randomInRange = (min: number, max: number) => {
          return Math.random() * (max - min) + min
        }

        const interval = setInterval(() => {
          const timeLeft = animationEnd - Date.now()

          if (timeLeft <= 0) {
            clearInterval(interval)
            return
          }

          const particleCountForBurst = Math.max(
            10,
            Math.floor((timeLeft / duration) * particleCount * 0.2),
          )

          // Create multiple bursts from different origins
          confetti({
            particleCount: particleCountForBurst,
            startVelocity: 30,
            spread: spread,
            origin: {
              x: randomInRange(0.1, 0.3),
              y: Math.random() - 0.2,
            },
            colors: colors[achievement.rarity as keyof typeof colors],
          })

          confetti({
            particleCount: particleCountForBurst,
            startVelocity: 30,
            spread: spread,
            origin: {
              x: randomInRange(0.7, 0.9),
              y: Math.random() - 0.2,
            },
            colors: colors[achievement.rarity as keyof typeof colors],
          })
        }, 250)

        return () => {
          clearTimeout(timer)
          clearInterval(interval)
        }
      }

      return () => clearTimeout(timer)
    }
  }, [isVisible, achievement, onClose])

  return (
    <AnimatePresence>
      {isVisible && achievement && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed left-1/2 top-20 z-50 w-full max-w-md -translate-x-1/2 px-4"
        >
          <Card
            className={cn(
              'relative cursor-pointer overflow-hidden border-2 shadow-2xl',
              achievement.rarity === 'legendary' &&
                'border-yellow-500 bg-yellow-500/10',
              achievement.rarity === 'epic' &&
                'border-purple-500 bg-purple-500/10',
              achievement.rarity === 'rare' && 'border-blue-500 bg-blue-500/10',
              achievement.rarity === 'common' &&
                'border-primary/50 bg-primary/5',
            )}
            onClick={onClose}
          >
            {/* Background gradient effect */}
            <div
              className={cn(
                'absolute inset-0 opacity-10',
                achievement.rarity === 'legendary' &&
                  'bg-gradient-to-br from-yellow-400 to-orange-400',
                achievement.rarity === 'epic' &&
                  'bg-gradient-to-br from-purple-400 to-pink-400',
                achievement.rarity === 'rare' &&
                  'bg-gradient-to-br from-blue-400 to-cyan-400',
              )}
            />

            {/* Content */}
            <div className="relative p-6">
              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', damping: 15 }}
                >
                  <AchievementBadge
                    achievement={achievement}
                    unlocked={true}
                    size="lg"
                    showProgress={false}
                  />
                </motion.div>

                <div className="flex-1">
                  <motion.h3
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-1 text-xl font-bold"
                  >
                    Achievement Unlocked!
                  </motion.h3>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <p className="text-lg font-semibold">{achievement.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {achievement.description}
                    </p>
                    <p className="mt-2 text-sm font-medium">
                      +{achievement.points} points earned!
                    </p>
                  </motion.div>
                </div>
              </div>

              {/* Rarity indicator */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-4 text-center"
              >
                <span
                  className={cn(
                    'text-sm font-semibold uppercase tracking-wider',
                    achievement.rarity === 'legendary' && 'text-yellow-500',
                    achievement.rarity === 'epic' && 'text-purple-500',
                    achievement.rarity === 'rare' && 'text-blue-500',
                    achievement.rarity === 'common' && 'text-muted-foreground',
                  )}
                >
                  {achievement.rarity} achievement
                </span>
              </motion.div>
            </div>

            {/* Sparkle effects for legendary */}
            {achievement.rarity === 'legendary' && (
              <>
                <div className="absolute right-4 top-2 h-3 w-3 animate-pulse rounded-full bg-yellow-400" />
                <div className="animation-delay-300 absolute bottom-4 left-6 h-2 w-2 animate-pulse rounded-full bg-yellow-400/80" />
                <div className="animation-delay-700 absolute left-8 top-6 h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-400/60" />
              </>
            )}
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
