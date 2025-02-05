'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/tailwind'

interface StatsCardProps {
  title: string
  value: number
  total?: number
  trend?: number
  className?: string
  children?: React.ReactNode
}

export function StatsCard({
  title,
  value,
  total,
  trend,
  className,
  children
}: StatsCardProps) {
  const percentage = total ? (value / total) * 100 : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'relative overflow-hidden rounded-lg border bg-card p-6 shadow-sm',
        className
      )}
    >
      <div className="flex justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h2 className="mt-2 text-3xl font-bold">{value}</h2>
          {total && (
            <p className="mt-1 text-sm text-muted-foreground">
              out of {total} ({Math.round(percentage!)}%)
            </p>
          )}
        </div>
        {trend !== undefined && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className={cn(
              'flex items-center rounded-full px-2 py-1',
              trend >= 0
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            )}
          >
            <svg
              className={cn('h-4 w-4', trend >= 0 ? 'rotate-0' : 'rotate-180')}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            <span className="ml-1 text-sm font-medium">
              {Math.abs(trend)}%
            </span>
          </motion.div>
        )}
      </div>
      {percentage !== null && (
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{
                type: 'spring',
                stiffness: 100,
                damping: 20,
                delay: 0.1
              }}
            />
          </div>
        </div>
      )}
      {children && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4"
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  )
} 