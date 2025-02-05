'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/tailwind'
import { Button } from './button'
import { ChevronRight, ChevronLeft } from 'lucide-react'

interface OnboardingTooltipProps {
  title: string
  description: string
  illustration?: React.ReactNode
  position?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
  onNext?: () => void
  onPrevious?: () => void
  onSkip?: () => void
  isFirstStep?: boolean
  isLastStep?: boolean
  step: number
  totalSteps: number
}

export function OnboardingTooltip({
  title,
  description,
  illustration,
  position = 'bottom',
  className,
  onNext,
  onPrevious,
  onSkip,
  isFirstStep,
  isLastStep,
  step,
  totalSteps
}: OnboardingTooltipProps) {
  const positionClasses = {
    top: 'bottom-full mb-2',
    right: 'left-full ml-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2'
  }

  const arrowClasses = {
    top: 'bottom-[-6px] rotate-45',
    right: 'left-[-6px] rotate-[-45deg]',
    bottom: 'top-[-6px] rotate-[225deg]',
    left: 'right-[-6px] rotate-[135deg]'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: position === 'top' ? 10 : position === 'bottom' ? -10 : 0, x: position === 'left' ? 10 : position === 'right' ? -10 : 0 }}
      animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        'absolute z-50 w-80 rounded-lg bg-popover p-4 text-popover-foreground shadow-lg',
        positionClasses[position],
        className
      )}
    >
      {/* Arrow */}
      <div
        className={cn(
          'absolute h-3 w-3 bg-popover',
          arrowClasses[position]
        )}
      />

      {/* Content */}
      <div className="space-y-4">
        {illustration && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-4"
          >
            {illustration}
          </motion.div>
        )}
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h4 className="mb-1 text-lg font-semibold">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </motion.div>

        {/* Progress and Controls */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onPrevious}
                className="h-8 px-2"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            )}
            <div className="text-sm text-muted-foreground">
              {step}/{totalSteps}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isLastStep && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                className="h-8"
              >
                Skip
              </Button>
            )}
            <Button
              size="sm"
              onClick={onNext}
              className="h-8"
            >
              {isLastStep ? 'Finish' : 'Next'}
              {!isLastStep && <ChevronRight className="ml-1 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
} 