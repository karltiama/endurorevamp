import { useQuery } from '@tanstack/react-query'
import { Activity } from '@/lib/strava/types'
import { 
  TrainingLoadCalculator, 
  TrainingLoadPoint, 
  TrainingLoadMetrics,
  AthleteThresholds,
  estimateAthleteThresholds 
} from '@/lib/training/training-load'
import { useUserActivities } from './use-user-activities'

interface UseTrainingLoadOptions {
  days?: number
  enableCalculations?: boolean
}

interface TrainingLoadData {
  loadPoints: TrainingLoadPoint[]
  metrics: TrainingLoadMetrics
  athleteThresholds: AthleteThresholds
  calculator: TrainingLoadCalculator
  totalActivities: number
  activitiesWithHR: number
  activitiesWithPower: number
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'none'
}

export function useTrainingLoad(
  userId: string, 
  options: UseTrainingLoadOptions = {}
) {
  const { days = 90, enableCalculations = true } = options
  
  // First get the activities
  const { 
    data: activities = [], 
    isLoading: activitiesLoading,
    error: activitiesError 
  } = useUserActivities(userId)

  // Process training load data
  const { 
    data: trainingLoadData, 
    isLoading: processingLoading,
    error: processingError 
  } = useQuery({
    queryKey: ['training-load', userId, days, activities.length],
    queryFn: () => processTrainingLoadData(activities, days),
    enabled: enableCalculations && activities.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })

  return {
    data: trainingLoadData,
    isLoading: activitiesLoading || processingLoading,
    error: activitiesError || processingError,
    hasData: trainingLoadData && trainingLoadData.totalActivities > 0,
    hasHRData: trainingLoadData && trainingLoadData.activitiesWithHR > 0,
    hasPowerData: trainingLoadData && trainingLoadData.activitiesWithPower > 0,
  }
}

/**
 * Process activities into training load data
 */
async function processTrainingLoadData(
  activities: Activity[], 
  days: number
): Promise<TrainingLoadData> {
  // Filter activities to the specified time period
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  
  const recentActivities = activities.filter(activity => {
    const activityDate = new Date(activity.start_date_local)
    return activityDate >= cutoffDate
  })

  // Estimate athlete thresholds from all available data
  const athleteThresholds = estimateAthleteThresholds(activities)
  
  // Create calculator with thresholds
  const calculator = new TrainingLoadCalculator(athleteThresholds)
  
  // Process activities into load points
  const loadPoints = calculator.processActivities(recentActivities)
  
  // Calculate metrics
  const metrics = calculator.calculateLoadMetrics(loadPoints)
  
  // Calculate data quality stats
  const totalActivities = recentActivities.length
  const activitiesWithHR = recentActivities.filter(a => a.has_heartrate && a.average_heartrate).length
  const activitiesWithPower = recentActivities.filter(a => a.average_watts).length
  
  const dataQuality = assessDataQuality(activitiesWithHR, activitiesWithPower, totalActivities)

  return {
    loadPoints,
    metrics,
    athleteThresholds,
    calculator,
    totalActivities,
    activitiesWithHR,
    activitiesWithPower,
    dataQuality
  }
}

/**
 * Assess overall data quality for training load calculations
 */
function assessDataQuality(
  activitiesWithHR: number, 
  activitiesWithPower: number, 
  totalActivities: number
): 'excellent' | 'good' | 'fair' | 'poor' | 'none' {
  if (totalActivities === 0) return 'none'
  
  const hrPercentage = (activitiesWithHR / totalActivities) * 100
  const powerPercentage = (activitiesWithPower / totalActivities) * 100
  
  // Excellent: High HR coverage + some power data
  if (hrPercentage >= 80 && powerPercentage >= 20 && totalActivities >= 20) {
    return 'excellent'
  }
  
  // Good: Good HR coverage or decent power data
  if ((hrPercentage >= 60 && totalActivities >= 15) || (powerPercentage >= 40 && totalActivities >= 10)) {
    return 'good'
  }
  
  // Fair: Some HR data or activities
  if (hrPercentage >= 30 || totalActivities >= 10) {
    return 'fair'
  }
  
  // Poor: Little data available
  if (hrPercentage >= 10 || totalActivities >= 5) {
    return 'poor'
  }
  
  return 'none'
}

/**
 * Hook for getting training load for a specific date range
 */
export function useTrainingLoadRange(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  const { data: activities = [] } = useUserActivities(userId)
  
  return useQuery({
    queryKey: ['training-load-range', userId, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
             const filteredActivities = activities.filter((activity: Activity) => {
         const activityDate = new Date(activity.start_date_local)
         return activityDate >= startDate && activityDate <= endDate
       })
      
      const athleteThresholds = estimateAthleteThresholds(activities)
      const calculator = new TrainingLoadCalculator(athleteThresholds)
      
      return calculator.processActivities(filteredActivities)
    },
    enabled: activities.length > 0,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook for getting training load trends over time
 */
export function useTrainingLoadTrends(userId: string, days: number = 180) {
  const { data: trainingLoadData } = useTrainingLoad(userId, { days })
  
  return useQuery({
    queryKey: ['training-load-trends', userId, days, trainingLoadData?.loadPoints.length],
    queryFn: () => calculateTrainingLoadTrends(trainingLoadData?.loadPoints || []),
    enabled: !!trainingLoadData && trainingLoadData.loadPoints.length > 0,
    staleTime: 10 * 60 * 1000,
  })
}

/**
 * Calculate training load trends for visualization
 * Now works with aggregated daily load points
 */
function calculateTrainingLoadTrends(loadPoints: TrainingLoadPoint[]) {
  if (loadPoints.length === 0) return []
  
  // Calculate rolling averages for different time windows
  const trends = loadPoints.map((point, index) => {
    const date = new Date(point.date)
    
    // 7-day rolling average (ATL) - exponentially weighted
    const sevenDayStart = Math.max(0, index - 6)
    const sevenDayPoints = loadPoints.slice(sevenDayStart, index + 1)
    const atl = sevenDayPoints.reduce((sum, p) => sum + p.normalizedLoad, 0) / sevenDayPoints.length
    
    // 42-day rolling average (CTL) - exponentially weighted
    const fortyTwoDayStart = Math.max(0, index - 41)
    const fortyTwoDayPoints = loadPoints.slice(fortyTwoDayStart, index + 1)
    const ctl = fortyTwoDayPoints.reduce((sum, p) => sum + p.normalizedLoad, 0) / fortyTwoDayPoints.length
    
    // Training Stress Balance
    const tsb = ctl - atl
    
    return {
      date: date.toISOString().split('T')[0],
      dailyLoad: point.normalizedLoad,
      atl: Math.round(atl),
      ctl: Math.round(ctl),
      tsb: Math.round(tsb),
      trimp: point.trimp,
      tss: point.tss
    }
  })
  
  return trends
} 