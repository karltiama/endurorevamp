import { requireAuth } from '@/lib/auth/server';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { TrainingHero } from '@/components/dashboard/TrainingHero';
import ZoneAnalysisDashboard from '@/components/training/ZoneAnalysisDashboard';
import { TrainingLoadChartClient } from '@/components/training/TrainingLoadChartClient';
import { TrainingHeroErrorFallback } from '@/components/dashboard/DashboardErrorFallbacks';
import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default async function TrainingPage() {
  const user = await requireAuth();

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Hero Section with Training Overview */}
        <ErrorBoundary fallback={TrainingHeroErrorFallback}>
          <Suspense
            fallback={
              <div className="h-[220px] w-full animate-pulse bg-muted rounded-xl" />
            }
          >
            <TrainingHero userId={user.id} />
          </Suspense>
        </ErrorBoundary>

        {/* Training Load Analysis */}
        <Suspense fallback={<TrainingLoadSkeleton />}>
          <TrainingLoadChartClient />
        </Suspense>

        {/* Zone Analysis Section */}
        <Suspense fallback={<ZoneAnalysisSkeleton />}>
          <ZoneAnalysisDashboard />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}

function ZoneAnalysisSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
        <div className="h-64 bg-gray-100 rounded-lg"></div>
      </div>
    </div>
  );
}

function TrainingLoadSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="flex gap-2 mb-6">
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-18"></div>
        </div>
        <div className="h-96 bg-gray-100 rounded-lg"></div>
      </div>
    </div>
  );
}
