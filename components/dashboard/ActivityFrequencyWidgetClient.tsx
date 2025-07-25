'use client'

import { useUserActivities } from '@/hooks/use-user-activities'
import { ActivityFrequencyWidget } from './ActivityFrequencyWidget'
import { useEffect } from 'react'

interface ActivityFrequencyWidgetClientProps {
  userId: string
}

export function ActivityFrequencyWidgetClient({ userId }: ActivityFrequencyWidgetClientProps) {
  const { data: activities, isLoading, error } = useUserActivities(userId)

  useEffect(() => {
    console.log('ActivityFrequencyWidgetClient: Component mounted/updated', {
      userId,
      isLoading,
      error: error?.message,
      activitiesCount: activities?.length || 0
    })
  }, [userId, isLoading, error, activities])

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-2 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-500">
          Failed to load activity data: {error.message}
        </div>
      </div>
    )
  }

  return <ActivityFrequencyWidget activities={activities || []} />
} 