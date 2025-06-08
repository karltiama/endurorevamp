export function getStravaAuthUrl(baseUrl?: string) {
  try {
    const url = new URL('http://www.strava.com/oauth/authorize')
    url.searchParams.set('client_id', process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID || '')
    
    // Use provided base URL, environment variable, or default
    let redirectUri = process.env.NEXT_PUBLIC_STRAVA_REDIRECT_URI
    if (!redirectUri && baseUrl) {
      redirectUri = `${baseUrl}/dashboard`
    } else if (!redirectUri) {
      // Fallback for development
      redirectUri = 'http://localhost:3000/dashboard'
    }
    
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope', 'read,activity:read_all')
    return url.toString()
  } catch (error) {
    console.error('Error generating Strava URL:', error)
    return '#' // fallback URL
  }
} 