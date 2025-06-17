'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import type { StravaActivity } from '@/types/strava'

interface ActivityDetailModalProps {
  activity: StravaActivity
  userId: string
  onClose: () => void
}

export function ActivityDetailModal({ activity, userId, onClose }: ActivityDetailModalProps) {
  const formatDistance = (meters: number) => {
    return `${(meters / 1000).toFixed(2)} km`
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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

  const calculateMetrics = (activity: StravaActivity) => {
    const metrics = []

    // Distance and Duration
    metrics.push({
      label: 'Distance',
      value: formatDistance(activity.distance),
      icon: '📏'
    })

    metrics.push({
      label: 'Moving Time',
      value: formatDuration(activity.moving_time),
      icon: '⏱️'
    })

    if (activity.elapsed_time !== activity.moving_time) {
      metrics.push({
        label: 'Total Time',
        value: formatDuration(activity.elapsed_time),
        icon: '🕐'
      })
    }

    // Speed/Pace
    if (activity.average_speed) {
      if (activity.type === 'Run') {
        const paceSecondsPerKm = activity.moving_time / (activity.distance / 1000)
        const minutes = Math.floor(paceSecondsPerKm / 60)
        const seconds = Math.floor(paceSecondsPerKm % 60)
        metrics.push({
          label: 'Average Pace',
          value: `${minutes}:${seconds.toString().padStart(2, '0')} /km`,
          icon: '🏃‍♂️'
        })
      } else {
        metrics.push({
          label: 'Average Speed',
          value: `${(activity.average_speed * 3.6).toFixed(1)} km/h`,
          icon: '💨'
        })
      }
    }

    if (activity.max_speed) {
      metrics.push({
        label: 'Max Speed',
        value: `${(activity.max_speed * 3.6).toFixed(1)} km/h`,
        icon: '⚡'
      })
    }

    // Heart Rate
    if (activity.average_heartrate) {
      metrics.push({
        label: 'Avg Heart Rate',
        value: `${Math.round(activity.average_heartrate)} bpm`,
        icon: '❤️'
      })
    }

    if (activity.max_heartrate) {
      metrics.push({
        label: 'Max Heart Rate',
        value: `${activity.max_heartrate} bpm`,
        icon: '💓'
      })
    }

    // Power (for cycling)
    if (activity.average_watts && activity.average_watts > 0) {
      metrics.push({
        label: 'Average Power',
        value: `${Math.round(activity.average_watts)}w`,
        icon: '⚡'
      })
    }

    if (activity.max_watts && activity.max_watts > 0) {
      metrics.push({
        label: 'Max Power',
        value: `${activity.max_watts}w`,
        icon: '⚡'
      })
    }

    // Elevation
    if (activity.total_elevation_gain && activity.total_elevation_gain > 0) {
      metrics.push({
        label: 'Elevation Gain',
        value: `${activity.total_elevation_gain}m`,
        icon: '⛰️'
      })
    }

    // Calories
    if (activity.kilojoules) {
      metrics.push({
        label: 'Energy',
        value: `${activity.kilojoules} kJ`,
        icon: '🔥'
      })
    }

    return metrics
  }

  const metrics = calculateMetrics(activity)

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start space-x-4">
                    <div className="text-4xl">{getActivityIcon(activity.type)}</div>
                    <div>
                      <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900">
                        {activity.name}
                      </Dialog.Title>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDate(activity.start_date_local)} at {formatTime(activity.start_date_local)}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {activity.type}
                        </span>
                        {activity.private && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Private
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  {metrics.map((metric, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <span>{metric.icon}</span>
                        <span className="text-xs font-medium text-gray-600">
                          {metric.label}
                        </span>
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {metric.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Additional activity info */}
                <div className="mb-6">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {activity.trainer && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        Indoor Trainer
                      </span>
                    )}
                    {activity.commute && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Commute
                      </span>
                    )}
                    {activity.manual && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Manual Entry
                      </span>
                    )}
                  </div>
                </div>

                {/* Social Stats */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    {activity.kudos_count > 0 && (
                      <span>👍 {activity.kudos_count} kudos</span>
                    )}
                    {activity.comment_count > 0 && (
                      <span>💬 {activity.comment_count} comments</span>
                    )}
                    {activity.achievement_count > 0 && (
                      <span>🏆 {activity.achievement_count} achievements</span>
                    )}
                  </div>
                  
                  {/* Future: Add "Generate Insights" button here */}
                  <div className="text-xs text-gray-400">
                    AI insights coming soon...
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
} 