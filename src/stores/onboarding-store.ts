import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type OnboardingStep = 
  | 'welcome'
  | 'predictions'
  | 'leaderboard'
  | 'profile'
  | 'theme'
  | 'complete'

interface OnboardingState {
  hasCompletedOnboarding: boolean
  currentStep: OnboardingStep
  isOpen: boolean
  setHasCompletedOnboarding: (completed: boolean) => void
  setCurrentStep: (step: OnboardingStep) => void
  setIsOpen: (isOpen: boolean) => void
  startOnboarding: () => void
  completeOnboarding: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      currentStep: 'welcome',
      isOpen: false,
      setHasCompletedOnboarding: (completed) => set({ hasCompletedOnboarding: completed }),
      setCurrentStep: (step) => set({ currentStep: step }),
      setIsOpen: (isOpen) => set({ isOpen }),
      startOnboarding: () => set({ isOpen: true, currentStep: 'welcome', hasCompletedOnboarding: false }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true, isOpen: false })
    }),
    {
      name: 'onboarding-store'
    }
  )
) 