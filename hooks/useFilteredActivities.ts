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

    // Apply the selected filter (removed 90-day filter to show all activities)
    let filteredActivities: Activity[]
    
    switch (filter) {
      case 'all':
        filteredActivities = allActivities
        break
      
      case 'run':
        filteredActivities = allActivities.filter((activity: Activity) => 
          activity.sport_type === 'Run' || activity.sport_type === 'VirtualRun'
        )
        break
      
      case 'ride':
        filteredActivities = allActivities.filter((activity: Activity) => 
          activity.sport_type === 'Ride' || 
          activity.sport_type === 'VirtualRide' ||
          activity.sport_type === 'EBikeRide' ||
          activity.sport_type === 'MountainBikeRide' ||
          activity.sport_type === 'GravelRide' ||
          activity.sport_type === 'Handcycle' ||
          activity.sport_type === 'Velomobile'
        )
        break
      
      case 'walk':
        filteredActivities = allActivities.filter((activity: Activity) => 
          activity.sport_type === 'Walk' || 
          activity.sport_type === 'Hike'
        )
        break
      
      case 'workout':
        filteredActivities = allActivities.filter((activity: Activity) => 
          activity.sport_type === 'Workout' || 
          activity.sport_type === 'WeightTraining' ||
          activity.sport_type === 'Crossfit' ||
          activity.sport_type === 'Yoga' ||
          activity.sport_type === 'Pilates' ||
          activity.sport_type === 'Stretching' ||
          activity.sport_type === 'StrengthTraining'
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
        filteredActivities = allActivities
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