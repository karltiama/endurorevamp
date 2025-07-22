'use client'

import { useAuth } from '@/providers/AuthProvider'
import { EnhancedWorkoutPlanningDashboard } from './EnhancedWorkoutPlanningDashboard'

interface EnhancedWorkoutPlanningClientProps {
  className?: string
}

export function EnhancedWorkoutPlanningClient({ className }: EnhancedWorkoutPlanningClientProps) {
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

  return <EnhancedWorkoutPlanningDashboard userId={user.id} className={className} />
} 