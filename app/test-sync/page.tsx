import { SyncDebugger } from '@/components/strava/SyncDebugger';
import { SyncButton } from '@/components/strava/SyncButton';
import { StravaConnectionTester } from '@/components/strava/StravaConnectionTester';
import { EnvChecker } from '@/components/strava/EnvChecker';
import { OAuthFlowTester } from '@/components/strava/OAuthFlowTester';
import { DevFooter } from '@/components/dev/DevFooter';
import { DatabaseSchemaChecker } from '@/components/debug/DatabaseSchemaChecker';
import { DetailedSyncDebugger } from '@/components/debug/DetailedSyncDebugger';
import { StravaDataAnalyzer } from '@/components/debug/StravaDataAnalyzer';
import { SchemaComparisonAnalyzer } from '@/components/debug/SchemaComparisonAnalyzer';
import { CoreDataValidator } from '@/components/debug/CoreDataValidator';
import { SyncProcessDebugger } from '@/components/debug/SyncProcessDebugger';
import SyncDashboard from '@/components/dashboard/SyncDashboard';
import { redirect } from 'next/navigation';

export default function TestSyncPage() {
  // Redirect to home in production
  if (process.env.NODE_ENV === 'production') {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Development Environment Warning */}
      <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-orange-800">Development Environment</span>
        </div>
        <p className="text-sm text-orange-700 mt-1">
          This testing page is only available in development mode and will not be accessible in production.
        </p>
      </div>

      <div className="text-center">
        <h1 className="text-3xl font-bold">Strava Sync Testing</h1>
        <p className="text-gray-600 mt-2">
          Comprehensive testing tools for your Strava integration
        </p>
      </div>

      {/* Layer 1: Configuration Check */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">⚙️ Layer 1: Configuration</h2>
        <div className="w-full max-w-4xl mx-auto">
          <EnvChecker />
        </div>
      </div>

      {/* Layer 2: OAuth Authentication Flow */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">🔐 Layer 2: OAuth Authentication</h2>
        <div className="w-full max-w-4xl mx-auto">
          <OAuthFlowTester />
        </div>
      </div>

      {/* Layer 3: Connection & Database */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">🗄️ Layer 3: Connection & Database</h2>
        <div className="w-full max-w-4xl mx-auto space-y-6">
          <CoreDataValidator />
          <StravaConnectionTester />
          <SchemaComparisonAnalyzer />
          <DatabaseSchemaChecker />
          <StravaDataAnalyzer />
        </div>
      </div>

      {/* Layer 4: Sync Functionality */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">🔄 Layer 4: Sync Functionality</h2>
        <div className="w-full max-w-4xl mx-auto space-y-6">
          <DetailedSyncDebugger />
          
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-base font-medium mb-4">🛠️ Diagnostic Sync (Client-side)</h3>
              <p className="text-sm text-gray-600 mb-4">
                Step-by-step diagnostics using the client-side approach
              </p>
              <SyncDebugger />
            </div>

            <div>
              <h3 className="text-base font-medium mb-4">✅ Production Sync (API Route)</h3>
              <p className="text-sm text-gray-600 mb-4">
                Test the working API route-based sync functionality
              </p>
              <div className="w-full">
                <SyncButton />
              </div>
            </div>
          </div>

          {/* New Step-by-Step Debugger */}
          <div className="mt-6">
            <h3 className="text-base font-medium mb-4">🔍 Step-by-Step Process Debugger</h3>
            <p className="text-sm text-gray-600 mb-4">
              Comprehensive debugging tool that traces through each stage of the sync process
            </p>
            <SyncProcessDebugger />
          </div>

          <div className="mt-6">
            <h3 className="text-base font-medium mb-4">🎯 Simplified Sync Dashboard</h3>
            <p className="text-sm text-gray-600 mb-4">
              Test the simplified sync interface for settings page
            </p>
            <SyncDashboard />
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-800">🔍 Testing Flow</h3>
        <ol className="mt-2 text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li><strong>Configuration:</strong> Verify environment variables are set correctly</li>
          <li><strong>OAuth:</strong> Test complete authentication flow with real Strava redirect</li>
          <li><strong>Database:</strong> Validate connection status and token storage</li>
          <li><strong>Sync:</strong> Compare diagnostic vs production sync approaches</li>
        </ol>
        <p className="mt-3 text-xs text-blue-600">
          💡 Each layer tests a different part of the data flow. If a layer fails, fix it before testing the next layer.
        </p>
      </div>

      <DevFooter />
    </div>
  );
} 