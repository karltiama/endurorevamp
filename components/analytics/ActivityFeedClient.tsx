'use client'

import { useStravaToken } from '@/hooks/strava/useStravaToken'
import { ActivityFeed } from './ActivityFeed'

interface ActivityFeedClientProps {
  userId: string
}

export function ActivityFeedClient({ userId }: ActivityFeedClientProps) {
  const { accessToken, isLoading, error } = useStravaToken()

  if (isLoading) {
    return <ActivityFeedSkeleton />
  }

  if (error || !accessToken) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Strava Connection Required
        </h3>
        <p className="text-red-600">
          {error || 'Unable to connect to Strava. Please check your connection settings.'}
        </p>
      </div>
    )
  }

  return <ActivityFeed accessToken={accessToken} userId={userId} />
}

function ActivityFeedSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
        </div>
      </div>
      
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="animate-pulse">
              <div className="flex justify-between items-start">
                <div className="flex space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded"></div>
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-48"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
                <div className="space-y-2 text-right">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 