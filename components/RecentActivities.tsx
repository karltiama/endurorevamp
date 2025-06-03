'use client'

import { useRecentActivities } from '@/hooks/use-athlete-activities'
import type { StravaActivity } from '@/types/strava'

interface RecentActivitiesProps {
  accessToken: string
}

export function RecentActivities({ accessToken }: RecentActivitiesProps) {
  const { data: activities, isLoading, error } = useRecentActivities(accessToken, 5)

  if (isLoading) return <div className="p-4">Loading activities...</div>
  if (error) return <div className="p-4 text-red-600">Error: {error.message}</div>
  if (!activities?.length) return <div className="p-4">No activities found</div>

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Recent Activities</h2>
      <div className="space-y-3">
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  )
}

function ActivityCard({ activity }: { activity: StravaActivity }) {
  const formatDistance = (meters: number) => {
    return `${(meters / 1000).toFixed(1)} km`
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      'Ride': '🚴‍♂️',
      'Run': '🏃‍♂️',
      'Swim': '🏊‍♂️',
      'Hike': '🥾',
      'Walk': '🚶‍♂️',
      'Workout': '💪',
    }
    return icons[type] || '🏃‍♂️'
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-4">
        <span className="text-2xl">{getActivityIcon(activity.type)}</span>
        <div>
          <h3 className="font-semibold text-lg">{activity.name}</h3>
          <p className="text-sm text-gray-600">
            {activity.type} • {formatDistance(activity.distance)}
            {activity.total_elevation_gain > 0 && (
              <span> • ↗ {activity.total_elevation_gain}m</span>
            )}
          </p>
          {activity.average_speed && (
            <p className="text-xs text-gray-500">
              Avg Speed: {(activity.average_speed * 3.6).toFixed(1)} km/h
            </p>
          )}
        </div>
      </div>
      <div className="text-right text-sm text-gray-500">
        <p className="font-medium">{formatDate(activity.start_date_local)}</p>
        <p>{formatDuration(activity.moving_time)}</p>
        {activity.kudos_count > 0 && (
          <p className="text-xs">❤️ {activity.kudos_count}</p>
        )}
      </div>
    </div>
  )
} 