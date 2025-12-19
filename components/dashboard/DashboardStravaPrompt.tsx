'use client';

import { useStravaConnection } from '@/hooks/strava/useStravaConnection';
import { useUserActivities } from '@/hooks/use-user-activities';
import { StravaConnectionPrompt } from './StravaConnectionPrompt';
import { useAuth } from '@/providers/AuthProvider';

/**
 * Shows Strava connection prompt if:
 * - User is not connected to Strava, OR
 * - User has no activities synced
 */
export function DashboardStravaPrompt() {
  const { user } = useAuth();
  const { connectionStatus, isLoading: isLoadingConnection } = useStravaConnection();
  const { data: activities, isLoading: isLoadingActivities } = useUserActivities(user?.id || '');

  // Show loading state while checking
  if (isLoadingConnection || isLoadingActivities) {
    return null; // Don't show anything while loading
  }

  // Show prompt if not connected OR if connected but no activities
  const shouldShowPrompt = 
    !connectionStatus?.connected || 
    (connectionStatus?.connected && (!activities || activities.length === 0));

  if (!shouldShowPrompt) {
    return null;
  }

  // Show full prompt if not connected, compact if connected but no activities
  const variant = connectionStatus?.connected ? 'compact' : 'full';

  return (
    <div className="mb-6">
      <StravaConnectionPrompt variant={variant} />
    </div>
  );
}
