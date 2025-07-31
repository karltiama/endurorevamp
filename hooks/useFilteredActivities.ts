import { useMemo } from 'react'
import { useUserActivities } from './use-user-activities'
import type { Activity } from '@/lib/strava/types'

interface UseFilteredActivitiesReturn {
  activities: Activity[]
  isLoading: boolean
  error: Error | null
  totalCount: number
  filteredCount: number
}

export function useFilteredActivities(userId: string, filter: string, sort: string): UseFilteredActivitiesReturn {
  const { data: allActivities = [], isLoading, error } = useUserActivities(userId)

  const filteredAndSortedActivities = useMemo(() => {
    if (!allActivities || allActivities.length === 0) {
      return []
    }

    // Apply 90-day filter first (existing logic from ActivityFeed)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    
    const recentActivities = allActivities.filter((activity: Activity) => 
      new Date(activity.start_date) >= ninetyDaysAgo
    )

    // Apply the selected filter
    let filteredActivities: Activity[]
    
    switch (filter) {
      case 'all':
        filteredActivities = recentActivities
        break
      
      case 'run':
        filteredActivities = recentActivities.filter((activity: Activity) => 
          activity.sport_type === 'Run' || activity.sport_type === 'VirtualRun'
        )
        break
      
      case 'ride':
        filteredActivities = recentActivities.filter((activity: Activity) => 
          activity.sport_type === 'Ride' || activity.sport_type === 'VirtualRide'
        )
        break
      
      case 'favorite':
        // TODO: Implement favorite functionality when database field is added
        // For now, return empty array since favorite field doesn't exist
        filteredActivities = []
        break
      
      case 'flagged':
        // TODO: Implement flagged functionality when database field is added
        // For now, return empty array since flagged field doesn't exist
        filteredActivities = []
        break
      
      default:
        filteredActivities = recentActivities
        break
    }

    // Apply sorting to filtered activities
    const sortedActivities = [...filteredActivities].sort((a, b) => {
      const [sortField, sortDirection] = sort.split('-')
      const isDesc = sortDirection === 'desc'
      const multiplier = isDesc ? -1 : 1

      switch (sortField) {
        case 'date':
          return multiplier * (new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
        
        case 'distance':
          return multiplier * (a.distance - b.distance)
        
        case 'duration':
          return multiplier * (a.moving_time - b.moving_time)
        
        case 'name':
          return multiplier * a.name.localeCompare(b.name)
        
        default:
          return 0
      }
    })

    return sortedActivities
  }, [allActivities, filter, sort])

  return {
    activities: filteredAndSortedActivities,
    isLoading,
    error,
    totalCount: allActivities.length,
    filteredCount: filteredAndSortedActivities.length
  }
} 