import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { StravaAuthResponse } from '@/types/strava'

export function useStravaAuth() {
  const queryClient = useQueryClient()

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
        throw new Error('Failed to exchange code for tokens')
      }

      return response.json() as Promise<StravaAuthResponse>
    },
    // After successful auth, we can invalidate queries or set initial data
    onSuccess: (data) => {
      // Store auth data in React Query's cache
      queryClient.setQueryData(['auth'], data)
      // Invalidate any existing queries that might need refreshing
      queryClient.invalidateQueries({ queryKey: ['athlete'] })
    },
  })
} 