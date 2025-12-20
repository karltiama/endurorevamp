import { requireAuth } from '@/lib/auth/server';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ActivitiesHero } from '@/components/dashboard/ActivitiesHero';
import ActivitiesFeedWithFilters from '@/components/dashboard/ActivitiesFeedWithFilters';
import { ActivitiesHeroErrorFallback } from '@/components/dashboard/DashboardErrorFallbacks';
import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default async function ActivitiesPage() {
  const user = await requireAuth();

  return (
    <DashboardLayout user={user}>
      <main className="w-full space-y-6">
        {/* Hero Section with Stats */}
        <ErrorBoundary fallback={ActivitiesHeroErrorFallback}>
          <Suspense
            fallback={
              <div className="h-[200px] w-full animate-pulse bg-muted rounded-xl" />
            }
          >
            <ActivitiesHero userId={user.id} />
          </Suspense>
        </ErrorBoundary>

        {/* Activity Feed with Filters */}
        <ActivitiesFeedWithFilters userId={user.id} />
      </main>
    </DashboardLayout>
  );
}
