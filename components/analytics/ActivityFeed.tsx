'use client'

import { useState } from 'react'
import { ActivityCard } from './ActivityCard'
import { ActivityDetailModal } from './ActivityDetailModal'
import type { Activity, StravaActivity } from '@/lib/strava/types'

// Union type for activities from database or API
type ActivityFeedActivity = Activity | StravaActivity

interface ActivityFeedProps {
  activities: Activity[]
  isLoading: boolean
  error: Error | null
}

export function ActivityFeed({ activities, isLoading, error }: ActivityFeedProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedActivity, setSelectedActivity] = useState<ActivityFeedActivity | null>(null)

  // Client-side pagination (activities are already filtered)
  const ITEMS_PER_PAGE = 20

  const totalPages = Math.ceil(activities.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentActivities = activities.slice(startIndex, endIndex)

  const handleViewDetails = (activity: ActivityFeedActivity) => {
    setSelectedActivity(activity)
  }

  const handleCloseModal = () => {
    setSelectedActivity(null)
  }

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1))
  }

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1))
  }

  if (isLoading) {
    return <ActivityFeedSkeleton />
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Unable to Load Activities
        </h3>
        <p className="text-red-600 mb-4">
          {error.message || 'There was an error loading your activities from the database.'}
        </p>
        <p className="text-sm text-red-500">
          💡 Try syncing your Strava data to populate the database with recent activities.
        </p>
      </div>
    )
  }

  if (!activities?.length) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <div className="text-4xl mb-4">🏃‍♂️</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          No Activities Found
        </h3>
        <p className="text-gray-500 mb-4">
          No activities found in your database.
        </p>
        <p className="text-sm text-blue-600">
          💡 Click &quot;Sync Strava Data&quot; to load your activities.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Activity List */}
      <div className="space-y-4">
        {currentActivities.map((activity) => (
          <ActivityCard
            key={activity.strava_activity_id}
            activity={activity}
            onViewDetails={handleViewDetails}
          />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center pt-2">
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        <span className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
        
        <button
          onClick={handleNextPage}
          disabled={currentPage >= totalPages}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>

      {/* Activity Detail Modal */}
      {selectedActivity && (
        <ActivityDetailModal
          activity={selectedActivity as StravaActivity}
          onClose={handleCloseModal}
        />
      )}
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
      
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="animate-pulse">
              {/* Header Row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div>
                    <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
              
              {/* Main Metrics Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="text-center">
                    <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-12 mx-auto"></div>
                  </div>
                ))}
              </div>
              
              {/* Additional Metrics Row */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {Array.from({ length: 3 }).map((_, k) => (
                  <div key={k} className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-12"></div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Footer Row */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 