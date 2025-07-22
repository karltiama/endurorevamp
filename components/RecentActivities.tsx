'use client'

import { useUserActivities } from '@/hooks/use-user-activities'
import { useUnitPreferences } from '@/hooks/useUnitPreferences'
import { formatDistance, getActivityIcon } from '@/lib/utils'
import type { Activity } from '@/lib/strava/types'

interface RecentActivitiesProps {
  userId: string // Changed from accessToken to userId for database queries
}

export function RecentActivities({ userId }: RecentActivitiesProps) {
  // Use database instead of API - much faster and no rate limits!
  const { data: allActivities, isLoading, error } = useUserActivities(userId)

  // Client-side filtering to get recent activities (last 5)
  const recentActivities = allActivities?.slice(0, 5) || []

  if (isLoading) return (
    <div className="p-4">
      <div className="text-sm text-blue-600">📊 Loading from database...</div>
    </div>
  )
  
  if (error) return (
    <div className="p-4 text-red-600">
      <div>Error: {error.message}</div>
      <div className="text-sm text-gray-500 mt-1">
        💡 Try syncing your Strava data to populate the database.
      </div>
    </div>
  )
  
  if (!recentActivities?.length) return (
    <div className="p-4">
      <div>No recent activities found in database</div>
      <div className="text-sm text-blue-600 mt-1">
        💡 Click &quot;Sync Strava Data&quot; to load your activities.
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Recent Activities</h2>
        <div className="text-xs text-green-600">
          📊 Database ({allActivities?.length || 0} total)
        </div>
      </div>
      <div className="space-y-3">
        {recentActivities.map((activity) => (
          <ActivityCard key={activity.strava_activity_id} activity={activity} />
        ))}
      </div>
    </div>
  )
}

function ActivityCard({ activity }: { activity: Activity }) {
  const { preferences } = useUnitPreferences()
  
  const formatDistanceWithUnits = (meters: number) => {
    return formatDistance(meters, preferences.distance)
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }



  // Handle both sport_type (database) and type (API) properties
  const activityType = activity.sport_type || activity.activity_type || 'Activity'

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-4">
        <span className="text-2xl">{getActivityIcon(activityType, activity.trainer)}</span>
        <div>
          <h3 className="font-semibold text-lg">{activity.name}</h3>
          <p className="text-sm text-gray-600">
            {activityType} • {formatDistanceWithUnits(activity.distance)}
            {activity.total_elevation_gain && activity.total_elevation_gain > 0 && (
              <span> • ↗ {activity.total_elevation_gain}m</span>
            )}
          </p>
          {activity.average_speed && (
            <p className="text-xs text-gray-500">
              Avg Speed: {preferences.distance === 'miles' 
                ? (() => {
                    const mph = activity.average_speed * 3.6 * 0.621371
                    return `${mph % 1 === 0 ? mph.toFixed(0) : mph.toFixed(1)} mph`
                  })()
                : (() => {
                    const kmh = activity.average_speed * 3.6
                    return `${kmh % 1 === 0 ? kmh.toFixed(0) : kmh.toFixed(1)} km/h`
                  })()
              }
            </p>
          )}
        </div>
      </div>
      <div className="text-right text-sm text-gray-500">
        <p className="font-medium">{formatDate(activity.start_date_local)}</p>
        <p>{formatDuration(activity.moving_time)}</p>
        {activity.kudos_count && activity.kudos_count > 0 && (
          <p className="text-xs">❤️ {activity.kudos_count}</p>
        )}
      </div>
    </div>
  )
} 