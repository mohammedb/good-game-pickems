// Script to add test matches to the database
// Run with: node scripts/add-test-matches.js

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    '❌ Missing environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.',
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addTestMatches() {
  try {
    console.log('🎮 Adding test matches to the database...\n')

    // Read the SQL file
    const sqlPath = path.join(
      __dirname,
      '..',
      'src',
      'db',
      'migrations',
      'insert_test_matches.sql',
    )
    const sql = fs.readFileSync(sqlPath, 'utf8')

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      // If exec_sql doesn't exist, try running the queries manually
      console.log(
        'ℹ️  exec_sql function not found, running queries manually...\n',
      )

      // First ensure we have a test season
      const { error: seasonError } = await supabase.from('seasons').upsert(
        {
          season_id: 'test-2025',
          name: 'Test Season 2025',
          start_date: '2025-01-01T00:00:00Z',
          is_active: true,
        },
        {
          onConflict: 'season_id',
        },
      )

      if (seasonError) {
        console.error('❌ Error creating season:', seasonError)
        return
      }

      // Define test matches
      const testMatches = [
        // CS2 Matches
        {
          id: '11111111-1111-1111-1111-111111111111',
          gg_ligaen_api_id: 'test-cs2-1',
          team1_id: 'apeks-id',
          team2_id: 'bifrost-id',
          team1: 'Apeks',
          team2: 'Bifrost',
          team1_logo:
            'https://www.goodgameligaen.no/storage/images/teams/apeks.png',
          team2_logo:
            'https://www.goodgameligaen.no/storage/images/teams/bifrost.png',
          start_time: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000,
          ).toISOString(), // 2 days ago
          division_id: '12517',
          season_id: 'test-2025',
          is_finished: true,
          winner_id: 'apeks-id',
          team1_map_score: 2,
          team2_map_score: 1,
          best_of: 3,
          round: 'Runde 1',
          game_type: 'csgo',
          points_processed: true,
          synced_at: new Date().toISOString(),
        },
        {
          id: '22222222-2222-2222-2222-222222222222',
          gg_ligaen_api_id: 'test-cs2-2',
          team1_id: 'oilers-id',
          team2_id: 'foxed-id',
          team1: 'Oilers',
          team2: 'FOXED Gaming',
          team1_logo:
            'https://www.goodgameligaen.no/storage/images/teams/oilers.png',
          team2_logo:
            'https://www.goodgameligaen.no/storage/images/teams/foxed.png',
          start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          division_id: '12517',
          season_id: 'test-2025',
          is_finished: false,
          winner_id: null,
          team1_map_score: null,
          team2_map_score: null,
          best_of: 3,
          round: 'Runde 2',
          game_type: 'csgo',
          synced_at: new Date().toISOString(),
        },
        {
          id: '33333333-3333-3333-3333-333333333333',
          gg_ligaen_api_id: 'test-cs2-3',
          team1_id: 'riddle-id',
          team2_id: 'nordavind-id',
          team1: 'Riddle Esports',
          team2: 'Nordavind',
          team1_logo:
            'https://www.goodgameligaen.no/storage/images/teams/riddle.png',
          team2_logo:
            'https://www.goodgameligaen.no/storage/images/teams/nordavind.png',
          start_time: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
          division_id: '12517',
          season_id: 'test-2025',
          is_finished: false,
          winner_id: null,
          team1_map_score: 1,
          team2_map_score: 1,
          best_of: 3,
          round: 'Runde 2',
          game_type: 'csgo',
          synced_at: new Date().toISOString(),
        },
        // LoL Matches
        {
          id: '44444444-4444-4444-4444-444444444444',
          gg_ligaen_api_id: 'test-lol-1',
          team1_id: 'nora-id',
          team2_id: 'vanir-id',
          team1: 'NORA Esports',
          team2: 'Vanir',
          team1_logo:
            'https://www.goodgameligaen.no/storage/images/teams/nora.png',
          team2_logo:
            'https://www.goodgameligaen.no/storage/images/teams/vanir.png',
          start_time: new Date(
            Date.now() - 3 * 24 * 60 * 60 * 1000,
          ).toISOString(), // 3 days ago
          division_id: '12518',
          season_id: 'test-2025',
          is_finished: true,
          winner_id: 'nora-id',
          team1_map_score: 2,
          team2_map_score: 0,
          best_of: 3,
          round: 'Uke 1',
          game_type: 'lol',
          game_data: { patch: '14.23', game_duration: [2145, 1823] },
          points_processed: true,
          synced_at: new Date().toISOString(),
        },
        {
          id: '55555555-5555-5555-5555-555555555555',
          gg_ligaen_api_id: 'test-lol-2',
          team1_id: 'bitfix-id',
          team2_id: 'fotball-id',
          team1: 'Bitfix Gaming',
          team2: 'Fotball Førever',
          team1_logo:
            'https://www.goodgameligaen.no/storage/images/teams/bitfix.png',
          team2_logo:
            'https://www.goodgameligaen.no/storage/images/teams/fotball.png',
          start_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
          division_id: '12518',
          season_id: 'test-2025',
          is_finished: false,
          winner_id: null,
          team1_map_score: null,
          team2_map_score: null,
          best_of: 3,
          round: 'Uke 2',
          game_type: 'lol',
          game_data: { patch: '14.23' },
          synced_at: new Date().toISOString(),
        },
      ]

      // Insert matches
      const { data: insertedMatches, error: matchError } = await supabase
        .from('matches')
        .upsert(testMatches, {
          onConflict: 'id',
        })
        .select()

      if (matchError) {
        console.error('❌ Error inserting matches:', matchError)
        return
      }

      console.log('✅ Successfully added test matches:\n')
      console.log('CS2 Matches:')
      console.log('  - Apeks vs Bifrost (Finished - Apeks won 2-1)')
      console.log('  - Oilers vs FOXED Gaming (Tomorrow)')
      console.log('  - Riddle Esports vs Nordavind (Live now - tied 1-1)\n')
      console.log('LoL Matches:')
      console.log('  - NORA Esports vs Vanir (Finished - NORA won 2-0)')
      console.log('  - Bitfix Gaming vs Fotball Førever (In 3 hours)\n')
    }

    console.log('🎉 Test data added successfully!')
    console.log('\nYou can now:')
    console.log('1. View matches on the matches page')
    console.log('2. Make predictions on upcoming matches')
    console.log('3. Test the achievement system with finished matches')
    console.log('4. Create challenges with other users')
    console.log('5. Build prediction streaks\n')
  } catch (error) {
    console.error('❌ Error adding test matches:', error)
  }
}

// Run the script
addTestMatches()
