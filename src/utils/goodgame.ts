import { GoodGameMatch, Match } from '@/app/matches/types'

const CS_DIVISION_ID = '18324' // CS2 1. Divisjon only
const LOL_DIVISION_ID = process.env.GOOD_GAME_LOL_DIVISION_ID || '18353' // LoL Division (configurable)
const VALORANT_DIVISION_ID =
  process.env.GOOD_GAME_VALORANT_DIVISION_ID || '18355' // Valorant Division (configurable)

// Season IDs per game type
const CS_SEASON_ID = process.env.GOOD_GAME_CS_SEASON_ID || '13599'
const LOL_SEASON_ID = process.env.GOOD_GAME_LOL_SEASON_ID || '13600'
const VALORANT_SEASON_ID = process.env.GOOD_GAME_VALORANT_SEASON_ID || '13601'

// Log configuration on startup
console.log('Good Game API Configuration:', {
  CS_DIVISION_ID,
  LOL_DIVISION_ID,
  VALORANT_DIVISION_ID,
  CS_SEASON_ID,
  LOL_SEASON_ID,
  VALORANT_SEASON_ID,
})
const API_BASE_URL = 'https://www.gamer.no/api/paradise'
const BATCH_SIZE = 25 // Process matches in smaller batches

export type GameType = 'csgo' | 'lol' | 'valorant'

export async function fetchGoodGameMatches(
  seasonId?: string,
  gameType: GameType = 'csgo',
): Promise<GoodGameMatch[]> {
  try {
    // Use game-specific season ID if not overridden
    const activeSeasonId =
      seasonId ||
      (gameType === 'lol'
        ? LOL_SEASON_ID
        : gameType === 'valorant'
          ? VALORANT_SEASON_ID
          : CS_SEASON_ID)
    const divisionId =
      gameType === 'lol'
        ? LOL_DIVISION_ID
        : gameType === 'valorant'
          ? VALORANT_DIVISION_ID
          : CS_DIVISION_ID

    console.log(
      `Attempting to fetch ${gameType} matches for season ${activeSeasonId}, division ${divisionId}`,
    )

    const allMatches: GoodGameMatch[] = []

    try {
      for (const status of ['finished', 'unfinished']) {
        // For CS2, filter by 1. Divisjon only; for LoL filter by division; for Valorant get all
        const params =
          gameType === 'csgo'
            ? new URLSearchParams({
                status,
                relation: 'all',
                division_id: CS_DIVISION_ID, // Only 1. Divisjon for CS2
                limit: '100',
              })
            : gameType === 'lol'
              ? new URLSearchParams({
                  status,
                  relation: 'all',
                  division_id: divisionId,
                  limit: '100',
                })
              : new URLSearchParams({
                  status,
                  relation: 'all',
                  limit: '100',
                })

        const url = `${API_BASE_URL}/competition/${activeSeasonId}/matchups?${params.toString()}`
        console.log(`Fetching ${status} matches from:`, url)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

        const response = await fetch(url, {
          next: { revalidate: 300 }, // Cache for 5 minutes
          headers: {
            Authorization: `Bearer ${process.env.GOOD_GAME_LIGAEN_TOKEN}`,
          },
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text()
          console.error('API Response:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText,
          })
          throw new Error(
            `Failed to fetch ${status} matches: ${response.statusText}. ${errorText}`,
          )
        }

        const data = await response.json()
        console.log(`API response for ${status} ${gameType}:`, {
          hasData: !!data.data,
          isArray: Array.isArray(data.data),
          length: data.data ? data.data.length : 0,
          keys: Object.keys(data),
        })

        if (data.data && Array.isArray(data.data)) {
          allMatches.push(...data.data)
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('Request timed out after 10 seconds')
        return []
      }
      console.error(`Error fetching ${gameType} matches:`, error)
      throw error
    }

    console.log(`Total matches fetched for ${gameType}:`, allMatches.length)
    return allMatches
  } catch (error: any) {
    console.error('Error fetching from Good Game Ligaen:', error)
    throw error
  }
}

export function transformGoodGameMatch(
  match: GoodGameMatch,
  seasonId: string,
  gameType: GameType = 'csgo',
): Match & { season_id: string; game_type: GameType } {
  try {
    // Log the match being transformed
    console.log('Transforming match:', JSON.stringify(match, null, 2))

    // Check if we have the required properties
    if (!match.home_signup?.team || !match.away_signup?.team) {
      console.error('Missing team data in match:', match)
      throw new Error('Invalid match data: missing team information')
    }

    // Check for stream information (videos field may not exist in new API)
    const stream = match.videos?.find((video) => video.source === 'twitch')

    // Determine winner ID based on winning_side and finished status
    let winnerId = null
    if (match.finished_at && match.winning_side) {
      winnerId =
        match.winning_side === 'home'
          ? match.home_signup.team.id.toString()
          : match.winning_side === 'away'
            ? match.away_signup.team.id.toString()
            : null
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
      // Use the actual division_id from the match data
      division_id:
        match.matchupable_id?.toString() ||
        (gameType === 'lol'
          ? LOL_DIVISION_ID
          : gameType === 'valorant'
            ? VALORANT_DIVISION_ID
            : CS_DIVISION_ID),
      season_id: seasonId, // Include season_id
      game_type: gameType, // Include game_type
      is_finished: !!match.finished_at,
      winner_id: winnerId,
      team1_map_score: match.home_score,
      team2_map_score: match.away_score,
      best_of: match.best_of || 3, // Default to BO3 if not specified
      round: match.round_identifier_text,
      stream_link: stream ? `https://twitch.tv/${stream.remote_id}` : undefined,
    }
  } catch (error) {
    console.error('Error transforming match:', error)
    throw error
  }
}

export async function syncMatches(
  supabase: any,
  seasonId?: string,
  gameTypes: GameType[] = ['csgo'],
) {
  try {
    console.log('Starting match sync...')
    console.log(`Syncing matches for game types: ${gameTypes.join(', ')}`)

    const allGgMatches: {
      match: GoodGameMatch
      gameType: GameType
      seasonId: string
    }[] = []

    // 1. Fetch matches from Good Game Ligaen for each game type
    for (const gameType of gameTypes) {
      try {
        // Use game-specific season ID
        const gameSeasonId =
          seasonId ||
          (gameType === 'lol'
            ? LOL_SEASON_ID
            : gameType === 'valorant'
              ? VALORANT_SEASON_ID
              : CS_SEASON_ID)

        console.log(
          `Fetching ${gameType} matches for season ${gameSeasonId}...`,
        )
        const ggMatches = await fetchGoodGameMatches(gameSeasonId, gameType)
        console.log(`Fetched ${ggMatches.length} ${gameType} matches from API`)

        // Add game type and season info to each match
        allGgMatches.push(
          ...ggMatches.map((match) => ({
            match,
            gameType,
            seasonId: gameSeasonId,
          })),
        )
      } catch (error) {
        console.error(`Error fetching ${gameType} matches:`, error)
        // Continue with other game types even if one fails
        console.log(
          `Skipping ${gameType} due to error, continuing with other games...`,
        )
      }
    }

    if (allGgMatches.length === 0) {
      console.log('No matches returned from API')
      return {
        success: true,
        synced_matches: 0,
        matches: [],
      }
    }

    // 2. Transform and process matches in batches
    const allTransformedMatches = []
    for (let i = 0; i < allGgMatches.length; i += BATCH_SIZE) {
      const batch = allGgMatches.slice(i, i + BATCH_SIZE)
      const transformedBatch = await Promise.all(
        batch
          .filter(
            ({ match }) =>
              match && match.home_signup?.team && match.away_signup?.team,
          )
          .map(async ({ match, gameType, seasonId: matchSeasonId }) => {
            try {
              // Get the existing match ID if it exists
              const { data: existingMatch } = await supabase
                .from('matches')
                .select('id, is_finished, points_processed')
                .eq('gg_ligaen_api_id', match.id.toString())
                .single()

              const matchData = transformGoodGameMatch(
                match,
                matchSeasonId,
                gameType,
              )

              // Check if we need to process points for this match
              const needsPointsProcessing =
                matchData.is_finished &&
                matchData.winner_id &&
                (!existingMatch?.points_processed ||
                  existingMatch.is_finished !== matchData.is_finished)

              return {
                ...matchData,
                id: existingMatch?.id || crypto.randomUUID(),
                gg_ligaen_api_id: match.id.toString(),
                synced_at: new Date().toISOString(),
                needs_points_processing: needsPointsProcessing,
              }
            } catch (error) {
              console.error(`Error processing match ${match.id}:`, error)
              return null
            }
          }),
      )
      allTransformedMatches.push(...transformedBatch.filter(Boolean))
    }

    console.log(`Transformed ${allTransformedMatches.length} matches`)

    if (allTransformedMatches.length === 0) {
      console.log('No valid matches to sync')
      return {
        success: true,
        synced_matches: 0,
        matches: [],
      }
    }

    // 3. Upsert matches in batches
    const results = []
    for (let i = 0; i < allTransformedMatches.length; i += BATCH_SIZE) {
      const batch = allTransformedMatches.slice(i, i + BATCH_SIZE)
      const { data, error } = await supabase
        .from('matches')
        .upsert(batch, {
          onConflict: 'gg_ligaen_api_id',
          ignoreDuplicates: false,
        })
        .select()

      if (error) {
        console.error('Error upserting batch:', error)
        continue
      }

      if (data) {
        results.push(...data)
      }
    }

    // 4. Process points for finished matches that need it
    const matchesNeedingPoints = allTransformedMatches.filter(
      (m): m is typeof m & { id: string } =>
        m !== null &&
        typeof m.needs_points_processing === 'boolean' &&
        m.needs_points_processing === true &&
        typeof m.id === 'string',
    )

    if (matchesNeedingPoints.length > 0) {
      console.log(
        `Processing points for ${matchesNeedingPoints.length} finished matches`,
      )

      for (const match of matchesNeedingPoints) {
        try {
          await supabase.rpc('update_match_points', {
            match_id_param: match.id,
          })
          console.log(`Processed points for match ${match.id}`)

          // Update points_processed flag
          await supabase
            .from('matches')
            .update({ points_processed: true })
            .eq('id', match.id)
        } catch (error) {
          console.error(`Error processing points for match ${match.id}:`, error)
        }
      }

      // Update user rankings after processing points
      try {
        await supabase.rpc('update_user_total_points')
        console.log('Updated user rankings')
      } catch (error) {
        console.error('Error updating user rankings:', error)
      }
    }

    // 5. Log the sync
    const { error: logError } = await supabase.from('sync_logs').insert({
      matches_synced: allTransformedMatches.length,
    })

    if (logError) {
      console.error('Error logging sync:', logError)
    }

    return {
      success: true,
      synced_matches: allTransformedMatches.length,
      matches: results,
    }
  } catch (error) {
    console.error('Error syncing matches:', error)
    throw error
  }
}
