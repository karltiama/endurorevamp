import { requireAuth } from '@/lib/auth/server';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PlanningHeroWrapper } from '@/components/planning/PlanningHeroWrapper';
import { EnhancedWorkoutPlanningClient } from '@/components/planning/EnhancedWorkoutPlanningClient';
import { PlanningHeroErrorFallback } from '@/components/dashboard/DashboardErrorFallbacks';
import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default async function PlanningPage() {
  const user = await requireAuth();

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Hero Section with Weekly Plan Overview */}
        <ErrorBoundary fallback={PlanningHeroErrorFallback}>
          <Suspense
            fallback={
              <div className="h-[220px] w-full animate-pulse bg-muted rounded-xl" />
            }
          >
            <PlanningHeroWrapper userId={user.id} />
          </Suspense>
        </ErrorBoundary>

        <Suspense fallback={<EnhancedWorkoutPlanningSkeleton />}>
          <EnhancedWorkoutPlanningClient />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}

function EnhancedWorkoutPlanningSkeleton() {
  return (
    <div className="space-y-6">
      {/* Today's Workout Skeleton */}
      <div className="h-64 bg-muted rounded-lg animate-pulse" />

      {/* Weekly Plan Skeleton */}
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>

      {/* Analytics Skeleton */}
      <div className="h-32 bg-muted rounded-lg animate-pulse" />
    </div>
  );
}
