export function getStravaAuthUrl() {
  try {
    const url = new URL('http://www.strava.com/oauth/authorize')
    url.searchParams.set('client_id', process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID || '')
    url.searchParams.set('redirect_uri', process.env.NEXT_PUBLIC_STRAVA_REDIRECT_URI || '')
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope', 'read,activity:read_all')
    return url.toString()
  } catch (error) {
    console.error('Error generating Strava URL:', error)
    return '#' // fallback URL
  }
} 