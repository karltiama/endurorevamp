'use client';

import { Button } from '@/components/ui/button';
import { useStravaSync, useSyncStatusInfo } from '@/hooks/use-strava-sync';
import { Loader2, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export function FullSyncButton() {
  const { 
    fullSync, 
    isSyncing, 
    syncError, 
    syncResult,
    syncStatus,
    isLoadingStatus 
  } = useStravaSync();

  // Get formatted status info
  const statusInfo = useSyncStatusInfo();

  const [showWarning, setShowWarning] = useState(false);

  const handleFullSync = async () => {
    if (!showWarning) {
      setShowWarning(true);
      return;
    }

    try {
      fullSync();
      setShowWarning(false);
    } catch (err) {
      console.error('❌ FullSyncButton: Sync failed:', err);
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
    
    return <Database className="h-4 w-4" />;
  };

  const getButtonText = () => {
    if (isSyncing) {
      return 'Full Sync in Progress...';
    }
    
    if (!statusInfo.hasStravaTokens) {
      return 'Connect Strava First';
    }
    
    if (showWarning) {
      return 'Confirm Full Sync';
    }
    
    return 'Full Sync All Activities';
  };

  const getButtonVariant = () => {
    if (showWarning) {
      return 'destructive' as const;
    }
    
    if (!statusInfo.hasStravaTokens) {
      return 'outline' as const;
    }
    
    if (isSyncing) {
      return 'secondary' as const;
    }
    
    return 'default' as const;
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleFullSync}
        disabled={isSyncing || isLoadingStatus || !syncStatus?.canSync || !statusInfo.hasStravaTokens}
        variant={getButtonVariant()}
        className="w-full"
      >
        {getStatusIcon()}
        <span className="ml-2">
          {getButtonText()}
        </span>
      </Button>

      {showWarning && !isSyncing && (
        <div className="text-sm text-amber-700 bg-amber-50 p-3 rounded border border-amber-200">
          <div className="font-medium mb-2">⚠️ Full Sync Warning</div>
          <ul className="text-xs space-y-1">
            <li>• This will fetch ALL your Strava activities (may take several minutes)</li>
            <li>• Uses 1 sync from your daily limit</li>
            <li>• Respects Strava API rate limits with delays between requests</li>
            <li>• Only new activities will be added to your database</li>
          </ul>
        </div>
      )}

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

      {syncResult && !syncError && syncResult.data && (
        <div className="text-sm bg-green-50 p-3 rounded space-y-1 border border-green-200">
          <div className="font-medium text-green-800">✅ Full Sync Completed!</div>
          <div className="text-green-700">
            <div>📊 Activities processed: {syncResult.data.activitiesProcessed}</div>
            <div>🆕 New activities: {syncResult.data.newActivities}</div>
            <div>🔄 Updated activities: {syncResult.data.updatedActivities}</div>
            <div>⏱️ Duration: {Math.round(syncResult.data.syncDuration / 1000)}s</div>
            {syncResult.syncType === 'full' && (
              <div>📄 Sync type: Full historical sync with pagination</div>
            )}
          </div>
          {syncResult.errors && syncResult.errors.length > 0 && (
            <div className="text-amber-600 text-xs mt-2">
              <strong>Warnings:</strong>
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
          <div>Current activities: {syncStatus.activityCount}</div>
          <div>Daily syncs used: {syncStatus.syncState?.sync_requests_today || 0}/5</div>
        </div>
      )}
    </div>
  );
} 