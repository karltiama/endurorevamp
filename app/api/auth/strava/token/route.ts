import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { code } = await request.json()
    const cookieStore = await cookies()
    const supabase = await createClient()

    // Get the current user from the session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No authenticated user found' },
        { status: 401 }
      )
    }

    // Exchange code for tokens with Strava
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange token with Strava')
    }

    const authData = await tokenResponse.json()

    // Store tokens in Supabase
    const { error: storeError } = await supabase
      .from('strava_tokens')
      .upsert({
        user_id: session.user.id,
        access_token: authData.access_token,
        refresh_token: authData.refresh_token,
        token_type: authData.token_type,
        expires_at: new Date(authData.expires_at * 1000).toISOString(),
        expires_in: authData.expires_in,
        strava_athlete_id: authData.athlete.id,
        athlete_firstname: authData.athlete.firstname,
        athlete_lastname: authData.athlete.lastname,
        athlete_profile: authData.athlete.profile,
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })

    if (storeError) {
      console.error('Error storing tokens:', storeError)
      throw new Error('Failed to store Strava tokens')
    }

    // Set a cookie to indicate successful connection
    cookieStore.set('strava_connected', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    // Return success response
    return NextResponse.json({
      success: true,
      athlete: authData.athlete
    })
  } catch (error) {
    console.error('Token exchange error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to exchange token' },
      { status: 500 }
    )
  }
} 