'use client'

import { useUnitPreferences } from '@/hooks/useUnitPreferences'
import { formatDistance, formatPace } from '@/lib/utils'
import type { StravaActivity } from '@/lib/strava/types'
import type { Activity } from '@/lib/strava/types'

// Union type to handle both database and API activity types
type ActivityCardActivity = StravaActivity | Activity

interface ActivityCardProps {
  activity: ActivityCardActivity
  onViewDetails: (activity: ActivityCardActivity) => void
  userId: string
}

export function ActivityCard({ activity, onViewDetails, userId }: ActivityCardProps) {
  const { preferences } = useUnitPreferences()
  // Helper to normalize activity data between database and API types
  const normalizeActivity = (act: ActivityCardActivity) => {
    // Check if it's a database Activity (has strava_activity_id) or API StravaActivity (has id)
    if ('strava_activity_id' in act) {
      // Database Activity type
      return {
        id: act.strava_activity_id,
        name: act.name,
        type: act.sport_type || act.activity_type || 'Activity',
        distance: act.distance,
        moving_time: act.moving_time,
        start_date_local: act.start_date_local,
        total_elevation_gain: act.total_elevation_gain || 0,
        average_heartrate: act.average_heartrate,
        average_watts: act.average_watts,
        average_speed: act.average_speed,
        kudos_count: act.kudos_count || 0,
        private: act.private || false
      }
    } else {
      // API StravaActivity type
      return {
        id: act.id,
        name: act.name,
        type: act.type || act.sport_type,
        distance: act.distance,
        moving_time: act.moving_time,
        start_date_local: act.start_date_local,
        total_elevation_gain: act.total_elevation_gain || 0,
        average_heartrate: act.average_heartrate,
        average_watts: act.average_watts,
        average_speed: act.average_speed,
        kudos_count: act.kudos_count || 0,
        private: act.private || false
      }
    }
  }

  const normalized = normalizeActivity(activity)

  const formatDistanceWithUnits = (meters: number) => {
    return formatDistance(meters, preferences.distance)
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

  const formatPaceWithUnits = (normalized: ReturnType<typeof normalizeActivity>) => {
    if (normalized.type === 'Run' && normalized.distance > 0) {
      const paceSecondsPerKm = normalized.moving_time / (normalized.distance / 1000)
      return formatPace(paceSecondsPerKm, preferences.pace)
    }
    
    if ((normalized.type === 'Ride' || normalized.type === 'VirtualRide') && normalized.average_speed) {
      // For cycling, show speed in km/h or mph based on distance unit preference
      const speedKmh = normalized.average_speed * 3.6
      if (preferences.distance === 'miles') {
        const speedMph = speedKmh * 0.621371
        return `${speedMph.toFixed(1)} mph`
      } else {
        return `${speedKmh.toFixed(1)} km/h`
      }
    }
    
    return null
  }

  const calculateTSS = (normalized: ReturnType<typeof normalizeActivity>) => {
    // Simple TSS estimation based on duration and intensity
    if (normalized.average_heartrate && normalized.moving_time) {
      // Rough estimation: assume max HR of 190, threshold HR of 85%
      const intensityFactor = normalized.average_heartrate / (190 * 0.85)
      const hours = normalized.moving_time / 3600
      return Math.round(intensityFactor * intensityFactor * hours * 100)
    }
    return null
  }

  const tss = calculateTSS(normalized)
  const pace = formatPaceWithUnits(normalized)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        {/* Left side - Activity info */}
        <div className="flex items-start space-x-4 flex-1">
          <div className="text-3xl">{getActivityIcon(normalized.type)}</div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-lg text-gray-900 truncate">
                {normalized.name}
              </h3>
              {normalized.private && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  Private
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
              <span className="font-medium">{normalized.type}</span>
              <span>•</span>
              <span>{formatDistanceWithUnits(normalized.distance)}</span>
              <span>•</span>
              <span>{formatDuration(normalized.moving_time)}</span>
              {normalized.total_elevation_gain > 0 && (
                <>
                  <span>•</span>
                  <span>↗ {normalized.total_elevation_gain}m</span>
                </>
              )}
            </div>

            {/* Performance metrics */}
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              {pace && <span>⚡ {pace}</span>}
              {normalized.average_heartrate && (
                <span>❤️ {Math.round(normalized.average_heartrate)} bpm</span>
              )}
              {normalized.average_watts && (
                <span>⚡ {Math.round(normalized.average_watts)}w</span>
              )}
              {tss && <span>📊 {tss} TSS</span>}
              {normalized.kudos_count > 0 && (
                <span>👍 {normalized.kudos_count}</span>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Date and actions */}
        <div className="flex flex-col items-end space-y-2 ml-4">
          <div className="text-right text-sm">
            <div className="font-medium text-gray-900">
              {formatDate(normalized.start_date_local)}
            </div>
            <div className="text-gray-500">
              {formatTime(normalized.start_date_local)}
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