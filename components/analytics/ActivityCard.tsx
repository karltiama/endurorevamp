'use client'

import type { StravaActivity } from '@/types/strava'

interface ActivityCardProps {
  activity: StravaActivity
  onViewDetails: (activity: StravaActivity) => void
}

export function ActivityCard({ activity, onViewDetails }: ActivityCardProps) {
  const formatDistance = (meters: number) => {
    return `${(meters / 1000).toFixed(1)} km`
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      'Ride': '🚴‍♂️',
      'Run': '🏃‍♂️',
      'Swim': '🏊‍♂️',
      'Hike': '🥾',
      'Walk': '🚶‍♂️',
      'Workout': '💪',
      'VirtualRide': '🚴‍♂️',
      'EBikeRide': '🚴‍♂️⚡',
    }
    return icons[type] || '🏃‍♂️'
  }

  const formatPace = (activity: StravaActivity) => {
    if (activity.type === 'Run' && activity.distance > 0) {
      const paceSecondsPerKm = activity.moving_time / (activity.distance / 1000)
      const minutes = Math.floor(paceSecondsPerKm / 60)
      const seconds = Math.floor(paceSecondsPerKm % 60)
      return `${minutes}:${seconds.toString().padStart(2, '0')} /km`
    }
    
    if ((activity.type === 'Ride' || activity.type === 'VirtualRide') && activity.average_speed) {
      return `${(activity.average_speed * 3.6).toFixed(1)} km/h`
    }
    
    return null
  }

  const calculateTSS = (activity: StravaActivity) => {
    // Simple TSS estimation based on duration and intensity
    if (activity.average_heartrate && activity.moving_time) {
      // Rough estimation: assume max HR of 190, threshold HR of 85%
      const intensityFactor = activity.average_heartrate / (190 * 0.85)
      const hours = activity.moving_time / 3600
      return Math.round(intensityFactor * intensityFactor * hours * 100)
    }
    return null
  }

  const tss = calculateTSS(activity)
  const pace = formatPace(activity)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        {/* Left side - Activity info */}
        <div className="flex items-start space-x-4 flex-1">
          <div className="text-3xl">{getActivityIcon(activity.type)}</div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-lg text-gray-900 truncate">
                {activity.name}
              </h3>
              {activity.private && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  Private
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
              <span className="font-medium">{activity.type}</span>
              <span>•</span>
              <span>{formatDistance(activity.distance)}</span>
              <span>•</span>
              <span>{formatDuration(activity.moving_time)}</span>
              {activity.total_elevation_gain > 0 && (
                <>
                  <span>•</span>
                  <span>↗ {activity.total_elevation_gain}m</span>
                </>
              )}
            </div>

            {/* Performance metrics */}
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              {pace && <span>⚡ {pace}</span>}
              {activity.average_heartrate && (
                <span>❤️ {Math.round(activity.average_heartrate)} bpm</span>
              )}
              {activity.average_watts && (
                <span>⚡ {Math.round(activity.average_watts)}w</span>
              )}
              {tss && <span>📊 {tss} TSS</span>}
              {activity.kudos_count > 0 && (
                <span>👍 {activity.kudos_count}</span>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Date and actions */}
        <div className="flex flex-col items-end space-y-2 ml-4">
          <div className="text-right text-sm">
            <div className="font-medium text-gray-900">
              {formatDate(activity.start_date_local)}
            </div>
            <div className="text-gray-500">
              {formatTime(activity.start_date_local)}
            </div>
          </div>
          
          <button
            onClick={() => onViewDetails(activity)}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
          >
            View Details →
          </button>
        </div>
      </div>
    </div>
  )
} 