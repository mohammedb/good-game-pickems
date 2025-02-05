'use server'

import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import { revalidatePath } from 'next/cache'

export async function submitPrediction(matchId: string, predictedWinner: string, userId: string) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    const { error } = await supabase
      .from('picks')
      .insert({
        match_id: matchId,
        user_id: userId,
        predicted_winner: predictedWinner
      })

    if (error) {
      console.error('Error saving prediction:', error)
      return { error: 'Failed to save prediction' }
    }

    // Revalidate the matches page to show updated state
    revalidatePath('/matches')
    return { success: true }
  } catch (error) {
    console.error('Error in submitPrediction:', error)
    return { error: 'An unexpected error occurred' }
  }
} 