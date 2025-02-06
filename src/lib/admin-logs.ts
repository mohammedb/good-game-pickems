import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

type LogType = 'sync' | 'points' | 'user' | 'match' | 'error' | 'success'

export async function addAdminLog(
  type: LogType,
  message: string,
  details?: string,
) {
  try {
    const supabase = createServerComponentClient({ cookies })

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!userData?.is_admin) {
      throw new Error('User not authorized')
    }

    // Add log entry
    const { error } = await supabase.from('admin_logs').insert({
      type,
      message,
      details,
      user_id: user.id,
    })

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error adding admin log:', error)
    // Don't throw the error - we don't want to break the main functionality
    // if logging fails
  }
}
