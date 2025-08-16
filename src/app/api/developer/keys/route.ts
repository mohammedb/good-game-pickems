import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/utils/supabase-server'
import crypto from 'crypto'

// Generate a secure API key
function generateApiKey(): { key: string; hash: string; prefix: string } {
  const key = `ggp_live_${crypto.randomBytes(32).toString('hex')}`
  const hash = crypto.createHash('sha256').update(key).digest('hex')
  const prefix = key.substring(0, 12) // "ggp_live_" + first 3 chars

  return { key, hash, prefix }
}

// GET /api/developer/keys - List user's API keys
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 },
      )
    }

    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Don't expose the hash
    const sanitizedKeys = apiKeys?.map((key) => ({
      id: key.id,
      name: key.name,
      key_prefix: key.key_prefix,
      scopes: key.scopes,
      rate_limit_tier: key.rate_limit_tier,
      last_used_at: key.last_used_at,
      usage_count: key.usage_count,
      description: key.description,
      is_active: key.is_active,
      expires_at: key.expires_at,
      created_at: key.created_at,
    }))

    return NextResponse.json({
      success: true,
      data: { api_keys: sanitizedKeys },
    })
  } catch (error) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch API keys',
      },
      { status: 500 },
    )
  }
}

// POST /api/developer/keys - Create a new API key
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 },
      )
    }

    const body = await request.json()
    const { name, description, scopes = ['read'] } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name is required',
        },
        { status: 400 },
      )
    }

    // Check if user already has 5 keys (free tier limit)
    const { count } = await supabase
      .from('api_keys')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (count && count >= 5) {
      return NextResponse.json(
        {
          success: false,
          error:
            'API key limit reached. Please delete unused keys or upgrade your plan.',
        },
        { status: 400 },
      )
    }

    // Generate the API key
    const { key, hash, prefix } = generateApiKey()

    // Insert the API key
    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        name,
        key_hash: hash,
        key_prefix: prefix,
        description,
        scopes,
        rate_limit_tier: 'free',
      })
      .select()
      .single()

    if (error) throw error

    // Return the API key only once (user must save it)
    return NextResponse.json({
      success: true,
      data: {
        api_key: {
          id: apiKey.id,
          name: apiKey.name,
          key: key, // Only returned on creation
          key_prefix: apiKey.key_prefix,
          scopes: apiKey.scopes,
          description: apiKey.description,
          created_at: apiKey.created_at,
        },
      },
      message: 'Save this API key securely. It will not be shown again.',
    })
  } catch (error) {
    console.error('Error creating API key:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create API key',
      },
      { status: 500 },
    )
  }
}

// DELETE /api/developer/keys - Delete an API key
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 },
      )
    }

    const url = new URL(request.url)
    const keyId = url.searchParams.get('id')

    if (!keyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Key ID is required',
        },
        { status: 400 },
      )
    }

    // Delete the API key (only if it belongs to the user)
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting API key:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete API key',
      },
      { status: 500 },
    )
  }
}
