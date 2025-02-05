'use server'

import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'

export async function signOut() {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)
  
  const { error } = await supabase.auth.signOut()

  if (error) {
    return { error: error.message }
  }

  return { success: true }
} 