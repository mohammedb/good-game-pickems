'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { signUp } from './actions'
import '../../styles/animations.css'

interface OnboardingStep {
  title: string
  description: string
  icon: string
}

// Onboarding steps data
const onboardingSteps: OnboardingStep[] = [
  {
    title: 'Welcome to Good Game Pickems!',
    description: 'Make predictions on esports matches and compete with others.',
    icon: '🎮'
  },
  {
    title: 'Make Your Predictions',
    description: 'Browse upcoming matches and pick your winners.',
    icon: '🎯'
  },
  {
    title: 'Climb the Leaderboard',
    description: 'Earn points for correct predictions and rise through the ranks.',
    icon: '🏆'
  }
]

interface OnboardingStepProps {
  step: OnboardingStep
  isActive: boolean
}

function OnboardingStep({ step, isActive }: OnboardingStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isActive ? 1 : 0.5, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center text-center p-6 space-y-4"
    >
      <span className="text-4xl">{step.icon}</span>
      <h3 className="text-xl font-semibold">{step.title}</h3>
      <p className="text-muted-foreground">{step.description}</p>
    </motion.div>
  )
}

interface SignUpFormProps {
  onSuccess: () => void
}

function SignUpForm({ onSuccess }: SignUpFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isVerificationPending, setIsVerificationPending] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  })
  const { toast } = useToast()
  const router = useRouter()

  // Username validation function
  const validateUsername = (username: string) => {
    const regex = /^[a-zA-Z0-9_-]{3,20}$/
    return regex.test(username)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    
    // Validate username before submitting
    if (!validateUsername(formData.username)) {
      toast({
        title: 'Invalid Username',
        description: 'Username must be 3-20 characters and can only contain letters, numbers, underscores, and dashes',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)

    try {
      const formDataObj = new FormData()
      formDataObj.append('email', formData.email)
      formDataObj.append('password', formData.password)
      formDataObj.append('username', formData.username)

      const result = await signUp(formDataObj)

      if (result.error) {
        if (result.error.includes('verification') || result.error.includes('verify')) {
          setIsVerificationPending(true)
          toast({
            title: 'Account Created Successfully!',
            description: 'Please check your email to verify your account.',
            variant: 'default'
          })
          setFormData({
            email: '',
            password: '',
            username: ''
          })
          onSuccess()
          return
        }

        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive'
        })
        return
      }

      setIsVerificationPending(true)
      toast({
        title: 'Account Created Successfully!',
        description: 'Please check your email to verify your account.',
        variant: 'default'
      })
      setFormData({
        email: '',
        password: '',
        username: ''
      })
      onSuccess()

    } catch (error: unknown) {
      console.error('Signup error:', error)
      toast({
        title: 'Error',
        description: 'Unable to create account. Please try again later.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isVerificationPending) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-6 w-full max-w-sm text-center"
      >
        <div className="space-y-4">
          <div className="text-4xl">📧</div>
          <h2 className="text-2xl font-semibold">Check Your Email</h2>
          <p className="text-muted-foreground">
            We&apos;ve sent you a verification link. Please check your email and verify your account.
          </p>
          <p className="text-sm text-muted-foreground">
            After verifying, you&apos;ll learn how to use GGWP.NO!
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 w-full max-w-sm"
      onSubmit={handleSubmit}
    >
      <div className="space-y-2">
        <Input
          type="text"
          placeholder="Username"
          value={formData.username}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData({ ...formData, username: e.target.value })
          }
          className="h-11"
          required
          minLength={3}
          maxLength={20}
        />
      </div>
      <div className="space-y-2">
        <Input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData({ ...formData, email: e.target.value })
          }
          className="h-11"
          required
        />
      </div>
      <div className="space-y-2">
        <Input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData({ ...formData, password: e.target.value })
          }
          className="h-11"
          required
          minLength={6}
        />
      </div>
      <Button
        type="submit"
        className="w-full h-11"
        disabled={isLoading}
      >
        {isLoading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            ⚡
          </motion.div>
        ) : (
          'Sign Up'
        )}
      </Button>
      <p className="text-sm text-center text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </motion.form>
  )
}

export default function SignUpPage() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background gradient */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-background via-accent to-background opacity-50"
        style={{
          backgroundSize: '400% 400%',
          animation: 'gradient 15s ease infinite'
        }}
      />

      <Card className="relative w-full max-w-lg p-8 backdrop-blur-sm bg-background/95">
        <AnimatePresence mode="wait">
          {!showOnboarding ? (
            <div key="signup" className="flex flex-col items-center space-y-6">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <h1 className="text-3xl font-bold mb-2">Welcome to GGWP.NO!</h1>
                <p className="text-muted-foreground">
                  Make your predictions and climb the ranks
                </p>
              </motion.div>
              <SignUpForm onSuccess={() => setShowOnboarding(true)} />
            </div>
          ) : (
            <motion.div
              key="onboarding"
              className="space-y-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <OnboardingStep
                step={onboardingSteps[currentStep]}
                isActive={true}
              />
              <div className="flex justify-between items-center">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                  disabled={currentStep === 0}
                >
                  Previous
                </Button>
                <div className="flex gap-2">
                  {onboardingSteps.map((_, index) => (
                    <motion.div
                      key={index}
                      className={cn(
                        'w-2 h-2 rounded-full',
                        index === currentStep
                          ? 'bg-primary'
                          : 'bg-muted'
                      )}
                    />
                  ))}
                </div>
                <Button
                  onClick={() => {
                    if (currentStep < onboardingSteps.length - 1) {
                      setCurrentStep((prev) => prev + 1)
                    } else {
                      router.push('/login')
                    }
                  }}
                >
                  {currentStep === onboardingSteps.length - 1
                    ? 'Go to Login'
                    : 'Next'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  )
} 