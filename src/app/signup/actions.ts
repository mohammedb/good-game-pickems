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
      },
    },
  })

  if (signUpError) {
    console.error('Signup error:', signUpError)
    return { error: signUpError.message }
  }

  // If we have an auth user, consider it a success
  // The trigger will handle profile creation asynchronously
  if (authData?.user) {
    // Try to insert the user profile, but don't fail if it doesn't work
    // as the trigger will handle it
    try {
      await supabase.from('users').insert({
        id: authData.user.id,
        email: email,
        username: username,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    } catch (error) {
      // Log the error but don't fail the signup
      console.log('Profile creation will be handled by trigger:', error)
    }

    return {
      success: true,
      message:
        'Account created successfully! Please check your email to verify your account.',
    }
  }

  return {
    error: 'Unable to create account. Please try again.',
  }
}
