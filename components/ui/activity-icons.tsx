import React from 'react'
import {
  Activity,
  Home,
  Bike,
  Dumbbell,
  Mountain,
  Zap
} from 'lucide-react'

interface ActivityIconProps {
  type: string
  trainer?: boolean
  className?: string
}

export function ActivityIcon({ type, trainer, className = "h-6 w-6" }: ActivityIconProps) {
  const t = type?.toLowerCase() || ''

  // Indoor run (treadmill)
  if (t === 'run' && trainer) return <Home className={className} />
  // Outdoor run
  if (t === 'run') return <Activity className={className} />
  // Ride (cycling)
  if (t === 'ride' || t === 'virtualride') return <Bike className={className} />
  // E-bike
  if (t === 'ebikeride') return <Zap className={className} />
  // Hike
  if (t === 'hike') return <Mountain className={className} />
  // Weight training / workout
  if (t === 'workout' || t === 'weighttraining') return <Dumbbell className={className} />
  // Fallbacks for swim, walk, etc.
  if (t === 'swim') return <span className={className} role="img" aria-label="Swim">🏊‍♂️</span>
  if (t === 'walk') return <span className={className} role="img" aria-label="Walk">🚶‍♂️</span>
  // Fallback: generic activity
  return <Activity className={className} />
}

// Alternative treadmill-specific icons
export function TreadmillIcon({ className = "h-6 w-6" }: { className?: string }) {
  return <Home className={className} />
}

export function SmartTreadmillIcon({ className = "h-6 w-6" }: { className?: string }) {
  return <Home className={className} />
}

export function IndoorRunIcon({ className = "h-6 w-6" }: { className?: string }) {
  return <Home className={className} />
} 