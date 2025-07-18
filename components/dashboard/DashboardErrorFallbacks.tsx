'use client'

import { 
  TrainingReadinessSkeleton,
  TrainingLoadSkeleton,
  PerformanceInsightsSkeleton,
  QuickActionsSkeleton,
  GoalsSkeleton
} from '@/components/dashboard/DashboardSkeletons'

// Error fallback components
export function TrainingReadinessErrorFallback() {
  return <TrainingReadinessSkeleton />
}

export function TrainingLoadErrorFallback() {
  return <TrainingLoadSkeleton />
}

export function PerformanceInsightsErrorFallback() {
  return <PerformanceInsightsSkeleton />
}

export function QuickActionsErrorFallback() {
  return <QuickActionsSkeleton />
}

export function GoalsErrorFallback() {
  return <GoalsSkeleton />
} 