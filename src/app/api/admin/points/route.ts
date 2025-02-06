import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import { z } from 'zod'
import { adjustmentSchema } from '@/lib/validations/schemas'

async function isAdmin(userId: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { data } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .single()

  return data?.is_admin === true
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    // Check if user is authenticated and is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate request body
    const body = await request.json()
    const validatedData = adjustmentSchema.parse(body)

    // Update the pick
    const { error: updateError } = await supabase
      .from('picks')
      .update({
        is_correct: validatedData.is_correct,
        manual_adjustment_reason: validatedData.reason,
        adjusted_by: user.id,
        adjusted_at: new Date().toISOString(),
      })
      .eq('id', validatedData.pick_id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      message: 'Points adjusted successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 },
      )
    }

    console.error('Error adjusting points:', error)
    return NextResponse.json(
      { error: 'Failed to adjust points' },
      { status: 500 },
    )
  }
}
