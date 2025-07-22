'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/tailwind'

interface ProgressBarProps {
  value: number
  max: number
  className?: string
  showValue?: boolean
  variant?: 'default' | 'success' | 'warning' | 'error'
}

export function ProgressBar({
  value,
  max,
  className,
  showValue = false,
  variant = 'default',
}: ProgressBarProps) {
  const percentage = Math.min(100, (value / max) * 100)

  const variants = {
    default: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  }

  return (
    <div
      className={cn(
        'relative h-4 w-full overflow-hidden rounded-full bg-secondary',
        className,
      )}
    >
      <motion.div
        className={cn('h-full rounded-full', variants[variant])}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 20,
        }}
      />
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              'text-xs font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]',
              // Use white text on dark backgrounds (default variant for 4th place+)
              variant === 'default' && percentage > 30 ? 'text-white' : '',
              // Use dark text on light backgrounds
              variant === 'success' && percentage < 70
                ? 'text-foreground'
                : 'text-white',
              // Always use contrasting text
              variant === 'warning' ? 'text-foreground' : '',
              variant === 'error' ? 'text-white' : '',
              // Fallback for low percentage values
              percentage <= 30 ? 'text-foreground' : '',
            )}
            style={{
              textShadow:
                percentage > 30 || variant !== 'default'
                  ? '0 1px 2px rgba(0,0,0,0.5)'
                  : '0 1px 2px rgba(255,255,255,0.5)',
            }}
          >
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  )
}
