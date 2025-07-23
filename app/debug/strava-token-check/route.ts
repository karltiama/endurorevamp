import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/server'

export async function GET() {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    
    // Get current tokens
    const { data: tokens, error: tokenError } = await supabase
      .from('strava_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (tokenError) {
      return NextResponse.json({
        success: false,
        error: 'No Strava tokens found',
        details: tokenError.message
      })
    }

    if (!tokens) {
      return NextResponse.json({
        success: false,
        error: 'No Strava tokens found for user',
        user_id: user.id
      })
    }

    // Check if token is expired
    const now = new Date()
    const expiresAt = new Date(tokens.expires_at)
    const isExpired = expiresAt <= now
    const timeUntilExpiry = expiresAt.getTime() - now.getTime()

    // Try to refresh the token
    let refreshResult = null
    if (isExpired) {
      try {
        const refreshResponse = await fetch('https://www.strava.com/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID,
            client_secret: process.env.STRAVA_CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: tokens.refresh_token,
          }),
        })

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json()
          refreshResult = {
            success: true,
            new_expires_at: new Date(refreshData.expires_at * 1000).toISOString()
          }
        } else {
          const errorText = await refreshResponse.text()
          refreshResult = {
            success: false,
            error: `HTTP ${refreshResponse.status}: ${errorText}`
          }
        }
      } catch (error) {
        refreshResult = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    return NextResponse.json({
      success: true,
      user_id: user.id,
      has_tokens: true,
      token_info: {
        athlete_id: tokens.strava_athlete_id,
        athlete_name: `${tokens.athlete_firstname} ${tokens.athlete_lastname}`,
        expires_at: tokens.expires_at,
        is_expired: isExpired,
        time_until_expiry: timeUntilExpiry,
        token_type: tokens.token_type
      },
      refresh_attempt: refreshResult
    })

  } catch (error) {
    console.error('Token check error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 