// Test script to verify LoL match syncing
// Run with: node test-lol-sync.js

const GOOD_GAME_API_URL = 'https://www.goodgameligaen.no/api'
const LOL_DIVISION_ID = process.env.GOOD_GAME_LOL_DIVISION_ID || '12518'
const SEASON_ID = process.env.GOOD_GAME_SEASON_ID || '13162'

async function testLoLAPI() {
  console.log('Testing League of Legends API integration...\n')

  try {
    // Test fetching LoL matches
    const params = new URLSearchParams({
      division: LOL_DIVISION_ID,
      game: 'leagueoflegends',
      limit: '5',
      offset: '0',
      order_by: 'round_number',
      order_dir: 'asc',
      season: SEASON_ID,
    })

    const url = `${GOOD_GAME_API_URL}/matches?${params.toString()}`
    console.log('Fetching from:', url)

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.GOOD_GAME_LIGAEN_TOKEN}`,
      },
    })

    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Error details:', errorText)
      return
    }

    const matches = await response.json()
    console.log(`\nFound ${matches.length} LoL matches\n`)

    if (matches.length > 0) {
      console.log('Sample match:')
      const match = matches[0]
      console.log({
        id: match.id,
        home_team: match.home_signup?.team?.name,
        away_team: match.away_signup?.team?.name,
        start_time: match.start_time,
        best_of: match.best_of,
        round: match.round_identifier_text,
        is_finished: !!match.finished_at,
      })
    }

    console.log('\n✅ LoL API integration test passed!')
  } catch (error) {
    console.error('Test failed:', error)
  }
}

// Check if bearer token is set
if (!process.env.GOOD_GAME_LIGAEN_TOKEN) {
  console.error('Error: GOOD_GAME_LIGAEN_TOKEN environment variable is not set')
  console.log('Please set it before running this test')
  process.exit(1)
}

testLoLAPI()
