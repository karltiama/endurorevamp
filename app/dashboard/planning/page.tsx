import { requireAuth } from '@/lib/auth/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { WorkoutPlanningClient } from '@/components/planning/WorkoutPlanningClient'
import { Suspense } from 'react'

export default async function PlanningPage() {
  const user = await requireAuth()

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workout Planning</h1>
          <p className="text-muted-foreground">
            Get smart workout recommendations based on your training load and goals.
          </p>
        </div>

        <Suspense fallback={<WorkoutPlanningSkeleton />}>
          <WorkoutPlanningClient />
        </Suspense>
      </div>
    </DashboardLayout>
  )
}

function WorkoutPlanningSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-96 bg-muted rounded-lg animate-pulse" />
        <div className="h-96 bg-muted rounded-lg animate-pulse" />
      </div>
      <div className="h-64 bg-muted rounded-lg animate-pulse" />
    </div>
  )
} 