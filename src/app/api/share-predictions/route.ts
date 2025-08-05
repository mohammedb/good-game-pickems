import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/utils/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request body
    const body = await request.json()
    const { round, picks, correct, predictions, gameType = 'CS2' } = body

    // Validate required fields
    if (
      !round ||
      picks === undefined ||
      correct === undefined ||
      !predictions
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      )
    }

    // Get user profile for username
    const { data: profile } = await supabase
      .from('users')
      .select('username')
      .eq('id', user.id)
      .single()

    // Get current season
    const { data: currentSeason } = await supabase
      .from('seasons')
      .select('id')
      .eq('is_active', true)
      .single()

    // Create shared prediction
    const { data: sharedPrediction, error: insertError } = await supabase
      .from('shared_predictions')
      .insert({
        user_id: user.id,
        username: profile?.username || null,
        round,
        total_picks: picks,
        correct_picks: correct,
        predictions,
        game_type: gameType,
        season_id: currentSeason?.id || null,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Error creating shared prediction:', insertError)
      return NextResponse.json(
        { error: 'Failed to create shared prediction' },
        { status: 500 },
      )
    }

    // Return the share URL with the new ID
    const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://ggwp.no'}/share/${sharedPrediction.id}`

    return NextResponse.json({
      id: sharedPrediction.id,
      shareUrl,
    })
  } catch (error) {
    console.error('Error in share-predictions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

// GET endpoint to retrieve shared prediction by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Missing prediction ID' },
        { status: 400 },
      )
    }

    const supabase = await createServerClient()

    // Get shared prediction and increment view count
    const { data: prediction, error } = await supabase
      .from('shared_predictions')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !prediction) {
      return NextResponse.json(
        { error: 'Shared prediction not found' },
        { status: 404 },
      )
    }

    // Check if expired
    if (prediction.expires_at && new Date(prediction.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This shared prediction has expired' },
        { status: 410 },
      )
    }

    // Increment view count (fire and forget)
    supabase
      .from('shared_predictions')
      .update({ view_count: (prediction.view_count || 0) + 1 })
      .eq('id', id)
      .then(() => {})

    return NextResponse.json(prediction)
  } catch (error) {
    console.error('Error fetching shared prediction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
