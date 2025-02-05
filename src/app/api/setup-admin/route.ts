import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if there are any admins
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_admin', true)

    // If there are already admins, only existing admins can create new ones
    if (count && count > 0) {
      const { data: isAdmin } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!isAdmin?.is_admin) {
        return NextResponse.json(
          { error: 'Only existing admins can create new admins' },
          { status: 403 }
        )
      }
    }

    // Get the target user ID from the request body
    const { targetUserId = user.id } = await request.json()

    // Update the user to be an admin
    const { error: updateError } = await supabase
      .from('users')
      .update({ is_admin: true })
      .eq('id', targetUserId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      message: 'Admin privileges granted successfully'
    })
  } catch (error) {
    console.error('Error in setup-admin:', error)
    return NextResponse.json(
      { error: 'Failed to setup admin user' },
      { status: 500 }
    )
  }
} 