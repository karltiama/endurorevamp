import { useMutation } from '@tanstack/react-query'
import type { StravaAuthResponse } from '@/types/strava'

export function useStravaAuth() {
  return useMutation({
    mutationFn: async (code: string) => {
      const response = await fetch('/api/auth/strava/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to exchange code for tokens')
      }

      return response.json() as Promise<{ success: boolean; athlete: StravaAuthResponse['athlete'] }>
    }
  })
} 