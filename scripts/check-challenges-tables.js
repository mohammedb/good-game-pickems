// Script to check if challenges tables exist
// Run with: node scripts/check-challenges-tables.js

const { createClient } = require('@supabase/supabase-js')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTables() {
  console.log('🔍 Checking challenges tables...\n')

  try {
    // Check challenges table
    const { data: challenges, error: challengesError } = await supabase
      .from('challenges')
      .select('*')
      .limit(1)

    if (challengesError) {
      console.error('❌ Challenges table error:', challengesError.message)
      console.log('\n📝 You need to run the challenges migration:')
      console.log(
        '   Copy src/db/migrations/create_challenges_tables.sql to Supabase SQL Editor\n',
      )
    } else {
      console.log('✅ Challenges table exists')
    }

    // Check challenge_matches table
    const { data: challengeMatches, error: matchesError } = await supabase
      .from('challenge_matches')
      .select('*')
      .limit(1)

    if (matchesError) {
      console.error('❌ Challenge_matches table error:', matchesError.message)
    } else {
      console.log('✅ Challenge_matches table exists')
    }

    // Check challenge_picks table
    const { data: challengePicks, error: picksError } = await supabase
      .from('challenge_picks')
      .select('*')
      .limit(1)

    if (picksError) {
      console.error('❌ Challenge_picks table error:', picksError.message)
    } else {
      console.log('✅ Challenge_picks table exists')
    }

    // Check if users table has challenge columns
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('challenge_wins, challenge_losses')
      .limit(1)

    if (usersError) {
      console.error(
        '❌ Users table challenge columns error:',
        usersError.message,
      )
    } else {
      console.log('✅ Users table has challenge columns')
    }

    console.log('\n✨ Table check complete!')
  } catch (error) {
    console.error('❌ Error checking tables:', error)
  }
}

checkTables()
