import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Activity } from '@/lib/strava/types'

export function useUserActivities(userId: string) {
  return useQuery({
    queryKey: ['user', 'activities', userId],
    queryFn: async (): Promise<Activity[]> => {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false })
        .limit(100) // Reasonable limit for dashboard metrics

      if (error) {
        throw new Error(`Failed to fetch activities: ${error.message}`)
      }

      return data || []
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
} 