/// <reference path="../types.d.ts" />

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const API_BASE_URL = 'https://www.goodgameligaen.no/api'

interface GoodGameMatch {
  id: number
  finished_at: string | null
  home_score: number | null
  away_score: number | null
  winning_side: string | null
}

serve(async (req: Request) => {
  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get matches that need to be synced
    const { data: matches, error: matchError } = await supabaseClient
      .from('matches')
      .select('id, gg_ligaen_api_id')
      .eq('is_finished', false)
      .lt('start_time', new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString())
      .gt('start_time', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (matchError) throw matchError

    if (!matches || matches.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No matches to sync' }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Fetch results for each match
    const updates = await Promise.all(
      matches.map(async (match) => {
        const response = await fetch(
          `${API_BASE_URL}/matches/${match.gg_ligaen_api_id}`,
          {
            headers: {
              'Authorization': `Bearer ${Deno.env.get('GOOD_GAME_LIGAEN_TOKEN')}`
            }
          }
        )

        if (!response.ok) {
          console.error(`Failed to fetch match ${match.gg_ligaen_api_id}:`, response.statusText)
          return null
        }

        const ggMatch: GoodGameMatch = await response.json()

        // Only update if match is finished
        if (!ggMatch.finished_at) return null

        // Update match in database
        const { error: updateError } = await supabaseClient
          .from('matches')
          .update({
            is_finished: true,
            team1_score: ggMatch.home_score,
            team2_score: ggMatch.away_score,
            winner_id: ggMatch.winning_side === 'home' ? 'team1_id' : 'team2_id',
            synced_at: new Date().toISOString()
          })
          .eq('id', match.id)

        if (updateError) {
          console.error(`Failed to update match ${match.id}:`, updateError)
          return null
        }

        // Call the update_match_points function
        const { error: pointsError } = await supabaseClient
          .rpc('update_match_points', { match_id_param: match.id })

        if (pointsError) {
          console.error(`Failed to update points for match ${match.id}:`, pointsError)
          return null
        }

        return match.id
      })
    )

    // Filter out null values and count successful updates
    const successfulUpdates = updates.filter(Boolean)

    // Log the sync if any matches were updated
    if (successfulUpdates.length > 0) {
      await supabaseClient
        .from('sync_logs')
        .insert({
          matches_synced: successfulUpdates.length,
          synced_by: null // System sync
        })
    }

    return new Response(
      JSON.stringify({
        message: `Successfully synced ${successfulUpdates.length} matches`,
        updated_matches: successfulUpdates
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in sync-matches function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}) 