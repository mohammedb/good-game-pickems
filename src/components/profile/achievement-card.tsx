'use client'

import { motion } from 'framer-motion'
import { Icons } from '@/lib/icons'
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
  trophy: Icons.trophy,
  target: Icons.target,
  sparkles: Icons.sparkles,
  medal: Icons.medal,
  crown: Icons.crown,
}

const rarityStyles = {
  common: {
    border: 'border-muted',
    bg: 'bg-muted/50',
    iconBg: 'bg-muted',
    text: 'text-foreground',
    progressBar: 'bg-muted-foreground',
  },
  rare: {
    border: 'border-info/30',
    bg: 'bg-info/5',
    iconBg: 'bg-info/20',
    text: 'text-info',
    progressBar: 'bg-info',
  },
  epic: {
    border: 'border-tier-platinum/30',
    bg: 'bg-tier-platinum/5',
    iconBg: 'bg-tier-platinum/20',
    text: 'text-tier-platinum',
    progressBar: 'bg-tier-platinum',
  },
  legendary: {
    border: 'border-tier-gold/30',
    bg: 'bg-tier-gold/5',
    iconBg: 'bg-tier-gold/20',
    text: 'text-tier-gold',
    progressBar: 'bg-tier-gold',
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
                unlocked ? styles.border : 'border-muted',
                unlocked ? styles.bg : 'bg-muted/20',
                !unlocked && 'opacity-75',
              )}
            >
              {/* Lock overlay for locked achievements */}
              {!unlocked && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                  <Icons.matchLocked className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              {/* Sparkle effect for legendary achievements */}
              {unlocked && rarity === 'legendary' && (
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute left-4 top-2 h-2 w-2 animate-pulse rounded-full bg-tier-gold" />
                  <div className="absolute bottom-4 right-6 h-1.5 w-1.5 animate-pulse rounded-full bg-tier-gold/80 delay-300" />
                  <div className="absolute right-8 top-6 h-1 w-1 animate-pulse rounded-full bg-tier-gold delay-700" />
                </div>
              )}

              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full',
                    unlocked ? styles.iconBg : 'bg-muted',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-6 w-6',
                      unlocked ? styles.text : 'text-muted-foreground',
                    )}
                  />
                </div>

                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <h3
                      className={cn(
                        'font-semibold',
                        unlocked ? styles.text : 'text-muted-foreground',
                      )}
                    >
                      {title}
                    </h3>
                    {points > 0 && (
                      <span
                        className={cn(
                          'text-sm font-medium',
                          unlocked ? styles.text : 'text-muted-foreground',
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
                        : 'text-muted-foreground',
                    )}
                  >
                    {description}
                  </p>

                  {/* Progress bar */}
                  <div className="relative h-2 w-full rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={cn(
                        'h-full rounded-full',
                        unlocked ? styles.progressBar : 'bg-muted-foreground',
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
                  <Icons.sparkles className="h-6 w-6 text-success" />
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
                    ? 'text-tier-gold'
                    : rarity === 'epic'
                      ? 'text-tier-platinum'
                      : rarity === 'rare'
                        ? 'text-blue-600'
                        : 'text-muted-foreground',
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
