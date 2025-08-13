'use client';

import { useUserActivities } from '@/hooks/use-user-activities';
import { PersonalBests } from './PersonalBests';
import { useEffect } from 'react';

interface PersonalBestsClientProps {
  userId: string;
}

export function PersonalBestsClient({ userId }: PersonalBestsClientProps) {
  const { data: activities, isLoading, error } = useUserActivities(userId);

  useEffect(() => {
    console.log('PersonalBestsClient: Component mounted/updated', {
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-20 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-32 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
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

  return <PersonalBests activities={activities || []} />;
}
