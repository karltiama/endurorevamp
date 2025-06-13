'use client'

import { useUserActivities } from '@/hooks/use-user-activities'
import { ActivityContributionCalendar } from './ActivityContributionCalendar'

interface ActivityContributionCalendarClientProps {
  userId: string
}

export function ActivityContributionCalendarClient({ userId }: ActivityContributionCalendarClientProps) {
  const { data: activities, isLoading, error } = useUserActivities(userId)

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="h-32 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-500">
          Failed to load activity data
        </div>
      </div>
    )
  }

  return <ActivityContributionCalendar activities={activities || []} />
} 