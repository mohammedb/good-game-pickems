'use server'

import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import { redirect } from 'next/navigation'

export async function signOut() {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)
  await supabase.auth.signOut()
  redirect('/login')
} 