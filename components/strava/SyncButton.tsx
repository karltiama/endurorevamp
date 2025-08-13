'use client';

import { Button } from '@/components/ui/button';
import { useStravaSync, useSyncStatusInfo } from '@/hooks/use-strava-sync';
import { Loader2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function SyncButton() {
  const { quickSync, isSyncing, syncError, syncResult, isLoadingStatus } =
    useStravaSync();

  // Get formatted status info
  const statusInfo = useSyncStatusInfo();

  const handleSync = async () => {
    try {
      // Use quickSync for 50 most recent activities
      quickSync();
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

  const getButtonText = () => {
    if (isSyncing) {
      return 'Syncing...';
    }

    if (!statusInfo.hasStravaTokens) {
      return 'Connect Strava First';
    }

    if (!statusInfo.canSync) {
      return 'Sync Unavailable';
    }

    return 'Quick Sync (50 Recent)';
  };

  const getButtonVariant = () => {
    if (!statusInfo.hasStravaTokens) {
      return 'outline' as const;
    }

    if (!statusInfo.canSync) {
      return 'secondary' as const;
    }

    return 'default' as const;
  };

  const getUnavailableReason = () => {
    if (!statusInfo.hasStravaTokens) {
      return 'Please connect your Strava account first to sync activities.';
    }

    if (statusInfo.todaySyncs >= statusInfo.maxSyncs) {
      return `Daily sync limit reached (${statusInfo.maxSyncs} syncs per day). Try again tomorrow.`;
    }

    if (statusInfo.syncDisabledReason) {
      return statusInfo.syncDisabledReason;
    }

    return 'Sync is temporarily unavailable. Please try again later.';
  };

  const isDisabled =
    isSyncing ||
    isLoadingStatus ||
    !statusInfo.hasStravaTokens ||
    !statusInfo.canSync;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleSync}
            disabled={isDisabled}
            variant={getButtonVariant()}
            className="w-full"
          >
            {getStatusIcon()}
            <span className="ml-2">{getButtonText()}</span>
          </Button>
        </TooltipTrigger>
        {isDisabled && (
          <TooltipContent>
            <p className="max-w-xs">{getUnavailableReason()}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
