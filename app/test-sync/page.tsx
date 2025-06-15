import { SyncDebugger } from '@/components/strava/SyncDebugger';
import { SyncButton } from '@/components/strava/SyncButton';
import { SupabaseTestButton } from '@/components/strava/SupabaseTestButton';
import { StravaConnectionTester } from '@/components/strava/StravaConnectionTester';
import { EnvChecker } from '@/components/strava/EnvChecker';
import { OAuthFlowTester } from '@/components/strava/OAuthFlowTester';

export default function TestSyncPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Strava Sync Testing</h1>
        <p className="text-gray-600 mt-2">
          Use these tools to diagnose and test your Strava sync functionality
        </p>
      </div>

      {/* Environment Check - Must be first */}
      <div className="mb-6">
        <EnvChecker />
      </div>

      {/* OAuth Flow Tester - Test the exact flow */}
      <div className="mb-6">
        <OAuthFlowTester />
      </div>

      {/* Connection Tester - Put this second since it's the most likely issue */}
      <div className="mb-8">
        <StravaConnectionTester />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold mb-4">🛠️ Sync Debugger</h2>
          <p className="text-sm text-gray-600 mb-4">
            Run comprehensive diagnostics on your Strava integration
          </p>
          <SyncDebugger />
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">🔄 Sync Button</h2>
            <p className="text-sm text-gray-600 mb-4">
              Test your sync functionality (now using the working API route approach)
            </p>
            <div className="max-w-md">
              <SyncButton />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">🗄️ Database Test</h2>
            <p className="text-sm text-gray-600 mb-4">
              Test Supabase database connectivity and data access
            </p>
            <div className="max-w-md">
              <SupabaseTestButton />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="font-semibold text-yellow-800">🔍 Debugging Tips</h3>
        <ul className="mt-2 text-sm text-yellow-700 space-y-1">
          <li>• Open browser DevTools (F12) and check the Console tab for detailed logs</li>
          <li>• Use the Sync Debugger to identify which step is failing</li>
          <li>• Check the Network tab to see if API calls are being made correctly</li>
          <li>• Look for authentication errors or expired tokens</li>
          <li>• Verify your Strava app permissions include activity:read_all</li>
        </ul>
      </div>
    </div>
  );
} 