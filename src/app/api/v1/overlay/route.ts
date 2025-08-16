import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/utils/supabase-server'
import {
  validateApiKey,
  createApiResponse,
  createApiError,
} from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  const { valid, apiKey, error } = await validateApiKey(request)
  if (!valid) {
    return NextResponse.json(
      createApiError('UNAUTHORIZED', error || 'Invalid API key', 401),
      { status: 401 },
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '5')

    // Get service role client
    const supabase = createServiceRoleClient()

    console.log('Overlay API - User ID from API key:', apiKey!.user_id)

    // Get user data with available columns
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', apiKey!.user_id)
      .single()

    if (userError || !userData) {
      // Try to get auth user info
      const { data: authUser } = await supabase.auth.admin.getUserById(
        apiKey!.user_id,
      )

      if (!authUser?.user) {
        return NextResponse.json(
          createApiError('NOT_FOUND', 'User not found', 404),
          { status: 404 },
        )
      }

      // Create a basic user profile with only required fields
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: apiKey!.user_id,
          username: authUser.user.email?.split('@')[0] || 'user',
        })
        .select()
        .single()

      if (createError || !newUser) {
        console.error('Failed to create user profile:', createError)
        return NextResponse.json(
          createApiError(
            'INTERNAL_ERROR',
            'Failed to create user profile',
            500,
          ),
          { status: 500 },
        )
      }

      userData = newUser
    }

    // Calculate stats from picks if needed
    const { data: pickStats } = await supabase
      .from('picks')
      .select('points_awarded, is_correct')
      .eq('user_id', apiKey!.user_id)

    const totalPicks = pickStats?.length || 0
    const correctPicks = pickStats?.filter((p) => p.is_correct).length || 0
    const totalPoints =
      pickStats?.reduce((sum, p) => sum + (p.points_awarded || 0), 0) || 0

    // Get recent predictions with match data
    const { data: predictions, error: predError } = await supabase
      .from('picks')
      .select(
        `
        id,
        match_id,
        predicted_winner,
        points_awarded,
        is_correct,
        created_at,
        matches (*)
      `,
      )
      .eq('user_id', apiKey!.user_id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (predError) {
      console.error('Error fetching predictions:', predError)
      throw predError
    }

    console.log('Sample prediction data:', predictions?.[0])

    // Format the response
    const overlayData = {
      user: {
        username: userData.display_name || userData.username || 'User',
        total_points: totalPoints,
        correct_picks: correctPicks,
        total_picks: totalPicks,
      },
      predictions: predictions || [],
    }

    return NextResponse.json(createApiResponse(overlayData))
  } catch (error) {
    console.error('Error fetching overlay data:', error)
    return NextResponse.json(
      createApiError('INTERNAL_ERROR', 'Failed to fetch overlay data', 500),
      { status: 500 },
    )
  }
}
