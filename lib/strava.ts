export function getStravaAuthUrl(baseUrl?: string) {
  try {
    const url = new URL('https://www.strava.com/oauth/authorize')
    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID
    
    if (!clientId) {
      console.error('NEXT_PUBLIC_STRAVA_CLIENT_ID is not configured')
      return '#'
    }
    
    url.searchParams.set('client_id', clientId)
    
    // Use provided base URL, environment variable, or detect production URL
    let redirectUri = process.env.NEXT_PUBLIC_STRAVA_REDIRECT_URI
    
    if (!redirectUri && baseUrl) {
      redirectUri = `${baseUrl}/dashboard`
    } else if (!redirectUri) {
      // Better production detection
      if (typeof window !== 'undefined') {
        // Client-side: use current origin
        redirectUri = `${window.location.origin}/dashboard`
      } else if (process.env.NODE_ENV === 'production') {
        // Server-side production: require environment variable
        console.error('NEXT_PUBLIC_STRAVA_REDIRECT_URI must be set in production')
        return '#'
      } else {
        // Development fallback
        redirectUri = 'http://localhost:3000/dashboard'
      }
    }
    
    console.log('🔗 Strava OAuth URL config:', { 
      clientId: clientId?.slice(0, 8) + '...', 
      redirectUri,
      environment: process.env.NODE_ENV
    })
    
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope', 'read,activity:read_all')
    url.searchParams.set('approval_prompt', 'auto')
    
    return url.toString()
  } catch (error) {
    console.error('Error generating Strava URL:', error)
    return '#' // fallback URL
  }
} 