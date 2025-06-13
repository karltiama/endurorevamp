'use client'

import { TrainingLoadChart } from './TrainingLoadChart'
import { useAuth } from '@/providers/AuthProvider'

interface TrainingLoadChartClientProps {
  className?: string
}

export function TrainingLoadChartClient({ className }: TrainingLoadChartClientProps) {
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

  return <TrainingLoadChart userId={user.id} className={className} />
} 