'use client'

import { formatDistance, getActivityIcon, formatStravaDate, formatStravaTime } from '@/lib/utils'
import { useUnitPreferences } from '@/hooks/useUnitPreferences'
import type { Activity, StravaActivity } from '@/lib/strava/types'
import { Badge } from '@/components/ui/badge'

// Union type for activities from database or API
type ActivityCardActivity = Activity | StravaActivity

// Type for activities with RPE data
interface ActivityWithRPE {
  perceived_exertion?: number
}

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
        trainer: act.trainer || false,
        perceived_exertion: (act as ActivityWithRPE)?.perceived_exertion
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
        trainer: act.trainer || false,
        perceived_exertion: (act as ActivityWithRPE)?.perceived_exertion
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

  // Use the new utility functions for proper timezone handling
  const formatDate = (dateString: string) => formatStravaDate(dateString)
  const formatTime = (dateString: string) => formatStravaTime(dateString)

  const getRPEBadge = (rpe: number | undefined) => {
    if (!rpe) {
      return (
        <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
          <span className="text-sm mr-1">📝</span>
          Log RPE
        </Badge>
      )
    }
    
    // RPE Emoji Scale (matching the modal)
    const rpeEmojis = ['😴', '😌', '🙂', '😐', '😤', '😰', '😫', '😵', '🤯', '💀']
    const rpeLabels = ['Very Easy', 'Easy', 'Moderate', 'Somewhat Hard', 'Hard', 'Very Hard', 'Very Hard+', 'Extremely Hard', 'Maximum', 'All Out']
    
    const emoji = rpeEmojis[rpe - 1] || '😐'
    const label = rpeLabels[rpe - 1] || 'Unknown'
    
    let color = 'bg-gray-100 text-gray-800'
    if (rpe <= 3) {
      color = 'bg-green-100 text-green-800'
    } else if (rpe <= 5) {
      color = 'bg-blue-100 text-blue-800'
    } else if (rpe <= 7) {
      color = 'bg-yellow-100 text-yellow-800'
    } else if (rpe <= 9) {
      color = 'bg-orange-100 text-orange-800'
    } else {
      color = 'bg-red-100 text-red-800'
    }
    
    return (
      <Badge variant="secondary" className={`text-xs ${color}`}>
        <span className="text-sm mr-1">{emoji}</span>
        {label}
      </Badge>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-200 hover:border-gray-300">
      {/* Header Row */}
      <div className="flex items-start justify-between mb-3">
        {/* Left - Activity icon and type */}
        <div className="flex items-center gap-3">
          <div className="text-2xl">{getActivityIcon(normalized.type, normalized.trainer)}</div>
          <div>
            <h3 className="font-semibold text-lg text-gray-900 leading-tight">
              {normalized.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-medium text-gray-700">{normalized.type}</span>
              {normalized.private && (
                <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                  Private
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Right - Date and time */}
        <div className="text-right">
          <div className="font-medium text-gray-900">
            {formatDate(normalized.start_date_local)}
          </div>
          <div className="text-sm text-gray-500">
            {formatTime(normalized.start_date_local)}
          </div>
        </div>
      </div>

      {/* Main Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {formatDistanceWithUnits(normalized.distance)}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Distance</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {formatDuration(normalized.moving_time)}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Duration</div>
        </div>
        
        {normalized.average_speed && (
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {formatDistance(normalized.average_speed * 3.6, preferences.distance)}/h
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Avg Speed</div>
          </div>
        )}
        
        {normalized.total_elevation_gain > 0 ? (
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              ↗ {normalized.total_elevation_gain}m
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Elevation</div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">
              —
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Elevation</div>
          </div>
        )}
      </div>

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        {normalized.average_heartrate && (
          <div className="flex items-center gap-2">
            <span className="text-red-500">❤️</span>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {normalized.average_heartrate} bpm
              </div>
              <div className="text-xs text-gray-500">Avg HR</div>
            </div>
          </div>
        )}
        
        {normalized.average_watts && (
          <div className="flex items-center gap-2">
            <span className="text-yellow-500">⚡</span>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {normalized.average_watts}w
              </div>
              <div className="text-xs text-gray-500">Avg Power</div>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <span className="text-blue-500">👍</span>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {normalized.kudos_count}
            </div>
            <div className="text-xs text-gray-500">Kudos</div>
          </div>
        </div>
      </div>

      {/* Footer Row */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          {getRPEBadge(normalized.perceived_exertion)}
        </div>
        
        <button
          onClick={() => onViewDetails(activity)}
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 hover:border-blue-300"
        >
          View Details →
        </button>
      </div>
    </div>
  )
} 