import { useQuery } from '@tanstack/react-query'

interface AthleteData {
  id: number
  firstname: string
  lastname: string
  profile: string
  // ... other athlete fields
}

export function useAthleteData(accessToken?: string) {
  return useQuery({
    queryKey: ['athlete'],
    queryFn: async () => {
      if (!accessToken) throw new Error('No access token')
      
      const response = await fetch('/api/strava/athlete', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch athlete data')
      }
      return response.json() as Promise<AthleteData>
    },
    enabled: !!accessToken // Only run query if we have a token
  })
} 