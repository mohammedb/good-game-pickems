'use client'

import * as React from 'react'
import { AnimatedCircularProgressBar } from '@/components/magicui/animated-circular-progress-bar'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SyncProgressIndicatorProps {
  isActive: boolean
  progress: number
  status: 'idle' | 'syncing' | 'success' | 'error'
  message?: string
}

export function SyncProgressIndicator({
  isActive,
  progress,
  status,
  message,
}: SyncProgressIndicatorProps) {
  const [showIndicator, setShowIndicator] = React.useState(false)

  React.useEffect(() => {
    if (isActive || status !== 'idle') {
      setShowIndicator(true)
    } else {
      const timer = setTimeout(() => setShowIndicator(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isActive, status])

  if (!showIndicator) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <div className="relative">
          <AnimatedCircularProgressBar
            max={100}
            min={0}
            value={progress}
            gaugePrimaryColor={
              status === 'error'
                ? 'rgb(239 68 68)'
                : status === 'success'
                  ? 'rgb(34 197 94)'
                  : 'rgb(59 130 246)'
            }
            gaugeSecondaryColor="rgba(0, 0, 0, 0.1)"
            className={cn('h-24 w-24', status === 'success' && 'animate-pulse')}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            {status === 'syncing' && (
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            )}
            {status === 'success' && (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            )}
            {status === 'error' && <XCircle className="h-6 w-6 text-red-500" />}
          </div>
        </div>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 rounded-lg border bg-background/95 px-3 py-2 shadow-lg backdrop-blur-sm"
          >
            <p className="text-center text-sm font-medium">{message}</p>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
