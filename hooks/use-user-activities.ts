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
          start_date_local: d.start_date_local
        }))
      })

      if (error) {
        console.error('useUserActivities: Database error:', error)
        throw new Error(`Failed to fetch activities: ${error.message}`)
      }

      return data || []
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
} 