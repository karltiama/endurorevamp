import { useMutation } from '@tanstack/react-query'
import type { StravaAuthResponse } from '@/types/strava'

export function useStravaAuth() {
  return useMutation({
    mutationFn: async (code: string) => {
      console.log('🚀 Starting Strava token exchange...')
      
      if (!code || code.trim() === '') {
        throw new Error('No authorization code provided')
      }

      const response = await fetch('/api/auth/strava/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })

      console.log('📡 Token exchange response status:', response.status)

      if (!response.ok) {
        let errorMessage = 'Failed to exchange token with Strava'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          // If we can't parse the error response, use the status text
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        console.error('❌ Token exchange failed:', errorMessage)
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('✅ Token exchange successful')
      return result as { success: boolean; athlete: StravaAuthResponse['athlete'] }
    }
  })
} 