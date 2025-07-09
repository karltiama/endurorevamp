'use client'

import { useState } from 'react'
import { useUserActivities } from '@/hooks/use-user-activities'
import { ActivityCard } from './ActivityCard'
import { ActivityDetailModal } from './ActivityDetailModal'
import type { Activity, StravaActivity } from '@/lib/strava/types'

// Union type for activities from database or API
type ActivityFeedActivity = Activity | StravaActivity

interface ActivityFeedProps {
  userId: string
}

export function ActivityFeed({ userId }: ActivityFeedProps) {
  const [currentPage, setCurrentPage] = useState(1)
    const [selectedActivity, setSelectedActivity] = useState<ActivityFeedActivity | null>(null)

  // Use database instead of direct API - much faster and no rate limits!
  const { data: allActivities, isLoading, error } = useUserActivities(userId)

  // Client-side pagination and filtering (since we have all data from DB)
  const ITEMS_PER_PAGE = 20
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  // Filter activities to last 90 days and paginate
  const filteredActivities = allActivities?.filter(activity => 
    new Date(activity.start_date) >= ninetyDaysAgo
  ) || []

  const totalPages = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentActivities = filteredActivities.slice(startIndex, endIndex)

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

  if (!filteredActivities?.length) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <div className="text-4xl mb-4">🏃‍♂️</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          No Activities Found
        </h3>
        <p className="text-gray-500 mb-4">
          No activities found in the last 90 days in your database.
        </p>
        <p className="text-sm text-blue-600">
          💡 Click &quot;Sync Strava Data&quot; to load your recent activities.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Activity Feed</h2>
          <p className="text-gray-600">
            Your activities from the last 90 days • Page {currentPage} of {totalPages}
          </p>
          <p className="text-xs text-green-600 mt-1">
            📊 Loading from database (fast & efficient)
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {filteredActivities.length} activities total • {currentActivities.length} shown
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-3">
        {currentActivities.map((activity) => (
          <ActivityCard
            key={activity.strava_activity_id}
            activity={activity}
            onViewDetails={handleViewDetails}
          />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center pt-4">
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
      
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="animate-pulse">
              <div className="flex justify-between items-start">
                <div className="flex space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded"></div>
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-48"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
                <div className="space-y-2 text-right">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 