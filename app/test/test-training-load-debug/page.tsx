import { requireAuth } from '@/lib/auth/server';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { TrainingLoadDebugger } from '@/components/debug/TrainingLoadDebugger';
import { DailyLoadDebugger } from '@/components/debug/DailyLoadDebugger';
import { SimpleButtonTest } from '@/components/debug/SimpleButtonTest';
import { SimplifiedDailyDebugger } from '@/components/debug/SimplifiedDailyDebugger';

export default async function TestTrainingLoadDebugPage() {
  const user = await requireAuth();

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Training Load Debug
          </h1>
          <p className="text-muted-foreground">
            Debug training load calculations and investigate double dates issue.
          </p>
        </div>

        <SimpleButtonTest />
        <SimplifiedDailyDebugger />
        <TrainingLoadDebugger />
        <DailyLoadDebugger />
      </div>
    </DashboardLayout>
  );
}
