import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Match, GoodGameMatch, GoodGameVideo } from '@/app/matches/types'

const DIVISION_ID = '12517' // CS:GO Division
const API_BASE_URL = 'https://www.goodgameligaen.no/api'

async function fetchGoodGameMatches() {
  try {
    const unfinishedParams = new URLSearchParams({
      division: '12517',
      game: 'csgo',
      limit: '100',
      offset: '0',
      order_by: 'round_number',
      order_dir: 'asc',
      season: '13162',
      status: 'unfinished',
    })

    const finishedParams = new URLSearchParams({
      division: '12517',
      game: 'csgo',
      limit: '100',
      offset: '0',
      order_by: 'round_number',
      order_dir: 'asc',
      season: '13162',
      status: 'finished',
      finished_after: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    })

    const [unfinishedResponse, finishedResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/matches?${unfinishedParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${process.env.GOOD_GAME_LIGAEN_TOKEN}`,
        },
      }),
      fetch(`${API_BASE_URL}/matches?${finishedParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${process.env.GOOD_GAME_LIGAEN_TOKEN}`,
        },
      }),
    ])

    if (!unfinishedResponse.ok || !finishedResponse.ok) {
      throw new Error('Failed to fetch matches')
    }

    const [unfinishedData, finishedData] = await Promise.all([
      unfinishedResponse.json(),
      finishedResponse.json(),
    ])

    return [...unfinishedData, ...finishedData].sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    )
  } catch (error) {
    console.error('Error fetching from Good Game Ligaen:', error)
    return []
  }
}

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // 1. Fetch matches from Good Game Ligaen
    const ggMatches = await fetchGoodGameMatches()

    // 2. Transform the data
    const transformedMatches = await Promise.all(
      ggMatches
        .filter((match) => match.home_signup?.team && match.away_signup?.team)
        .map(async (match) => {
          const { data: existingMatch } = await supabase
            .from('matches')
            .select('id')
            .eq('gg_ligaen_api_id', match.id.toString())
            .single()

          const matchData: Match = {
            id: existingMatch?.id || crypto.randomUUID(),
            team1: match.home_signup.team.name,
            team2: match.away_signup.team.name,
            team1_id: match.home_signup.team.id.toString(),
            team2_id: match.away_signup.team.id.toString(),
            team1_logo: match.home_signup.team.logo?.url,
            team2_logo: match.away_signup.team.logo?.url,
            team1_score: match.home_score,
            team2_score: match.away_score,
            start_time: match.start_time,
            division_id: DIVISION_ID,
            is_finished: !!match.finished_at,
            winner_id:
              match.winning_side === 'home'
                ? match.home_signup.team.id.toString()
                : match.winning_side === 'away'
                  ? match.away_signup.team.id.toString()
                  : null,
            best_of: match.best_of || 3,
            round: match.round_identifier_text,
            stream_link: match.videos?.find(
              (video: GoodGameVideo) =>
                video.source === 'twitch' && video.status === 'online',
            )?.url,
          }

          return matchData
        }),
    )

    // 3. Store the matches
    await supabase.from('matches').upsert(
      transformedMatches.map((match) => ({
        ...match,
        synced_at: new Date().toISOString(),
      })),
      {
        onConflict: 'gg_ligaen_api_id',
        ignoreDuplicates: false,
      },
    )

    // 4. Get matches from the last 24 hours and upcoming
    const { data: matches, error: dbError } = await supabase
      .from('matches')
      .select('*')
      .gte('start_time', twentyFourHoursAgo.toISOString())
      .order('start_time', { ascending: true })

    if (dbError) throw dbError

    return NextResponse.json(matches || [])
  } catch (error) {
    console.error('Error in matches API route:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    )
  }
}
