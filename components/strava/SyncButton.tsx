'use client';

import { Button } from '@/components/ui/button';
import { useStravaSync } from '@/hooks/strava/useStravaSync';
import { Loader2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export function SyncButton() {
  const { syncData, isLoading, lastSyncResult, error } = useStravaSync();

  const handleSync = async () => {
    try {
      const result = await syncData({
        maxActivities: 50, // Limit for demo
        sinceDays: 30, // Last 30 days
      });
      
      console.log('Sync completed:', result);
    } catch (err) {
      console.error('Sync failed:', err);
    }
  };

  const getStatusIcon = () => {
    if (isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    
    if (error) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    
    if (lastSyncResult?.success) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    return <RefreshCw className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleSync}
        disabled={isLoading}
        className="w-full"
      >
        {getStatusIcon()}
        <span className="ml-2">
          {isLoading ? 'Syncing...' : 'Sync Strava Data'}
        </span>
      </Button>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {lastSyncResult && !error && (
        <div className="text-sm bg-gray-50 p-3 rounded space-y-1">
          <div className="font-medium">Last Sync Results:</div>
          <div>✅ Profile updated: {lastSyncResult.profileUpdated ? 'Yes' : 'No'}</div>
          <div>📊 Activities processed: {lastSyncResult.activitiesProcessed}</div>
          {lastSyncResult.rateLimitInfo && (
            <div>🔄 Rate limit remaining: {lastSyncResult.rateLimitInfo.remaining}</div>
          )}
        </div>
      )}
    </div>
  );
} 