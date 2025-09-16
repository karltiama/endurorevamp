'use client';

import { SyncButton } from '@/components/strava/SyncButton';
import { FullSyncButton } from '@/components/strava/FullSyncButton';
import { useSyncStatusInfo } from '@/hooks/use-strava-sync';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Zap, Database } from 'lucide-react';

export default function TestSyncStrategyPage() {
  const statusInfo = useSyncStatusInfo();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Sync Strategy Test</h1>
        <p className="text-muted-foreground">
          Testing the new two-strategy sync approach
        </p>
      </div>

      {/* Strategy Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Sync Strategy Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                <strong>Quick Sync:</strong> Fetches your 50 most recent
                activities. Perfect for daily use and keeping your data fresh.
              </AlertDescription>
            </Alert>

            <Alert>
              <Database className="h-4 w-4" />
              <AlertDescription>
                <strong>Full Sync:</strong> Downloads your entire activity
                history using pagination. Use this for initial setup or when you
                want all your data.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Sync Buttons */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              Quick Sync
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Sync your 50 most recent activities. Fast and efficient for
                regular use.
              </p>
              <SyncButton />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-500" />
              Full Sync
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Download your complete activity history. This may take several
                minutes.
              </p>
              <FullSyncButton />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Information */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium text-muted-foreground">Last Sync</div>
              <div>{statusInfo.lastSyncText}</div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">
                Activities
              </div>
              <div>{statusInfo.activityCount}</div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">
                Today&apos;s Syncs
              </div>
              <div>
                {statusInfo.todaySyncs} / {statusInfo.maxSyncs}
              </div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">Status</div>
              <div
                className={
                  statusInfo.canSync ? 'text-green-600' : 'text-red-600'
                }
              >
                {statusInfo.canSync ? 'Ready' : 'Unavailable'}
              </div>
            </div>
          </div>

          {statusInfo.syncDisabledReason && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
              <strong>Note:</strong> {statusInfo.syncDisabledReason}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
