'use server'

import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import { revalidatePath } from 'next/cache'

interface PickWithMatch {
  id: string
  match_id: string
  predicted_winner: string
  matches: {
    start_time: string
  }
}

export async function submitPrediction(
  matchId: string,
  predictedWinner: string,
  userId: string,
  team1Maps?: number,
  team2Maps?: number
) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    // First check if prediction exists
    const { data: existingPick } = await supabase
      .from('picks')
      .select('id')
      .eq('match_id', matchId)
      .eq('user_id', userId)
      .single()

    if (existingPick) {
      // Update existing prediction
      const { error } = await supabase
        .from('picks')
        .update({
          predicted_winner: predictedWinner,
          predicted_team1_maps: team1Maps,
          predicted_team2_maps: team2Maps,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPick.id)

      if (error) {
        console.error('Error updating prediction:', error)
        return { error: 'Kunne ikke oppdatere tipset' }
      }
    } else {
      // Insert new prediction
      const { error } = await supabase
        .from('picks')
        .insert({
          match_id: matchId,
          user_id: userId,
          predicted_winner: predictedWinner,
          predicted_team1_maps: team1Maps,
          predicted_team2_maps: team2Maps
        })

      if (error) {
        console.error('Error saving prediction:', error)
        return { error: 'Kunne ikke lagre tipset' }
      }
    }

    // Revalidate the matches page to show updated state
    revalidatePath('/matches')
    return { success: true }
  } catch (error) {
    console.error('Error in submitPrediction:', error)
    return { error: 'En uventet feil oppstod' }
  }
}

export async function removeUnlockedPredictions(userId: string) {
  try {
    console.log('Starting removeUnlockedPredictions for user:', userId)
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)
    const now = new Date()
    const twoHoursFromNow = new Date(now.getTime() + (2 * 60 * 60 * 1000))
    
    // Call the database function to remove unlocked picks
    const { data: deletedPicks, error } = await supabase
      .rpc('remove_unlocked_picks', {
        user_id_param: userId,
        cutoff_time: twoHoursFromNow.toISOString()
      })

    if (error) {
      console.error('Error removing predictions:', error)
      return { error: 'Kunne ikke fjerne tips' }
    }

    console.log('Successfully deleted picks:', deletedPicks)

    // Revalidate both matches and profile pages
    revalidatePath('/matches')
    revalidatePath('/profile')
    
    return { 
      success: true, 
      message: `Fjernet ${deletedPicks?.length || 0} ulåste tips`,
      deletedPicks 
    }
  } catch (error) {
    console.error('Error in removeUnlockedPredictions:', error)
    return { error: 'En uventet feil oppstod' }
  }
} 