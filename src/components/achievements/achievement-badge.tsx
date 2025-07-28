'use client'

import { motion } from 'framer-motion'
import { Icons } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { Achievement } from '@/lib/achievements/types'

interface AchievementBadgeProps {
  achievement: Achievement
  unlocked: boolean
  progress?: number
  size?: 'sm' | 'md' | 'lg'
  showProgress?: boolean
  className?: string
}

const sizeClasses = {
  sm: {
    container: 'h-12 w-12',
    icon: 'h-6 w-6',
    badge: 'text-xs',
  },
  md: {
    container: 'h-16 w-16',
    icon: 'h-8 w-8',
    badge: 'text-sm',
  },
  lg: {
    container: 'h-20 w-20',
    icon: 'h-10 w-10',
    badge: 'text-base',
  },
}

const rarityColors = {
  common: {
    bg: 'bg-muted',
    border: 'border-muted-foreground/20',
    glow: '',
  },
  rare: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/50',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.5)]',
  },
  epic: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/50',
    glow: 'shadow-[0_0_25px_rgba(168,85,247,0.5)]',
  },
  legendary: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/50',
    glow: 'shadow-[0_0_30px_rgba(234,179,8,0.6)]',
  },
}

const iconMap: Record<string, any> = {
  trophy: Icons.trophy,
  target: Icons.target,
  sparkles: Icons.sparkles,
  medal: Icons.medal,
  crown: Icons.crown,
  eye: Icons.eye,
  'chart-line': Icons.chartLine,
  star: Icons.star,
  flame: Icons.flame,
  fire: Icons.fire,
  'trending-up': Icons.trendingUp,
  clock: Icons.clock,
  calendar: Icons.calendar,
  'calendar-check': Icons.calendarCheck,
  heart: Icons.heart,
  gamepad: Icons.gamepad,
  share: Icons.share,
}

export function AchievementBadge({
  achievement,
  unlocked,
  progress = 0,
  size = 'md',
  showProgress = true,
  className,
}: AchievementBadgeProps) {
  const sizes = sizeClasses[size]
  const rarity = rarityColors[achievement.rarity]
  const Icon = iconMap[achievement.icon] || Icons.trophy

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={unlocked ? { scale: 1.05 } : undefined}
      className={cn('relative', className)}
    >
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full border-2 transition-all duration-300',
          sizes.container,
          unlocked
            ? [rarity.bg, rarity.border, rarity.glow]
            : 'border-muted-foreground/20 bg-muted/50',
          !unlocked && 'opacity-60',
        )}
      >
        {/* Lock overlay for locked achievements */}
        {!unlocked && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-[1px]">
            <Icons.lock className="h-4 w-4 text-muted-foreground" />
          </div>
        )}

        {/* Icon */}
        <Icon
          className={cn(
            sizes.icon,
            'transition-colors',
            unlocked
              ? achievement.rarity === 'legendary'
                ? 'text-yellow-500'
                : achievement.rarity === 'epic'
                  ? 'text-purple-500'
                  : achievement.rarity === 'rare'
                    ? 'text-blue-500'
                    : 'text-foreground'
              : 'text-muted-foreground',
          )}
        />

        {/* Progress ring for locked achievements */}
        {!unlocked && showProgress && progress > 0 && (
          <svg
            className="absolute inset-0 -rotate-90"
            viewBox="0 0 100 100"
            fill="none"
          >
            <circle
              cx="50"
              cy="50"
              r="48"
              stroke="currentColor"
              strokeWidth="4"
              className="text-muted-foreground/20"
            />
            <circle
              cx="50"
              cy="50"
              r="48"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={`${(progress / 100) * 301.6} 301.6`}
              className={cn(
                'transition-all duration-500',
                achievement.rarity === 'legendary'
                  ? 'text-yellow-500'
                  : achievement.rarity === 'epic'
                    ? 'text-purple-500'
                    : achievement.rarity === 'rare'
                      ? 'text-blue-500'
                      : 'text-primary',
              )}
            />
          </svg>
        )}

        {/* Sparkle effect for legendary achievements */}
        {unlocked && achievement.rarity === 'legendary' && (
          <>
            <div className="absolute -left-1 -top-1 h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
            <div className="animation-delay-300 absolute -bottom-1 -right-1 h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-400/80" />
            <div className="animation-delay-700 absolute -right-2 top-1 h-1 w-1 animate-pulse rounded-full bg-yellow-400/60" />
          </>
        )}
      </div>

      {/* Rarity badge */}
      {size !== 'sm' && (
        <Badge
          variant={unlocked ? 'default' : 'secondary'}
          className={cn(
            'absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap',
            sizes.badge,
            unlocked &&
              achievement.rarity === 'legendary' &&
              'bg-yellow-500 text-white',
            unlocked &&
              achievement.rarity === 'epic' &&
              'bg-purple-500 text-white',
            unlocked &&
              achievement.rarity === 'rare' &&
              'bg-blue-500 text-white',
          )}
        >
          {achievement.points}p
        </Badge>
      )}
    </motion.div>
  )
}
