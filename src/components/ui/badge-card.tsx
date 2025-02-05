'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/tailwind'
import { Trophy, Medal, Star, Award, Crown } from 'lucide-react'

const badgeIcons = {
  trophy: Trophy,
  medal: Medal,
  star: Star,
  award: Award,
  crown: Crown
}

interface BadgeCardProps {
  title: string
  description: string
  icon: keyof typeof badgeIcons
  variant?: 'bronze' | 'silver' | 'gold' | 'platinum'
  isLocked?: boolean
  progress?: number
  className?: string
}

export function BadgeCard({
  title,
  description,
  icon,
  variant = 'bronze',
  isLocked = false,
  progress,
  className
}: BadgeCardProps) {
  const Icon = badgeIcons[icon]
  
  const variants = {
    bronze: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    silver: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
    gold: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    platinum: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative overflow-hidden rounded-lg border p-4',
        isLocked ? 'opacity-50 grayscale' : variants[variant],
        className
      )}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20
        }}
        className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 dark:bg-black/90"
      >
        <Icon className="h-6 w-6" />
      </motion.div>
      <h3 className="mb-1 font-semibold">{title}</h3>
      <p className="text-sm opacity-90">{description}</p>
      {progress !== undefined && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
          <motion.div
            className="h-full bg-current"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, progress)}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          />
        </div>
      )}
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
          <div className="rounded-full bg-background/90 p-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m0 0v2m0-2h2m-2 0H8m10-6a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
        </div>
      )}
    </motion.div>
  )
} 