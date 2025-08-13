import { requireAuth } from '@/lib/auth/server';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import ActivitiesFeedWithFilters from '@/components/dashboard/ActivitiesFeedWithFilters';

export default async function ActivitiesPage() {
  const user = await requireAuth();

  return (
    <DashboardLayout user={user}>
      <main className="w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Activity Feed</h1>
          <p className="text-muted-foreground">
            Browse and filter your recent activities. Use the filters to narrow
            down by type or status.
          </p>
        </div>
        <ActivitiesFeedWithFilters userId={user.id} />
      </main>
    </DashboardLayout>
  );
}
