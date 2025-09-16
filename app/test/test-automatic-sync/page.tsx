'use client';

import { SyncTestDashboard } from '@/components/test/SyncTestDashboard';
import { AutoSyncManager } from '@/components/strava/AutoSyncManager';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TestTube, Settings, BookOpen } from 'lucide-react';

export default function AutoSyncTestPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Automatic Sync Testing</h1>
        <p className="text-muted-foreground">
          Test and monitor your automatic Strava sync functionality
        </p>
      </div>

      <Alert>
        <TestTube className="h-4 w-4" />
        <AlertDescription>
          <strong>Testing Environment:</strong> This page provides tools to test
          webhook delivery, background sync, and token management. Use this to
          validate your automatic sync setup.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="testing" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Testing Dashboard
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Sync Management
          </TabsTrigger>
          <TabsTrigger value="guide" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Testing Guide
          </TabsTrigger>
        </TabsList>

        <TabsContent value="testing">
          <SyncTestDashboard />
        </TabsContent>

        <TabsContent value="management">
          <AutoSyncManager />
        </TabsContent>

        <TabsContent value="guide" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Testing Guide</CardTitle>
              <CardDescription>
                Step-by-step guide to test your automatic sync functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">
                    📋 Pre-Testing Checklist
                  </h3>
                  <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                    <li>
                      ✅ Environment variables are set (webhook token, API key,
                      app URL)
                    </li>
                    <li>
                      ✅ Database migration has been run (last_sync_at field
                      added)
                    </li>
                    <li>
                      ✅ Strava connection is active for your test account
                    </li>
                    <li>✅ App is deployed and publicly accessible</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">
                    🔧 1. Initial Setup Testing
                  </h3>
                  <ol className="space-y-2 text-sm ml-4">
                    <li>
                      <strong>1.1</strong> Go to &quot;Sync Management&quot; tab
                      and set up webhook subscription
                    </li>
                    <li>
                      <strong>1.2</strong> Verify webhook status shows
                      &quot;Active&quot;
                    </li>
                    <li>
                      <strong>1.3</strong> Check sync statistics to see current
                      user count
                    </li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">📡 2. Webhook Testing</h3>
                  <ol className="space-y-2 text-sm ml-4">
                    <li>
                      <strong>2.1</strong> Go to &quot;Testing Dashboard&quot; →
                      &quot;Setup&quot; tab
                    </li>
                    <li>
                      <strong>2.2</strong> Verify your Strava Athlete ID is
                      populated
                    </li>
                    <li>
                      <strong>2.3</strong> Go to &quot;Webhook Tests&quot; tab
                    </li>
                    <li>
                      <strong>2.4</strong> Click &quot;Simulate New
                      Activity&quot; and check results
                    </li>
                    <li>
                      <strong>2.5</strong> Check your database for new activity
                      entries
                    </li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">
                    ⏰ 3. Background Sync Testing
                  </h3>
                  <ol className="space-y-2 text-sm ml-4">
                    <li>
                      <strong>3.1</strong> Go to &quot;Sync Tests&quot; tab
                    </li>
                    <li>
                      <strong>3.2</strong> Click &quot;Test Background
                      Sync&quot;
                    </li>
                    <li>
                      <strong>3.3</strong> Check results for successful user
                      sync
                    </li>
                    <li>
                      <strong>3.4</strong> Verify last_sync_at timestamp was
                      updated
                    </li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">
                    🏃 4. Real-World Testing
                  </h3>
                  <ol className="space-y-2 text-sm ml-4">
                    <li>
                      <strong>4.1</strong> Complete an actual activity on Strava
                    </li>
                    <li>
                      <strong>4.2</strong> Wait 1-2 minutes for webhook delivery
                    </li>
                    <li>
                      <strong>4.3</strong> Check your app dashboard for the new
                      activity
                    </li>
                    <li>
                      <strong>4.4</strong> If not appeared, check webhook logs
                      and manual sync
                    </li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">🔍 5. Troubleshooting</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Webhook not working?</strong>
                    </p>
                    <ul className="ml-4 space-y-1 text-muted-foreground">
                      <li>
                        • Check if webhook subscription exists (Management tab)
                      </li>
                      <li>• Verify your app URL is publicly accessible</li>
                      <li>• Check server logs for webhook POST requests</li>
                      <li>• Test with webhook simulator first</li>
                    </ul>

                    <p>
                      <strong>Background sync failing?</strong>
                    </p>
                    <ul className="ml-4 space-y-1 text-muted-foreground">
                      <li>• Check API key in environment variables</li>
                      <li>• Verify user has valid Strava tokens</li>
                      <li>• Check rate limits haven&apos;t been exceeded</li>
                      <li>• Review sync error logs</li>
                    </ul>

                    <p>
                      <strong>Token issues?</strong>
                    </p>
                    <ul className="ml-4 space-y-1 text-muted-foreground">
                      <li>• Check token expiration in Setup tab</li>
                      <li>• Test manual token refresh</li>
                      <li>• Verify refresh token is present</li>
                      <li>• Re-authorize Strava connection if needed</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
