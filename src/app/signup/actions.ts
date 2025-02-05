'use server'

import { cookies, headers } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import { redirect } from 'next/navigation'

export async function signUp(formData: FormData) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)
  const origin = headers().get('origin')

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string

  // Validate username
  if (!username) {
    return { error: 'Username is required' }
  }
  if (username.length < 3) {
    return { error: 'Username must be at least 3 characters long' }
  }
  if (username.length > 20) {
    return { error: 'Username must be less than 20 characters' }
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return {
      error:
        'Username can only contain letters, numbers, underscores, and dashes',
    }
  }

  // Check if username is already taken
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('username')
    .eq('username', username)
    .single()

  if (checkError && checkError.code !== 'PGRST116') {
    // PGRST116 means no rows returned
    console.error('Error checking username:', checkError)
    return {
      error: 'Unable to verify username availability. Please try again.',
    }
  }

  if (existingUser) {
    return { error: 'Username is already taken' }
  }

  // Sign up the user
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/api/auth/callback`,
      data: {
        username: username,
        raw_user_meta_data: {
          username: username,
        },
      },
    },
  })

  if (signUpError) {
    console.error('Signup error:', signUpError)
    return { error: signUpError.message }
  }

  // Wait a moment for the trigger to create the user
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Verify the user was created and username was set
  if (authData.user) {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('username')
      .eq('id', authData.user.id)
      .single()

    if (userError || !userData?.username) {
      console.error('Error verifying user creation:', userError)
      return {
        error:
          'Account created but there was an issue setting up your profile. Please contact support.',
      }
    }
  }

  return { success: true }
}
