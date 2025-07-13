'use client'

import { 
  TrainingReadinessSkeleton,
  TrainingLoadSkeleton,
  PerformanceInsightsSkeleton,
  QuickActionsSkeleton,
  GoalsSkeleton
} from '@/components/dashboard/DashboardSkeletons'

// Error fallback components
export function TrainingReadinessErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return <TrainingReadinessSkeleton />
}

export function TrainingLoadErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return <TrainingLoadSkeleton />
}

export function PerformanceInsightsErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return <PerformanceInsightsSkeleton />
}

export function QuickActionsErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return <QuickActionsSkeleton />
}

export function GoalsErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return <GoalsSkeleton />
} 