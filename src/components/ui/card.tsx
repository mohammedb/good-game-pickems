'use client'

import * as React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

type CardProps = HTMLMotionProps<'div'> & {
  ref?: React.Ref<HTMLDivElement>
  interactive?: boolean
  focusable?: boolean
}
type CardHeaderProps = HTMLMotionProps<'div'> & { ref?: React.Ref<HTMLDivElement> }
type CardTitleProps = HTMLMotionProps<'h3'> & { ref?: React.Ref<HTMLHeadingElement> }
type CardDescriptionProps = HTMLMotionProps<'p'> & { ref?: React.Ref<HTMLParagraphElement> }
type CardContentProps = HTMLMotionProps<'div'> & { ref?: React.Ref<HTMLDivElement> }
type CardFooterProps = HTMLMotionProps<'div'> & { ref?: React.Ref<HTMLDivElement> }

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, focusable = false, ...props }, ref) => (
    <motion.div
      ref={ref}
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm transition-colors',
        focusable && 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        interactive && 'hover:border-accent cursor-pointer',
        className
      )}
      tabIndex={focusable ? 0 : undefined}
      role={focusable ? 'button' : undefined}
      whileHover={interactive ? {
        scale: 1.01,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
      } : undefined}
      whileTap={interactive ? { scale: 0.98 } : undefined}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.2,
        ease: 'easeOut'
      }}
      {...props}
    />
  )
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <motion.div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <motion.h3
      ref={ref}
      className={cn(
        'text-2xl font-semibold leading-none tracking-tight',
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <motion.p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      {...props}
    />
  )
)
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <motion.div
      ref={ref}
      className={cn('p-6 pt-0', className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      {...props}
    />
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <motion.div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } 