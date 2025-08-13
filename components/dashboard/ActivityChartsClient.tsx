'use client';

import { useUserActivities } from '@/hooks/use-user-activities';
import { ActivityCharts } from './ActivityCharts';
import { useEffect } from 'react';

interface ActivityChartsClientProps {
  userId: string;
}

export function ActivityChartsClient({ userId }: ActivityChartsClientProps) {
  const { data: activities, isLoading, error } = useUserActivities(userId);

  useEffect(() => {
    console.log('ActivityChartsClient: Component mounted/updated', {
      userId,
      isLoading,
      error: error?.message,
      activitiesCount: activities?.length || 0,
    });
  }, [userId, isLoading, error, activities]);

  if (isLoading) {
    console.log('ActivityChartsClient: Loading state');
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="h-[400px] bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('ActivityChartsClient: Error state', error);
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-500">
          Failed to load activity data: {error.message}
        </div>
      </div>
    );
  }

  console.log(
    'ActivityChartsClient: Rendering charts with activities:',
    activities?.length || 0
  );
  // Pass the activities data to ActivityCharts
  return <ActivityCharts activities={activities || []} />;
}
