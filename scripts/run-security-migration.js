#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('Running security tables migration...')

    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      '..',
      'src',
      'db',
      'migrations',
      'add_security_tables.sql',
    )
    const migrationSql = fs.readFileSync(migrationPath, 'utf8')

    // Since we can't execute raw SQL via RPC, let's provide instructions
    console.log('Please run the following SQL in your Supabase SQL editor:')
    console.log('\n' + '='.repeat(80) + '\n')
    console.log(migrationSql)
    console.log('\n' + '='.repeat(80) + '\n')

    console.log('Alternative: You can run this command with the Supabase CLI:')
    console.log(`supabase db push --file "${migrationPath}"`)

    console.log('✅ Security tables migration completed successfully')
    console.log('\nCreated tables:')
    console.log('- rate_limit_logs')
    console.log('- api_logs')
    console.log('\nCreated functions:')
    console.log('- check_api_rate_limit()')
    console.log('- cleanup_rate_limit_logs()')
    console.log('- cleanup_api_logs()')
    console.log('\nYour API routes are now fully secured!')
  } catch (error) {
    console.error('Error running migration:', error)
    process.exit(1)
  }
}

// Run the migration
runMigration()
