'use client'

import { create } from 'zustand'
import { createBrowserClient } from '@/utils/supabase'

interface UserProfile {
  id: string
  email: string
  username: string | null
  has_completed_onboarding: boolean
}

interface UserState {
  user: any | null
  profile: UserProfile | null
  isLoading: boolean
  hasCompletedOnboarding: boolean
  error: string | null
  fetchUser: () => Promise<void>
  setHasCompletedOnboarding: (value: boolean) => void
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  hasCompletedOnboarding: false,
  error: null,
  fetchUser: async () => {
    const supabase = createBrowserClient()

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        set({ user: null, profile: null, isLoading: false })
        return
      }

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, email, username, has_completed_onboarding')
        .eq('id', user.id)
        .single()

      if (profileError) {
        set({ error: profileError.message, isLoading: false })
        return
      }

      set({
        user,
        profile,
        isLoading: false,
        error: null,
        hasCompletedOnboarding: profile?.has_completed_onboarding || false,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An error occurred',
        isLoading: false,
      })
    }
  },
  setHasCompletedOnboarding: async (value: boolean) => {
    const supabase = createBrowserClient()
    const { user } = get()

    if (user) {
      const { error } = await supabase
        .from('users')
        .update({ has_completed_onboarding: value })
        .eq('id', user.id)

      if (!error) {
        set((state) => ({
          hasCompletedOnboarding: value,
          profile: state.profile
            ? { ...state.profile, has_completed_onboarding: value }
            : null,
        }))
      }
    }
  },
}))
