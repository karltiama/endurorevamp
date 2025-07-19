'use client'

import { formatDistance, formatPace, getActivityIcon } from '@/lib/utils'
import { useUnitPreferences } from '@/hooks/useUnitPreferences'
import type { Activity, StravaActivity } from '@/lib/strava/types'
import { Heart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// Union type for activities from database or API
type ActivityCardActivity = Activity | StravaActivity

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
        perceived_exertion: (act as any)?.perceived_exertion
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
        perceived_exertion: (act as any)?.perceived_exertion
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
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays === 2) {
      return '2 days ago'
    } else if (diffDays <= 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getRPEBadge = (rpe: number) => {
    if (!rpe) return null
    
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
    <div className="bg-white border border-gray-200 rounded-lg p-2.5 hover:shadow-md transition-shadow">
      {/* Title - Centered */}
      <div className="text-center mb-2">
        <h3 className="font-semibold text-base text-gray-900 truncate">
          {normalized.name}
        </h3>
        <div className="flex items-center justify-center gap-2 mt-1">
          {normalized.private && (
            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
              Private
            </span>
          )}
          {getRPEBadge(normalized.perceived_exertion)}
        </div>
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
    </div>
  )
} 