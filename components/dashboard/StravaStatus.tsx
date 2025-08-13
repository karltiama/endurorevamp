'use client';

import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useStravaConnection } from '@/hooks/strava/useStravaConnection';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getStravaAuthUrl } from '@/lib/strava';

export function StravaStatus() {
  const { connectionStatus, isLoading } = useStravaConnection();

  if (isLoading) {
    return (
      <Badge
        variant="secondary"
        className="bg-yellow-100 text-yellow-800 border-yellow-200"
        role="status"
      >
        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse mr-2"></div>
        <RefreshCw className="w-3 h-3 animate-spin mr-1" />
        <span>Syncing...</span>
      </Badge>
    );
  }

  const isConnected = connectionStatus?.connected || false;

  const handleStravaAuth = () => {
    window.location.href = getStravaAuthUrl(window.location.origin);
  };

  if (isConnected) {
    return (
      <Badge
        variant="default"
        className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100"
        role="status"
      >
        <CheckCircle className="w-3 h-3 mr-1" />
        <span>Strava Synced</span>
      </Badge>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="destructive"
            className="bg-red-100 text-red-800 border-red-200 hover:bg-red-200 cursor-pointer transition-colors"
            onClick={handleStravaAuth}
            role="status"
          >
            <AlertCircle className="w-3 h-3 mr-1" />
            <span>Not Synced</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium">Connect to Strava</p>
            <p className="text-sm text-muted-foreground">
              Sync your activities automatically and track your training
              progress. You can manage this connection anytime in Settings.
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>• Read your activity data</div>
              <div>• Sync automatically</div>
              <div>• Analyze performance</div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
