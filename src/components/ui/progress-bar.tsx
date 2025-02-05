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
  variant = 'default'
}: ProgressBarProps) {
  const percentage = Math.min(100, (value / max) * 100)

  const variants = {
    default: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  }

  return (
    <div className={cn('relative h-4 w-full overflow-hidden rounded-full bg-secondary', className)}>
      <motion.div
        className={cn('h-full rounded-full', variants[variant])}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 20
        }}
      />
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  )
} 