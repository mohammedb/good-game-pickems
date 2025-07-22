'use client'

import * as React from 'react'
import { ShimmerButton } from '@/components/magicui/shimmer-button'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MagicActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  isSuccess?: boolean
  isError?: boolean
  loadingText?: string
  icon?: React.ReactNode
  variant?: 'default' | 'destructive' | 'success'
}

export function MagicActionButton({
  children,
  isLoading,
  isSuccess,
  isError,
  loadingText,
  icon,
  className,
  variant = 'default',
  ...props
}: MagicActionButtonProps) {
  const [showSuccess, setShowSuccess] = React.useState(false)
  const [showError, setShowError] = React.useState(false)

  React.useEffect(() => {
    if (isSuccess) {
      setShowSuccess(true)
      const timer = setTimeout(() => setShowSuccess(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [isSuccess])

  React.useEffect(() => {
    if (isError) {
      setShowError(true)
      const timer = setTimeout(() => setShowError(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [isError])

  const shimmerColor = React.useMemo(() => {
    if (variant === 'destructive') return '#ef4444'
    if (variant === 'success') return '#10b981'
    return '#3b82f6'
  }, [variant])

  const background = React.useMemo(() => {
    if (variant === 'destructive')
      return 'linear-gradient(110deg,#dc2626 0%,#b91c1c 50%,#dc2626 100%)'
    if (variant === 'success')
      return 'linear-gradient(110deg,#059669 0%,#047857 50%,#059669 100%)'
    return 'linear-gradient(110deg,#1e40af 0%,#1d4ed8 50%,#1e40af 100%)'
  }, [variant])

  return (
    <ShimmerButton
      shimmerColor={shimmerColor}
      shimmerSize="0.1em"
      background={background}
      className={cn(
        'relative min-w-[120px] font-medium',
        'hover:scale-[1.02] active:scale-[0.98]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        className,
      )}
      disabled={isLoading || showSuccess || showError}
      aria-busy={isLoading}
      aria-live="polite"
      {...props}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 text-white"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{loadingText || 'Loading...'}</span>
          </motion.div>
        ) : showSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 text-white"
          >
            <Check className="h-4 w-4" />
            <span>Success!</span>
          </motion.div>
        ) : showError ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 text-white"
          >
            <AlertCircle className="h-4 w-4" />
            <span>Error</span>
          </motion.div>
        ) : (
          <motion.div
            key="default"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 text-white"
          >
            {icon}
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </ShimmerButton>
  )
}
