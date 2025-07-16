'use client'

import { useUnitPreferences } from '@/hooks/useUnitPreferences'
import { formatDistance, formatPace, getActivityIcon } from '@/lib/utils'
import type { StravaActivity } from '@/lib/strava/types'
import type { Activity } from '@/lib/strava/types'

// Union type to handle both database and API activity types
type ActivityCardActivity = StravaActivity | Activity

interface ActivityCardProps {
  activity: ActivityCardActivity
  onViewDetails: (activity: ActivityCardActivity) => void
}

export function ActivityCard({ activity, onViewDetails }: ActivityCardProps) {
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
        private: act.private || false,
        trainer: act.trainer || false
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
        private: act.private || false,
        trainer: act.trainer || false
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
    <div className="bg-white border border-gray-200 rounded-lg p-2.5 hover:shadow-md transition-shadow">
      {/* Title - Centered */}
      <div className="text-center mb-2">
        <h3 className="font-semibold text-base text-gray-900 truncate">
          {normalized.name}
        </h3>
        {normalized.private && (
          <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
            Private
          </span>
        )}
      </div>
      
      {/* Main content - Compact layout */}
      <div className="flex items-center justify-between">
        {/* Left - Activity details */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="text-lg">{getActivityIcon(normalized.type, normalized.trainer)}</span>
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

        {/* Right - Date and action */}
        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <div className="font-medium text-gray-900">
              {formatDate(normalized.start_date_local)}
            </div>
            <div className="text-gray-500">
              {formatTime(normalized.start_date_local)}
            </div>
          </div>
          
          <button
            onClick={() => onViewDetails(activity)}
            className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
          >
            View Details →
          </button>
        </div>
      </div>

      {/* Performance metrics - Compact row */}
      {(pace || normalized.average_heartrate || normalized.average_watts || tss || normalized.kudos_count > 0) && (
        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1.5 pt-1.5 border-t border-gray-100">
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
      )}
    </div>
  )
} 