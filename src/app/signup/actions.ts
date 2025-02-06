'use server'

import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import { redirect } from 'next/navigation'
import { renderEmail, WelcomeEmail } from '@/lib/email-templates'
import { sendEmail } from '@/lib/email'
import { signUpSchema } from '@/lib/validations/schemas'
import { z } from 'zod'

// Make sure we use the correct site URL with www and https
const SITE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://www.ggwp.no' // Always use www and https in production
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

const REDIRECT_URL = `${SITE_URL}/api/auth/callback`

async function sendWelcomeEmail(
  email: string,
  username: string,
  verificationUrl: string,
) {
  const welcomeEmailHtml = await renderEmail(
    WelcomeEmail({
      username,
      verificationUrl,
    }),
  )

  await sendEmail({
    to: email,
    subject: 'Velkommen til GGWP.no! 🎮',
    html: welcomeEmailHtml,
  })
}

export async function signUp(formData: FormData) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string

  try {
    // Validate all fields using the schema
    const validatedData = signUpSchema.parse({
      email,
      password,
      username,
    })

    // Check if username is already taken
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('username')
      .eq('username', validatedData.username)
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

    // Configure Supabase auth with site URL
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        emailRedirectTo: REDIRECT_URL,
        data: {
          username: validatedData.username,
        },
      },
    })

    if (signUpError) {
      console.error('Signup error:', signUpError)
      return { error: signUpError.message }
    }

    // If we have an auth user, consider it a success
    if (authData?.user) {
      try {
        // Insert the user profile
        await supabase.from('users').insert({
          id: authData.user.id,
          email: validatedData.email,
          username: validatedData.username,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        // Send welcome email with verification link
        await sendWelcomeEmail(
          validatedData.email,
          validatedData.username,
          REDIRECT_URL,
        )
      } catch (error) {
        // Log the error but don't fail the signup
        console.error('Error in signup process:', error)
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    console.error('Signup error:', error)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}
