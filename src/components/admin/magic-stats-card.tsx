'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { NumberTicker } from '@/components/magicui/number-ticker'
import { BorderBeam } from '@/components/magicui/border-beam'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

interface MagicStatsCardProps {
  title: string
  value: number | string
  description?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  highlight?: boolean
  className?: string
  children?: React.ReactNode
}

export function MagicStatsCard({
  title,
  value,
  description,
  icon,
  trend,
  highlight = false,
  className,
  children,
}: MagicStatsCardProps) {
  const [isHovered, setIsHovered] = React.useState(false)
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
      transition={prefersReducedMotion ? {} : { duration: 0.3 }}
      whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card
        className={cn(
          'relative overflow-hidden transition-all duration-300',
          'hover:shadow-lg hover:shadow-primary/10',
          highlight && 'ring-2 ring-primary ring-offset-2',
          className,
        )}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {title}
              </p>
              <div className="flex items-baseline gap-2">
                {typeof value === 'number' && !prefersReducedMotion ? (
                  <NumberTicker
                    value={value}
                    className="text-3xl font-bold tracking-tight"
                  />
                ) : (
                  <span className="text-3xl font-bold tracking-tight">
                    {value}
                  </span>
                )}
                {trend && (
                  <span
                    className={cn(
                      'text-sm font-medium',
                      trend.isPositive ? 'text-green-600' : 'text-red-600',
                    )}
                  >
                    {trend.isPositive ? '+' : ''}
                    {trend.value}%
                  </span>
                )}
              </div>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
              {children}
            </div>
            {icon && (
              <div
                className={cn(
                  'rounded-full p-3 transition-all duration-300',
                  'bg-primary/10 text-primary',
                  isHovered && 'scale-110 bg-primary/20',
                )}
              >
                {icon}
              </div>
            )}
          </div>
        </CardContent>
        {(highlight || isHovered) && !prefersReducedMotion && (
          <BorderBeam
            size={250}
            duration={highlight ? 8 : 12}
            delay={0}
            borderWidth={2}
            colorFrom="#3b82f6"
            colorTo="#8b5cf6"
          />
        )}
      </Card>
    </motion.div>
  )
}
