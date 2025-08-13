import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    console.log('🚀 Activities API called');

    // Get the access token from the request header
    const authHeader = request.headers.get('Authorization');
    console.log('🔑 Auth header received:', !!authHeader);

    if (!authHeader) {
      console.error('❌ No authorization token');
      return NextResponse.json(
        { error: 'No authorization token' },
        { status: 401 }
      );
    }

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const perPage = searchParams.get('per_page') || '10';
    const before = searchParams.get('before'); // timestamp filter
    const after = searchParams.get('after'); // timestamp filter

    console.log('📊 Query params:', { page, perPage, before, after });

    // Build Strava API URL with parameters
    const stravaUrl = new URL(
      'https://www.strava.com/api/v3/athlete/activities'
    );
    stravaUrl.searchParams.set('page', page);
    stravaUrl.searchParams.set('per_page', perPage);
    if (before) stravaUrl.searchParams.set('before', before);
    if (after) stravaUrl.searchParams.set('after', after);

    console.log('🌐 Calling Strava API:', stravaUrl.toString());

    const response = await fetch(stravaUrl.toString(), {
      headers: {
        Authorization: authHeader,
      },
    });

    console.log('📡 Strava API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Strava API error:', response.status, errorText);
      throw new Error(`Strava API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Activities fetched:', data?.length || 0, 'activities');
    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Activities fetch error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch activities data',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
