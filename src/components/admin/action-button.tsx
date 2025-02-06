'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  isSuccess?: boolean
  isError?: boolean
  loadingText?: string
  icon?: React.ReactNode
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
}

export function ActionButton({
  children,
  isLoading,
  isSuccess,
  isError,
  loadingText,
  icon,
  className,
  variant = 'default',
  ...props
}: ActionButtonProps) {
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

  return (
    <Button
      variant={variant}
      className={cn(
        'relative min-w-[100px] transition-all hover:scale-[1.02] active:scale-[0.98]',
        className,
      )}
      disabled={isLoading || showSuccess || showError}
      {...props}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2"
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
            className="flex items-center gap-2 text-green-500"
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
            className="flex items-center gap-2 text-destructive"
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
            className="flex items-center gap-2"
          >
            {icon}
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  )
}
