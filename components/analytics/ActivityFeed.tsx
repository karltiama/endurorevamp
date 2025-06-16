'use client'

import { useState } from 'react'
import { useAthleteActivities } from '@/hooks/use-athlete-activities'
import { ActivityCard } from './ActivityCard'
import { ActivityDetailModal } from './ActivityDetailModal'
import type { StravaActivity } from '@/types/strava'

interface ActivityFeedProps {
  accessToken: string
  userId: string
}

export function ActivityFeed({ accessToken, userId }: ActivityFeedProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedActivity, setSelectedActivity] = useState<StravaActivity | null>(null)
  
  // Calculate 90 days ago timestamp
  const ninetyDaysAgo = Math.floor(Date.now() / 1000) - (90 * 24 * 60 * 60)
  
  const { data: activities, isLoading, error } = useAthleteActivities(accessToken, {
    page: currentPage,
    per_page: 20,
    after: ninetyDaysAgo, // Only get activities from last 90 days
  })

  const handleViewDetails = (activity: StravaActivity) => {
    setSelectedActivity(activity)
  }

  const handleCloseModal = () => {
    setSelectedActivity(null)
  }

  const handleNextPage = () => {
    setCurrentPage(prev => prev + 1)
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
        <p className="text-red-600">
          {error.message || 'There was an error loading your activities.'}
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
        <p className="text-gray-500">
          No activities found in the last 90 days. Start logging your workouts!
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
            Your activities from the last 90 days • Page {currentPage}
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {activities.length} activities loaded
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-3">
        {activities.map((activity) => (
          <ActivityCard
            key={activity.id}
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
          Page {currentPage}
        </span>
        
        <button
          onClick={handleNextPage}
          disabled={!activities.length || activities.length < 20}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>

      {/* Activity Detail Modal */}
      {selectedActivity && (
        <ActivityDetailModal
          activity={selectedActivity}
          userId={userId}
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