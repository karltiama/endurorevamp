import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Activity } from '@/lib/strava/types'

export function useUserActivities(userId: string) {
  return useQuery({
    queryKey: ['user', 'activities', userId],
    queryFn: async (): Promise<Activity[]> => {
      console.log('useUserActivities: Starting fetch for userId:', userId)
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false })
        .limit(500) // Increased limit to get more historical data for calendar

      console.log('useUserActivities: Query result:', { 
        dataCount: data?.length || 0, 
        error: error?.message,
        sampleData: data?.slice(0, 3).map(d => ({
          name: d.name,
          start_date: d.start_date,
          start_date_local: d.start_date_local,
          training_stress_score: (d as any).training_stress_score
        }))
      })

      if (error) {
        console.error('useUserActivities: Database error:', error)
        throw new Error(`Failed to fetch activities: ${error.message}`)
      }

      return data || []
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // Reduced from 5 minutes to 2 minutes for better freshness
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 2, // Increased retry attempts
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnReconnect: true, // Refetch when network reconnects
  })
} 