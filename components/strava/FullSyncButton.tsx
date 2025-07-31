'use client';

import { Button } from '@/components/ui/button';
import { useStravaSync, useSyncStatusInfo } from '@/hooks/use-strava-sync';
import { Loader2, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function FullSyncButton() {
  const { 
    fullSync, 
    isSyncing, 
    syncError, 
    syncResult,
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
    
    return 'Full sync is temporarily unavailable. Please try again later.';
  };

  const isDisabled = isSyncing || isLoadingStatus || !statusInfo.canSync || !statusInfo.hasStravaTokens;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleFullSync}
            disabled={isDisabled}
            variant={getButtonVariant()}
            className="w-full"
          >
            {getStatusIcon()}
            <span className="ml-2">
              {getButtonText()}
            </span>
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