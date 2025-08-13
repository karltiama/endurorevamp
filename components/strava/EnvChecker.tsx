'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

export function EnvChecker() {
  const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
  const hasClientId = !!clientId;

  return (
    <Card>
      <CardHeader>
        <CardTitle>⚙️ Environment Configuration</CardTitle>
        <CardDescription>
          Check if your Strava OAuth environment variables are configured
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {hasClientId ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="font-medium">Client ID</span>
            </div>
            <div className="text-sm text-gray-600">
              {hasClientId
                ? `Configured (${clientId?.substring(0, 8)}...)`
                : 'Not configured'}
            </div>
          </div>

          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Client Secret</span>
            </div>
            <div className="text-sm text-gray-600">
              Server-side only (cannot check from client)
            </div>
          </div>
        </div>

        {!hasClientId && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Missing Configuration:</strong>
              <div className="mt-2">
                <p>
                  You need to set up your Strava OAuth environment variables:
                </p>
                <ol className="mt-2 list-decimal list-inside space-y-1 text-sm">
                  <li>
                    Go to{' '}
                    <a
                      href="https://www.strava.com/settings/api"
                      className="underline text-blue-600"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Strava API Settings
                    </a>
                  </li>
                  <li>
                    Create a Strava application if you haven&apos;t already
                  </li>
                  <li>
                    Add these to your{' '}
                    <code className="bg-gray-100 px-1 rounded">.env.local</code>{' '}
                    file:
                  </li>
                </ol>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs">
                  {`NEXT_PUBLIC_STRAVA_CLIENT_ID=your_client_id_here
STRAVA_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_STRAVA_REDIRECT_URI=http://localhost:3000/dashboard`}
                </pre>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {hasClientId && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Environment variables appear to be configured correctly. If
              you&apos;re still having issues, check:
              <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                <li>
                  Your Strava app&apos;s Authorization Callback Domain is set to
                  your domain
                </li>
                <li>
                  Your STRAVA_CLIENT_SECRET is correctly set in .env.local
                </li>
                <li>
                  You&apos;ve restarted the development server after adding env
                  vars
                </li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
