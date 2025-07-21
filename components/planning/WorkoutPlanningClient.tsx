'use client'

import { useAuth } from '@/providers/AuthProvider'
import { WorkoutPlanningDashboard } from './WorkoutPlanningDashboard'

interface WorkoutPlanningClientProps {
  className?: string
}

export function WorkoutPlanningClient({ className }: WorkoutPlanningClientProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className={`${className} animate-pulse`}>
        <div className="bg-muted rounded-lg h-96" />
      </div>
    )
  }

  if (!user?.id) {
    return null
  }

  return <WorkoutPlanningDashboard userId={user.id} className={className} />
} 