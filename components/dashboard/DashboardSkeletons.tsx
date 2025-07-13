import { Card, CardContent } from '@/components/ui/card'

export function TrainingReadinessSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-muted/50 rounded-lg mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </CardContent>
    </Card>
  )
}

export function TrainingLoadSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-20 bg-muted/50 rounded-lg mb-4"></div>
          <div className="h-16 bg-muted/50 rounded-lg"></div>
        </div>
      </CardContent>
    </Card>
  )
}

export function PerformanceInsightsSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="h-16 bg-muted/50 rounded-lg"></div>
            <div className="h-16 bg-muted/50 rounded-lg"></div>
          </div>
          <div className="h-12 bg-muted/50 rounded-lg"></div>
        </div>
      </CardContent>
    </Card>
  )
}

export function QuickActionsSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-muted/50 rounded-lg"></div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function GoalsSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/2 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted/50 rounded-lg"></div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 