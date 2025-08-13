'use client';

import {
  formatDistance,
  getActivityIcon,
  formatStravaDate,
  formatStravaTime,
  formatPace,
} from '@/lib/utils';
import { useUnitPreferences } from '@/hooks/useUnitPreferences';
import { useFavoriteActivity } from '@/hooks/useFavoriteActivity';
import type { Activity, StravaActivity } from '@/lib/strava/types';
import { Badge } from '@/components/ui/badge';
import { Heart, HeartOff } from 'lucide-react';

// Union type for activities from database or API
type ActivityCardActivity = Activity | StravaActivity;

// Type for activities with RPE data
interface ActivityWithRPE {
  perceived_exertion?: number;
}

interface ActivityCardProps {
  activity: ActivityCardActivity;
  onViewDetails: (activity: ActivityCardActivity) => void;
}

export function ActivityCard({ activity, onViewDetails }: ActivityCardProps) {
  const { preferences } = useUnitPreferences();
  const { toggleFavorite, isToggling } = useFavoriteActivity();

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
        average_pace: act.average_pace,
        is_favorite: act.is_favorite || false,
        kudos_count: act.kudos_count || 0,
        private: act.private || false,
        trainer: act.trainer || false,
        perceived_exertion: (act as ActivityWithRPE)?.perceived_exertion,
      };
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
        average_pace: act.average_pace,
        is_favorite: act.is_favorite || false,
        kudos_count: act.kudos_count || 0,
        private: act.private || false,
        trainer: act.trainer || false,
        perceived_exertion: (act as ActivityWithRPE)?.perceived_exertion,
      };
    }
  };

  const normalized = normalizeActivity(activity);

  const formatDistanceWithUnits = (meters: number) => {
    return formatDistance(meters, preferences.distance);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  // Use the new utility functions for proper timezone handling
  const formatDate = (dateString: string) => formatStravaDate(dateString);
  const formatTime = (dateString: string) => formatStravaTime(dateString);

  // Format speed with proper unit conversion (matching ActivityDetailModal)
  const formatSpeed = (speedMs: number) => {
    const speedKmh = speedMs * 3.6;
    if (preferences.distance === 'miles') {
      const speedMph = speedKmh * 0.621371;
      return `${speedMph % 1 === 0 ? speedMph.toFixed(0) : speedMph.toFixed(1)} mph`;
    }
    return `${speedKmh % 1 === 0 ? speedKmh.toFixed(0) : speedKmh.toFixed(1)} km/h`;
  };

  // Calculate pace for running activities
  const calculatePace = () => {
    if (normalized.type === 'Run' && normalized.distance > 0) {
      // Use pre-computed average_pace if available (more accurate)
      if (normalized.average_pace) {
        return formatPace(normalized.average_pace, preferences.pace);
      }

      // Fallback to calculation if average_pace not available
      if (normalized.moving_time > 0) {
        const secondsPerKm =
          normalized.moving_time / (normalized.distance / 1000);
        return formatPace(secondsPerKm, preferences.pace);
      }
    }
    return null;
  };

  // Determine which metrics to show based on activity type
  const getActivityMetrics = () => {
    const metrics = [];

    // For weight training/workout activities, only show duration
    if (['WeightTraining', 'Workout'].includes(normalized.type)) {
      metrics.push({
        label: 'Duration',
        value: formatDuration(normalized.moving_time),
        color: 'text-green-600',
      });
      return metrics;
    }

    // For running activities, show distance and pace (encourage clicking "View Details")
    if (normalized.type === 'Run') {
      metrics.push({
        label: 'Distance',
        value: formatDistanceWithUnits(normalized.distance),
        color: 'text-blue-600',
      });

      const pace = calculatePace();
      if (pace) {
        metrics.push({
          label: 'Pace',
          value: pace,
          color: 'text-indigo-600',
        });
      }
      return metrics;
    }

    // For walking activities, show distance and pace
    if (normalized.type === 'Walk') {
      metrics.push({
        label: 'Distance',
        value: formatDistanceWithUnits(normalized.distance),
        color: 'text-blue-600',
      });

      const pace = calculatePace();
      if (pace) {
        metrics.push({
          label: 'Pace',
          value: pace,
          color: 'text-indigo-600',
        });
      }
      return metrics;
    }

    // For other activities, show distance and duration
    metrics.push({
      label: 'Distance',
      value: formatDistanceWithUnits(normalized.distance),
      color: 'text-blue-600',
    });

    metrics.push({
      label: 'Duration',
      value: formatDuration(normalized.moving_time),
      color: 'text-green-600',
    });

    // Show speed for activities that typically have it (but not runs/walks)
    if (
      normalized.average_speed &&
      ['Ride', 'Hike', 'Swim'].includes(normalized.type)
    ) {
      metrics.push({
        label: 'Avg Speed',
        value: formatSpeed(normalized.average_speed),
        color: 'text-purple-600',
      });
    }

    // Show elevation if available and significant (but not for runs/walks in quick view)
    if (
      normalized.total_elevation_gain > 0 &&
      !['Run', 'Walk'].includes(normalized.type)
    ) {
      metrics.push({
        label: 'Elevation',
        value: `↗ ${normalized.total_elevation_gain}m`,
        color: 'text-orange-600',
      });
    }

    return metrics;
  };

  // Get additional metrics based on activity type
  const getAdditionalMetrics = () => {
    const metrics = [];

    // For runs and walks, only show kudos (encourage clicking "View Details" for HR)
    if (['Run', 'Walk'].includes(normalized.type)) {
      metrics.push({
        icon: '👍',
        value: normalized.kudos_count.toString(),
        label: 'Kudos',
        color: 'text-blue-500',
      });
      return metrics;
    }

    // Heart rate for other cardio activities
    if (
      normalized.average_heartrate &&
      ['Ride', 'Hike', 'Swim'].includes(normalized.type)
    ) {
      metrics.push({
        icon: '❤️',
        value: `${normalized.average_heartrate} bpm`,
        label: 'Avg HR',
        color: 'text-red-500',
      });
    }

    // Power for cycling activities
    if (normalized.average_watts && ['Ride'].includes(normalized.type)) {
      metrics.push({
        icon: '⚡',
        value: `${normalized.average_watts}w`,
        label: 'Avg Power',
        color: 'text-yellow-500',
      });
    }

    // Always show kudos for other activities
    metrics.push({
      icon: '👍',
      value: normalized.kudos_count.toString(),
      label: 'Kudos',
      color: 'text-blue-500',
    });

    return metrics;
  };

  const getRPEBadge = (rpe: number | undefined) => {
    if (!rpe) {
      return (
        <Badge
          variant="secondary"
          className="text-xs bg-orange-100 text-orange-800"
        >
          <span className="text-sm mr-1">📝</span>
          Log RPE
        </Badge>
      );
    }

    // RPE Emoji Scale (matching the modal)
    const rpeEmojis = [
      '😴',
      '😌',
      '🙂',
      '😐',
      '😤',
      '😰',
      '😫',
      '😵',
      '🤯',
      '💀',
    ];
    const rpeLabels = [
      'Very Easy',
      'Easy',
      'Moderate',
      'Somewhat Hard',
      'Hard',
      'Very Hard',
      'Very Hard+',
      'Extremely Hard',
      'Maximum',
      'All Out',
    ];

    const emoji = rpeEmojis[rpe - 1] || '😐';
    const label = rpeLabels[rpe - 1] || 'Unknown';

    let color = 'bg-gray-100 text-gray-800';
    if (rpe <= 3) {
      color = 'bg-green-100 text-green-800';
    } else if (rpe <= 5) {
      color = 'bg-blue-100 text-blue-800';
    } else if (rpe <= 7) {
      color = 'bg-yellow-100 text-yellow-800';
    } else if (rpe <= 9) {
      color = 'bg-orange-100 text-orange-800';
    } else {
      color = 'bg-red-100 text-red-800';
    }

    return (
      <Badge variant="secondary" className={`text-xs ${color}`}>
        <span className="text-sm mr-1">{emoji}</span>
        {label}
      </Badge>
    );
  };

  const activityMetrics = getActivityMetrics();
  const additionalMetrics = getAdditionalMetrics();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-200 hover:border-gray-300">
      {/* Header Row */}
      <div className="flex items-start justify-between mb-4">
        {/* Left - Activity icon and type */}
        <div className="flex items-center gap-3">
          <div className="text-2xl">
            {getActivityIcon(normalized.type, normalized.trainer)}
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-900 leading-tight">
              {normalized.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-medium text-gray-700">
                {normalized.type}
              </span>
              {normalized.private && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-gray-100 text-gray-600"
                >
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

      {/* Primary Metrics Section */}
      <div className="mb-4">
        <div
          className={`grid gap-4 ${activityMetrics.length === 1 ? 'grid-cols-1' : activityMetrics.length === 2 ? 'grid-cols-2' : activityMetrics.length === 3 ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-4'}`}
        >
          {activityMetrics.map((metric, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-3 text-center">
              <div className={`text-xl font-bold ${metric.color}`}>
                {metric.value}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Secondary Metrics Section - Only show if there are additional metrics */}
      {additionalMetrics.length > 0 && (
        <div className="mb-4">
          <div className="border-t border-gray-100 pt-3">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-6">
                {additionalMetrics.map((metric, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className={metric.color}>{metric.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {metric.value}
                      </div>
                      <div className="text-xs text-gray-500">
                        {metric.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          {getRPEBadge(normalized.perceived_exertion)}

          {/* Favorite Button */}
          <button
            onClick={() => toggleFavorite(normalized.id)}
            disabled={isToggling}
            className={`p-1 rounded-full transition-colors ${
              normalized.is_favorite
                ? 'text-red-500 hover:text-red-600'
                : 'text-gray-400 hover:text-red-500'
            } ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            title={
              normalized.is_favorite
                ? 'Remove from favorites'
                : 'Add to favorites'
            }
          >
            {normalized.is_favorite ? (
              <Heart className="w-4 h-4 fill-current" />
            ) : (
              <HeartOff className="w-4 h-4" />
            )}
          </button>
        </div>

        <button
          onClick={() => onViewDetails(activity)}
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 hover:border-blue-300"
        >
          View Details →
        </button>
      </div>
    </div>
  );
}
