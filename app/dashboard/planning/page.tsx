import { requireAuth } from '@/lib/auth/server';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { EnhancedWorkoutPlanningClient } from '@/components/planning/EnhancedWorkoutPlanningClient';
import { Suspense } from 'react';

export default async function PlanningPage() {
  const user = await requireAuth();

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Workout Planning
          </h1>
          <p className="text-muted-foreground">
            Get intelligent workout recommendations with modal editing.
            Customize your weekly plan through a simple, reliable interface
            based on your training load, goals, and preferences.
          </p>
        </div>

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
