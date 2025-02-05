import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface OnboardingStep {
  title: string
  description: string
  icon: string
}

const onboardingSteps: OnboardingStep[] = [
  {
    title: 'Velkommen til GGWP.NO!',
    description: 'Gjør prediksjoner på e-sport kamper og konkurrer med andre.',
    icon: '🎮',
  },
  {
    title: 'Gjør dine prediksjoner',
    description: 'Se kommende kamper og velg dine vinnere.',
    icon: '🎯',
  },
  {
    title: 'Klatre på rangstigen',
    description: 'Få poeng for riktige prediksjoner og stig i gradene.',
    icon: '🏆',
  },
]

interface OnboardingProps {
  onComplete: () => void
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      onComplete()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-lg rounded-lg bg-card p-8 shadow-lg"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex flex-col items-center space-y-4 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="mb-4 text-6xl"
              >
                {onboardingSteps[currentStep].icon}
              </motion.div>
              <h2 className="text-2xl font-bold">
                {onboardingSteps[currentStep].title}
              </h2>
              <p className="text-muted-foreground">
                {onboardingSteps[currentStep].description}
              </p>
            </div>

            <div className="flex flex-col space-y-4">
              <div className="flex justify-center gap-2 py-4">
                {onboardingSteps.map((_, index) => (
                  <motion.div
                    key={index}
                    className={cn(
                      'h-2 w-2 rounded-full transition-colors',
                      index === currentStep ? 'bg-primary' : 'bg-muted',
                    )}
                    animate={{
                      scale: index === currentStep ? 1.2 : 1,
                    }}
                  />
                ))}
              </div>

              <div className="flex justify-between">
                <Button
                  variant="ghost"
                  onClick={() =>
                    setCurrentStep((prev) => Math.max(0, prev - 1))
                  }
                  disabled={currentStep === 0}
                >
                  Tilbake
                </Button>
                <Button onClick={handleNext}>
                  {currentStep === onboardingSteps.length - 1
                    ? 'Kom i gang!'
                    : 'Neste'}
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
