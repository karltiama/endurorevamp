import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants/query-keys';

interface UseFavoriteActivityReturn {
  toggleFavorite: (activityId: number) => Promise<void>;
  isToggling: boolean;
}

export function useFavoriteActivity(): UseFavoriteActivityReturn {
  const [isToggling, setIsToggling] = useState(false);
  const queryClient = useQueryClient();

  const toggleFavorite = async (activityId: number) => {
    setIsToggling(true);

    try {
      // Optimistic update - immediately update the cache
      queryClient.setQueriesData(
        { queryKey: ['user', 'activities'], exact: false },
        (oldData: any) => {
          if (!oldData) return oldData;

          return oldData.map((activity: any) => {
            if (
              activity.strava_activity_id === activityId ||
              activity.id === activityId
            ) {
              return { ...activity, is_favorite: !activity.is_favorite };
            }
            return activity;
          });
        }
      );

      const response = await fetch(`/api/activities/${activityId}/favorite`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to toggle favorite status');
      }

      const result = await response.json();

      // Invalidate and refetch activities to ensure consistency
      await queryClient.invalidateQueries({
        queryKey: ['user', 'activities'],
        exact: false,
      });

      // Optional: Show success message
      console.log(result.message);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert optimistic update on error
      queryClient.invalidateQueries({
        queryKey: ['user', 'activities'],
        exact: false,
      });
      // Optional: Show error message to user
    } finally {
      setIsToggling(false);
    }
  };

  return {
    toggleFavorite,
    isToggling,
  };
}
