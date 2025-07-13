'use client';

import { Button } from '@/components/ui/button';
import { useStravaSync } from '@/hooks/use-strava-sync'; // Use the working API version
import { Loader2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export function SyncButton() {
  const { 
    forceFullSync, 
    isSyncing, 
    syncError, 
    syncResult,
    syncStatus,
    isLoadingStatus 
  } = useStravaSync();

  const handleSync = async () => {
    console.log('🔄 SyncButton: Starting sync process');
    try {
      // Use forceFullSync to test rate limiting
      forceFullSync();
    } catch (err) {
      console.error('❌ SyncButton: Sync failed:', err);
    }
  };

  const getStatusIcon = () => {
    if (isSyncing) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    
    if (syncError) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    
    if (syncResult?.success) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    return <RefreshCw className="h-4 w-4" />;
  };

  // Debug logging for hook state changes
  console.log('🔍 SyncButton state:', {
    isSyncing,
    hasError: !!syncError,
    syncError: syncError?.message,
    syncResult,
    hasLastResult: !!syncResult
  });

  return (
    <div className="space-y-4">
      <Button
        onClick={handleSync}
        disabled={isSyncing || isLoadingStatus}
        className="w-full"
      >
        {getStatusIcon()}
        <span className="ml-2">
          {isSyncing ? 'Syncing...' : 'Sync Strava Data'}
        </span>
      </Button>

      {syncError && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
          <strong>Error:</strong> {syncError.message}
          <details className="mt-2">
            <summary className="cursor-pointer text-xs">Show debugging info</summary>
            <pre className="mt-1 text-xs overflow-auto">
              {JSON.stringify({ error: syncError.message, syncResult }, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {syncResult && !syncError && (
        <div className="text-sm bg-gray-50 p-3 rounded space-y-1">
          <div className="font-medium">Last Sync Results:</div>
          <div>✅ Success: {syncResult.success ? 'Yes' : 'No'}</div>
          <div>📊 Activities processed: {syncResult.data?.activitiesProcessed || 0}</div>
          <div>🆕 New activities: {syncResult.data?.newActivities || 0}</div>
          <div>🔄 Updated activities: {syncResult.data?.updatedActivities || 0}</div>
          <div>⏱️ Duration: {syncResult.data?.syncDuration ? `${Math.round(syncResult.data.syncDuration / 1000)}s` : 'N/A'}</div>
          {syncResult.errors && syncResult.errors.length > 0 && (
            <div className="text-red-600 text-xs mt-2">
              <strong>Warnings/Errors:</strong>
              <ul className="list-disc list-inside">
                {syncResult.errors.map((err: string, idx: number) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {syncStatus && (
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <div>Status: {syncStatus.canSync ? '✅ Ready to sync' : '⏳ Sync cooldown'}</div>
          <div>Activities: {syncStatus.activityCount}</div>
        </div>
      )}
    </div>
  );
} 