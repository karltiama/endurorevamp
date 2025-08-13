import { FullSyncButton } from '@/components/strava/FullSyncButton';
import { SyncButton } from '@/components/strava/SyncButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestFullSyncPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Full Sync Test Page</h1>
        <p className="text-muted-foreground">
          Test the new full sync functionality with pagination
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Standard Sync */}
        <Card>
          <CardHeader>
            <CardTitle>Standard Sync (3 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <SyncButton />
          </CardContent>
        </Card>

        {/* Full Sync */}
        <Card>
          <CardHeader>
            <CardTitle>Full Historical Sync</CardTitle>
          </CardHeader>
          <CardContent>
            <FullSyncButton />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sync Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm space-y-2">
            <h3 className="font-medium">Standard Sync:</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Fetches last 3 months of activities (max 200)</li>
              <li>Fast sync for recent data</li>
              <li>Uses 1 sync from daily limit</li>
            </ul>
          </div>

          <div className="text-sm space-y-2">
            <h3 className="font-medium">Full Historical Sync:</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Fetches ALL activities using pagination</li>
              <li>May take several minutes for users with many activities</li>
              <li>
                Respects Strava API rate limits (1 second delay between pages)
              </li>
              <li>Uses 1 sync from daily limit</li>
              <li>Only adds new activities to database (no duplicates)</li>
            </ul>
          </div>

          <div className="text-sm space-y-2">
            <h3 className="font-medium">Rate Limits:</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>5 syncs per day maximum</li>
              <li>
                1 hour cooldown between syncs (if no new activities found)
              </li>
              <li>Strava API: 600 requests per 15 minutes</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
