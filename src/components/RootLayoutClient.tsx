'use client'

import { useEffect } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import Navigation from '@/components/Navigation'
import Onboarding from '@/components/Onboarding'
import { useUserStore } from '@/stores/user-store'
import { QueryProvider } from '@/providers/query-provider'

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const {
    user,
    profile,
    isLoading,
    hasCompletedOnboarding,
    setHasCompletedOnboarding,
    fetchUser,
  } = useUserStore()

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  return (
    <QueryProvider>
      <ThemeProvider>
        <Navigation />
        <main>{children}</main>
        <Toaster />
        {!isLoading && user && profile && !hasCompletedOnboarding && (
          <Onboarding onComplete={() => setHasCompletedOnboarding(true)} />
        )}
        <Analytics />
      </ThemeProvider>
    </QueryProvider>
  )
}
