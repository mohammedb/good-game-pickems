'use client'

import { create } from 'zustand'
import { createBrowserClient } from '@/utils/supabase'

interface UserProfile {
  id: string
  email: string
  username: string | null
}

interface UserState {
  user: any | null
  profile: UserProfile | null
  isLoading: boolean
  error: string | null
  fetchUser: () => Promise<void>
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  error: null,
  fetchUser: async () => {
    const supabase = createBrowserClient()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        set({ user: null, profile: null, isLoading: false })
        return
      }

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, email, username')
        .eq('id', user.id)
        .single()

      if (profileError) {
        set({ error: profileError.message, isLoading: false })
        return
      }

      set({ user, profile, isLoading: false, error: null })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An error occurred',
        isLoading: false 
      })
    }
  }
})) 