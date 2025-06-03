import { useQuery } from '@tanstack/react-query'
import type { StravaActivity, ActivityFilters } from '@/types/strava'

export function useAthleteActivities(
  accessToken?: string, 
  filters: ActivityFilters = {}
) {
  const { page = 1, per_page = 10, before, after } = filters

  return useQuery({
    queryKey: ['athlete', 'activities', page, per_page, before, after],
    queryFn: async (): Promise<StravaActivity[]> => {
      console.log('🚀 Activities hook called with:', { accessToken: !!accessToken, filters })
      
      if (!accessToken) throw new Error('No access token')
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: per_page.toString(),
      })
      
      if (before) params.set('before', before.toString())
      if (after) params.set('after', after.toString())

      const url = `/api/strava/activities?${params}`
      console.log('🌐 Fetching:', url)
      console.log('🔑 Authorization header:', `Bearer ${accessToken?.substring(0, 20)}...`)

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      console.log('📡 Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error:', response.status, errorText)
        throw new Error(`Failed to fetch activities: ${response.status} - ${errorText}`)
      }
      
      const data = await response.json()
      console.log('✅ Activities data:', data)
      return data
    },
    enabled: !!accessToken, // Only run query if we have a token
    staleTime: 2 * 60 * 1000, // 2 minutes (activities change more frequently than athlete data)
    retry: 1,
  })
}

// Optional: Create a simpler hook for common use case
export function useRecentActivities(accessToken?: string, count = 5) {
  return useAthleteActivities(accessToken, { page: 1, per_page: count })
} 