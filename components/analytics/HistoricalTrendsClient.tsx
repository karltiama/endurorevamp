'use client';

import { useUserActivities } from '@/hooks/use-user-activities';
import { HistoricalTrends } from './HistoricalTrends';
import { useEffect } from 'react';

interface HistoricalTrendsClientProps {
  userId: string;
}

export function HistoricalTrendsClient({
  userId,
}: HistoricalTrendsClientProps) {
  const { data: activities, isLoading, error } = useUserActivities(userId);

  useEffect(() => {
    console.log('HistoricalTrendsClient: Component mounted/updated', {
      userId,
      isLoading,
      error: error?.message,
      activitiesCount: activities?.length || 0,
    });
  }, [userId, isLoading, error, activities]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="flex gap-4 mb-6">
            <div className="h-8 bg-gray-200 rounded w-32"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
            <div className="h-8 bg-gray-200 rounded w-40"></div>
          </div>
          <div className="h-80 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-500">
          Failed to load activity data: {error.message}
        </div>
      </div>
    );
  }

  return <HistoricalTrends activities={activities || []} />;
}
