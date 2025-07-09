'use client'

import { useUserActivities } from '@/hooks/use-user-activities'
import { useStravaToken } from '@/hooks/strava/useStravaToken'
import { ActivityFeed } from './ActivityFeed'
import { StravaReconnectionPrompt } from '@/components/strava/StravaReconnectionPrompt'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ActivityFeedClientProps {
  userId: string
}

export function ActivityFeedClient({ userId }: ActivityFeedClientProps) {
  const { data: activities, isLoading: activitiesLoading, error: activitiesError } = useUserActivities(userId)
  const { accessToken, error: tokenError, refreshToken } = useStravaToken()

  // Show loading while checking for activities
  if (activitiesLoading) {
    return <ActivityFeedSkeleton />
  }

  // If there are activities in the database, show them regardless of Strava connection
  if (activities && activities.length > 0) {
    return (
      <div className="space-y-4">
        {/* Optional: Show sync notice if Strava connection has issues */}
        {(tokenError || !accessToken) && (
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <div className="flex items-center justify-between">
                <span>
                  <strong>Sync Notice:</strong> Your Strava connection has expired. You can still view your existing activities, but new activities won&apos;t sync automatically.
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => refreshToken()}
                  className="ml-4 text-blue-600 border-blue-200 hover:bg-blue-100"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Reconnect
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <ActivityFeed userId={userId} />
      </div>
    )
  }

  // If there's an error loading activities from database
  if (activitiesError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Unable to Load Activities
        </h3>
        <p className="text-red-600 mb-4">
          {activitiesError.message || 'There was an error loading your activities from the database.'}
        </p>
      </div>
    )
  }

  // No activities in database - this is when we need Strava connection to sync data
  return (
    <div className="space-y-6">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <div className="text-4xl mb-4">🏃‍♂️</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          No Activities Found
        </h3>
        <p className="text-gray-500 mb-6">
          You don&apos;t have any activities in your database yet. Connect to Strava to sync your activities and start analyzing your training data.
        </p>
      </div>

      {/* Show Strava connection prompt only when we need to sync data */}
      <StravaReconnectionPrompt 
        error={tokenError} 
        onRefresh={refreshToken}
        title="Connect to Sync Your Activities"
      />
    </div>
  )
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