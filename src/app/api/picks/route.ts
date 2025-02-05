import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import { z } from 'zod'

// Schema for validating the request body
const pickSchema = z.object({
  user_id: z.string().uuid(),
  match_id: z.string().uuid(),
  predicted_winner: z.string().uuid()
})

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json()
    
    // Validate request body against schema
    const validatedData = pickSchema.parse(body)
    
    // Initialize Supabase client
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)
    
    // Insert the pick into the database
    const { data, error } = await supabase
      .from('picks')
      .insert([{
        user_id: validatedData.user_id,
        match_id: validatedData.match_id,
        predicted_winner: validatedData.predicted_winner
      }])
      .select()
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to save prediction' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { message: 'Prediction saved successfully', data },
      { status: 201 }
    )
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: err.errors },
        { status: 400 }
      )
    }
    
    console.error('Error saving prediction:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 