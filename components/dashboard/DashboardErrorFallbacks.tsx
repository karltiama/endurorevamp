'use client';

import {
  TrainingReadinessSkeleton,
  TrainingLoadSkeleton,
  PerformanceInsightsSkeleton,
  QuickActionsSkeleton,
  GoalsSkeleton,
} from '@/components/dashboard/DashboardSkeletons';

// Error fallback components
export function TrainingReadinessErrorFallback() {
  return <TrainingReadinessSkeleton />;
}

export function TrainingLoadErrorFallback() {
  return <TrainingLoadSkeleton />;
}

export function PerformanceInsightsErrorFallback() {
  return <PerformanceInsightsSkeleton />;
}

export function QuickActionsErrorFallback() {
  return <QuickActionsSkeleton />;
}

export function GoalsErrorFallback() {
  return <GoalsSkeleton />;
}

// Hero error fallback components
export function ActivitiesHeroErrorFallback() {
  return (
    <div className="h-[200px] w-full animate-pulse bg-muted rounded-xl" />
  );
}

export function AnalyticsHeroErrorFallback() {
  return (
    <div className="h-[220px] w-full animate-pulse bg-muted rounded-xl" />
  );
}

export function TrainingHeroErrorFallback() {
  return (
    <div className="h-[220px] w-full animate-pulse bg-muted rounded-xl" />
  );
}

export function PlanningHeroErrorFallback() {
  return (
    <div className="h-[220px] w-full animate-pulse bg-muted rounded-xl" />
  );
}
