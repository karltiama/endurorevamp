'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  Webhook,
  Clock,
  Zap,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface WebhookStatus {
  hasActiveWebhook: boolean;
  subscriptions: { id: string; callback_url: string; created_at: string }[];
}

interface SyncStats {
  totalUsers: number;
  recentSyncs: number;
  staleSyncs: number;
  expiredTokens: number;
}

export function AutoSyncManager() {
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus | null>(
    null
  );
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSetupLoading, setIsSetupLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [webhookRes, statsRes] = await Promise.all([
        fetch('/api/webhooks/setup'),
        fetch('/api/sync/background'),
      ]);

      if (webhookRes.ok) {
        const webhookData = await webhookRes.json();
        setWebhookStatus(webhookData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setSyncStats(statsData.stats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const setupWebhook = async () => {
    try {
      setIsSetupLoading(true);
      const response = await fetch('/api/webhooks/setup', { method: 'POST' });
      const result = await response.json();

      if (result.success) {
        await loadData(); // Refresh data
      } else {
        setError(result.error || 'Failed to setup webhook');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to setup webhook');
    } finally {
      setIsSetupLoading(false);
    }
  };

  const deleteWebhook = async () => {
    try {
      setIsSetupLoading(true);
      const response = await fetch('/api/webhooks/setup', { method: 'DELETE' });
      const result = await response.json();

      if (result.success) {
        await loadData(); // Refresh data
      } else {
        setError(result.error || 'Failed to delete webhook');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete webhook');
    } finally {
      setIsSetupLoading(false);
    }
  };

  const triggerBackgroundSync = async () => {
    try {
      setIsSetupLoading(true);
      const response = await fetch('/api/sync/background', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${process.env.NEXT_PUBLIC_BACKGROUND_SYNC_API_KEY || 'test-key'}`,
        },
        body: JSON.stringify({
          syncType: 'quick',
          maxUsers: 50,
          skipRecentlySynced: true,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await loadData(); // Refresh stats
      } else {
        setError(result.error || 'Failed to trigger sync');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger sync');
    } finally {
      setIsSetupLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading automatic sync settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Automatic Sync Configuration
          </CardTitle>
          <CardDescription>
            Configure automatic syncing of Strava activities using webhooks and
            background sync
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Webhook Status */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  <Webhook className="h-4 w-4" />
                  Real-time Webhooks
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified immediately when users complete activities
                </p>
              </div>
              <div className="flex items-center gap-2">
                {webhookStatus?.hasActiveWebhook ? (
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Inactive
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {webhookStatus?.hasActiveWebhook ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deleteWebhook}
                  disabled={isSetupLoading}
                >
                  {isSetupLoading && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Remove Webhook
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={setupWebhook}
                  disabled={isSetupLoading}
                >
                  {isSetupLoading && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Setup Webhook
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Background Sync */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Background Sync
                </Label>
                <p className="text-sm text-muted-foreground">
                  Scheduled sync as backup for webhook failures
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={triggerBackgroundSync}
              disabled={isSetupLoading}
            >
              {isSetupLoading && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Trigger Manual Sync
            </Button>
          </div>

          {/* Sync Statistics */}
          {syncStats && (
            <>
              <Separator />
              <div className="space-y-4">
                <Label>Sync Statistics</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {syncStats.totalUsers}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Users
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {syncStats.recentSyncs}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Recent Syncs
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {syncStats.staleSyncs}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Stale Data
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {syncStats.expiredTokens}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Expired Tokens
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Automatic Sync Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Environment Variables Required:</h4>
            <div className="bg-slate-100 p-3 rounded-md font-mono text-sm">
              <div>STRAVA_WEBHOOK_VERIFY_TOKEN=your-webhook-token</div>
              <div>BACKGROUND_SYNC_API_KEY=your-api-key</div>
              <div>NEXT_PUBLIC_APP_URL=https://yourdomain.com</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Deployment Requirements:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                • Webhook endpoint: /api/webhooks/strava (must be publicly
                accessible)
              </li>
              <li>
                • Set up cron job to call /api/sync/background every 2-4 hours
              </li>
              <li>• Ensure your domain has valid SSL certificate</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
