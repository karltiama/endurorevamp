import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    // Add more robust JSON parsing
    let requestBody
    try {
      const text = await request.text()
      console.log('📥 Request body text:', text)
      
      if (!text || text.trim() === '') {
        throw new Error('Request body is empty')
      }
      
      requestBody = JSON.parse(text)
    } catch (parseError) {
      console.error('❌ JSON parsing error:', parseError)
      return NextResponse.json(
        { error: 'Invalid request body format' },
        { status: 400 }
      )
    }

    const { code } = requestBody
    
    if (!code) {
      console.error('❌ No authorization code provided')
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      )
    }

    console.log('🔑 Processing code:', code.substring(0, 10) + '...')
    
    const cookieStore = await cookies()
    const supabase = await createClient()

    // Get the authenticated user (secure)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('❌ No authenticated user found')
      return NextResponse.json(
        { error: 'No authenticated user found' },
        { status: 401 }
      )
    }

    console.log('👤 User authenticated:', user.id)

    // Exchange code for tokens with Strava
    console.log('🌐 Calling Strava token endpoint...')
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

    console.log('📡 Strava response status:', tokenResponse.status)

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('❌ Strava API error:', tokenResponse.status, errorText)
      return NextResponse.json(
        { error: `Strava API error: ${tokenResponse.status} - ${errorText}` },
        { status: tokenResponse.status }
      )
    }

    const authData = await tokenResponse.json()
    console.log('✅ Strava token exchange successful for athlete:', authData.athlete?.id)

    // Store tokens in Supabase
    console.log('💾 Storing tokens in database...')
    const { error: storeError } = await supabase
      .from('strava_tokens')
      .upsert({
        user_id: user.id,
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
      console.error('❌ Error storing tokens:', storeError)
      return NextResponse.json(
        { error: 'Failed to store Strava tokens in database' },
        { status: 500 }
      )
    }

    console.log('✅ Tokens stored successfully')

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