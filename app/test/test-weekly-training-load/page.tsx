import { WeeklyTrainingLoadDebugger } from '@/components/debug/WeeklyTrainingLoadDebugger';
import { WeeklyTrainingLoadWidget } from '@/components/dashboard/WeeklyTrainingLoadWidget';
import { requireAuth } from '@/lib/auth/server';

export default async function TestWeeklyTrainingLoadPage() {
  const user = await requireAuth();

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Weekly Training Load Debug</h1>
        <p className="text-muted-foreground">
          This page helps debug issues with the weekly training load widget and
          progress calculation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Debug Information */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <WeeklyTrainingLoadDebugger userId={user.id} />
        </div>

        {/* Actual Widget */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Actual Widget</h2>
          <WeeklyTrainingLoadWidget userId={user.id} />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Troubleshooting Guide
        </h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>If progress isn&apos;t updating:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>
              Check if activities have TSS calculated (look for &quot;TSS
              Calculation Needed&quot; warning)
            </li>
            <li>Click &quot;Calculate TSS&quot; button if needed</li>
            <li>Verify activities are in the current week (Monday-Sunday)</li>
            <li>Check if target TSS is personalized correctly</li>
            <li>Try refreshing the data using the refresh button</li>
          </ul>

          <p className="mt-4">
            <strong>Common issues:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>
              Activities without TSS will show estimated values (less accurate)
            </li>
            <li>Week boundaries might not match your timezone</li>
            <li>Target TSS might be too high/low for your training level</li>
            <li>Cache might be stale - try refreshing</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
