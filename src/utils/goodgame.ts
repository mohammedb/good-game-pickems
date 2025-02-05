import { GoodGameMatch, Match } from '@/app/matches/types'

const DIVISION_ID = '12517' // CS:GO Division
const SEASON_ID = '13162'   // Current Season
const API_BASE_URL = 'https://www.goodgameligaen.no/api'

export async function fetchGoodGameMatches(): Promise<GoodGameMatch[]> {
  try {
    const params = new URLSearchParams({
      division: '12517',
      game: 'csgo',
      limit: '100',
      offset: '0',
      order_by: 'round_number',
      order_dir: 'asc',
      season: '13162',
      status: 'unfinished'
    })

    const url = `${API_BASE_URL}/matches?${params.toString()}`
    console.log('Fetching matches from:', url)
    
    const response = await fetch(url, {
      next: { revalidate: 300 }, // Cache for 5 minutes
      headers: {
        'Authorization': `Bearer ${process.env.GOOD_GAME_LIGAEN_TOKEN}`
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`Failed to fetch matches: ${response.statusText}. ${errorText}`)
    }

    const data = await response.json()
    
    // Log the first match to see its structure
    if (data.length > 0) {
      console.log('Sample match structure:', JSON.stringify(data[0], null, 2))
    }
    
    console.log('Fetched matches:', data.length)
    return data
  } catch (error) {
    console.error('Error fetching from Good Game Ligaen:', error)
    throw error
  }
}

export function transformGoodGameMatch(match: GoodGameMatch): Match {
  try {
    // Log the match being transformed
    console.log('Transforming match:', JSON.stringify(match, null, 2))

    // Check if we have the required properties
    if (!match.home_signup?.team || !match.away_signup?.team) {
      console.error('Missing team data in match:', match)
      throw new Error('Invalid match data: missing team information')
    }

    return {
      id: match.id.toString(),
      team1: match.home_signup.team.name,
      team2: match.away_signup.team.name,
      team1_id: match.home_signup.team.id.toString(),
      team2_id: match.away_signup.team.id.toString(),
      team1_logo: match.home_signup.team.logo?.url,
      team2_logo: match.away_signup.team.logo?.url,
      start_time: match.start_time,
      division_id: DIVISION_ID,
      is_finished: !!match.finished_at,
      best_of: match.best_of || 3, // Default to BO3 if not specified
      round: match.round_identifier_text
    }
  } catch (error) {
    console.error('Error transforming match:', error)
    throw error
  }
}

export async function syncMatches(supabase: any) {
  try {
    console.log('Starting match sync...')
    
    // 1. Fetch matches from Good Game Ligaen
    const ggMatches = await fetchGoodGameMatches()
    console.log(`Fetched ${ggMatches.length} matches from API`)
    
    if (ggMatches.length === 0) {
      console.log('No matches returned from API')
      return {
        success: true,
        synced_matches: 0,
        matches: []
      }
    }
    
    // 2. Transform matches to our format
    const transformedMatches = await Promise.all(
      ggMatches
        .filter(match => match && match.home_signup?.team && match.away_signup?.team)
        .map(async match => {
          // Get the existing match ID if it exists
          const { data: existingMatch } = await supabase
            .from('matches')
            .select('id')
            .eq('gg_ligaen_api_id', match.id.toString())
            .single()

          const matchData = transformGoodGameMatch(match)
          return {
            ...matchData,
            id: existingMatch?.id || crypto.randomUUID(),
            gg_ligaen_api_id: match.id.toString(),
            synced_at: new Date().toISOString()
          }
        })
    )

    console.log(`Transformed ${transformedMatches.length} matches`)

    if (transformedMatches.length === 0) {
      console.log('No valid matches to sync')
      return {
        success: true,
        synced_matches: 0,
        matches: []
      }
    }

    // 3. Upsert matches to our database
    const { data, error } = await supabase
      .from('matches')
      .upsert(transformedMatches, {
        onConflict: 'gg_ligaen_api_id',
        ignoreDuplicates: false
      })
      .select()

    if (error) {
      console.error('Error upserting matches:', error)
      throw error
    }

    console.log(`Successfully upserted ${data?.length || 0} matches`)

    // 4. Log the sync
    const { error: logError } = await supabase
      .from('sync_logs')
      .insert({
        matches_synced: transformedMatches.length
      })

    if (logError) {
      console.error('Error logging sync:', logError)
    }

    return {
      success: true,
      synced_matches: transformedMatches.length,
      matches: data || []
    }
  } catch (error) {
    console.error('Error syncing matches:', error)
    throw error
  }
} 