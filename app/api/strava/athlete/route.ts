import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    // Get the access token from the request header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 })
    }

    const response = await fetch('https://www.strava.com/api/v3/athlete', {
      headers: {
        'Authorization': authHeader,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch athlete data')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Athlete fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch athlete data' },
      { status: 500 }
    )
  }
} 