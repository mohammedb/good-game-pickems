'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Calendar, User2, Palette, Share2 } from 'lucide-react'
import { useOnboardingStore, type OnboardingStep } from '@/stores/onboarding-store'
import { OnboardingTooltip } from './ui/onboarding-tooltip'

const steps: Array<{
  id: OnboardingStep
  title: string
  description: string
  illustration: React.ReactNode
  position: 'top' | 'right' | 'bottom' | 'left'
  targetId: string
}> = [
  {
    id: 'welcome',
    title: 'Welcome to GGWP.NO! 🎮',
    description: 'Ready to make your predictions and climb the leaderboard? Let\'s show you around!',
    illustration: (
      <div className="flex justify-center">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, -5, 5, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        >
          <Trophy className="h-16 w-16 text-primary" />
        </motion.div>
      </div>
    ),
    position: 'bottom',
    targetId: 'logo'
  },
  {
    id: 'predictions',
    title: 'Make Your Predictions',
    description: 'Browse upcoming matches and predict the winners. The more you get right, the higher you climb!',
    illustration: (
      <div className="flex justify-center">
        <motion.div
          animate={{
            y: [0, -5, 0]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        >
          <Calendar className="h-16 w-16 text-primary" />
        </motion.div>
      </div>
    ),
    position: 'bottom',
    targetId: 'nav-matches'
  },
  {
    id: 'leaderboard',
    title: 'Climb the Leaderboard',
    description: 'See how you stack up against other players. Can you reach the top spot?',
    illustration: (
      <div className="flex justify-center">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            y: [0, -3, 0]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        >
          <Trophy className="h-16 w-16 text-primary" />
        </motion.div>
      </div>
    ),
    position: 'bottom',
    targetId: 'nav-leaderboard'
  },
  {
    id: 'profile',
    title: 'Track Your Progress',
    description: 'View your stats, achievements, and prediction history in your profile.',
    illustration: (
      <div className="flex justify-center">
        <motion.div
          animate={{
            rotate: [0, 10, -10, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        >
          <User2 className="h-16 w-16 text-primary" />
        </motion.div>
      </div>
    ),
    position: 'bottom',
    targetId: 'nav-profile'
  },
  {
    id: 'theme',
    title: 'Customize Your Experience',
    description: 'Choose from different themes and color schemes to make the app your own.',
    illustration: (
      <div className="flex justify-center">
        <motion.div
          animate={{
            rotate: [0, 180],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        >
          <Palette className="h-16 w-16 text-primary" />
        </motion.div>
      </div>
    ),
    position: 'bottom',
    targetId: 'theme-switcher'
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🎉',
    description: 'Start making predictions and have fun! Don\'t forget to share your achievements with friends.',
    illustration: (
      <div className="flex justify-center">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 360]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        >
          <Share2 className="h-16 w-16 text-primary" />
        </motion.div>
      </div>
    ),
    position: 'bottom',
    targetId: 'logo'
  }
]

export function OnboardingTour() {
  const { currentStep, isOpen, setCurrentStep, completeOnboarding } = useOnboardingStore()
  const [targetElement, setTargetElement] = React.useState<HTMLElement | null>(null)

  React.useEffect(() => {
    if (isOpen && currentStep) {
      const step = steps.find(s => s.id === currentStep)
      if (step) {
        const element = document.getElementById(step.targetId)
        setTargetElement(element)
      }
    }
  }, [currentStep, isOpen])

  const currentStepIndex = steps.findIndex(s => s.id === currentStep)
  const currentStepData = steps[currentStepIndex]

  const handleNext = React.useCallback(() => {
    if (currentStepIndex === steps.length - 1) {
      completeOnboarding()
    } else {
      setCurrentStep(steps[currentStepIndex + 1].id)
    }
  }, [currentStepIndex, completeOnboarding, setCurrentStep])

  const handlePrevious = React.useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id)
    }
  }, [currentStepIndex, setCurrentStep])

  const handleSkip = React.useCallback(() => {
    completeOnboarding()
  }, [completeOnboarding])

  if (!isOpen || !targetElement || !currentStepData) return null

  const targetRect = targetElement.getBoundingClientRect()

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/50" />
      
      {/* Spotlight */}
      <div
        className="fixed z-40 rounded-full bg-white/10 transition-all duration-300"
        style={{
          top: targetRect.top - 8,
          left: targetRect.left - 8,
          width: targetRect.width + 16,
          height: targetRect.height + 16
        }}
      />

      {/* Tooltip */}
      <div
        className="fixed z-50"
        style={{
          top: targetRect.top,
          left: targetRect.left,
          width: targetRect.width,
          height: targetRect.height
        }}
      >
        <OnboardingTooltip
          title={currentStepData.title}
          description={currentStepData.description}
          illustration={currentStepData.illustration}
          position={currentStepData.position}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onSkip={handleSkip}
          isFirstStep={currentStepIndex === 0}
          isLastStep={currentStepIndex === steps.length - 1}
          step={currentStepIndex + 1}
          totalSteps={steps.length}
        />
      </div>
    </>
  )
} 