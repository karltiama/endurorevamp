import { useQuery } from '@tanstack/react-query';
import { Activity } from '@/lib/strava/types';
import {
  TrainingLoadCalculator,
  TrainingLoadPoint,
  TrainingLoadMetrics,
  AthleteThresholds,
  estimateAthleteThresholds,
} from '@/lib/training/training-load';
import { useUserActivities } from './use-user-activities';

interface UseTrainingLoadOptions {
  days?: number;
  enableCalculations?: boolean;
}

interface TrainingLoadData {
  loadPoints: TrainingLoadPoint[];
  metrics: TrainingLoadMetrics;
  athleteThresholds: AthleteThresholds;
  calculator: TrainingLoadCalculator;
  totalActivities: number;
  activitiesWithHR: number;
  activitiesWithPower: number;
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'none';
}

export function useTrainingLoad(
  userId: string,
  options: UseTrainingLoadOptions = {}
) {
  const { days = 90, enableCalculations = true } = options;

  // First get the activities
  const {
    data: activities = [],
    isLoading: activitiesLoading,
    error: activitiesError,
  } = useUserActivities(userId);

  // Process training load data
  const {
    data: trainingLoadData,
    isLoading: processingLoading,
    error: processingError,
  } = useQuery({
    queryKey: ['training-load', userId, days, activities.length],
    queryFn: () => processTrainingLoadData(activities, days),
    enabled: enableCalculations && activities.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  return {
    data: trainingLoadData,
    isLoading: activitiesLoading || processingLoading,
    error: activitiesError || processingError,
    hasData: trainingLoadData && trainingLoadData.totalActivities > 0,
    hasHRData: trainingLoadData && trainingLoadData.activitiesWithHR > 0,
    hasPowerData: trainingLoadData && trainingLoadData.activitiesWithPower > 0,
  };
}

/**
 * Process activities into training load data
 */
async function processTrainingLoadData(
  activities: Activity[],
  days: number
): Promise<TrainingLoadData> {
  // Filter activities to the specified time period
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const recentActivities = activities.filter(activity => {
    const activityDate = new Date(activity.start_date_local);
    return activityDate >= cutoffDate;
  });

  // Estimate athlete thresholds from all available data
  const athleteThresholds = estimateAthleteThresholds(activities);

  // Create calculator with thresholds
  const calculator = new TrainingLoadCalculator(athleteThresholds);

  // Process activities into load points
  const loadPoints = calculator.processActivities(recentActivities);

  // Calculate metrics
  const metrics = calculator.calculateLoadMetrics(loadPoints);

  // Calculate data quality stats
  const totalActivities = recentActivities.length;
  const activitiesWithHR = recentActivities.filter(
    a => a.has_heartrate && a.average_heartrate
  ).length;
  const activitiesWithPower = recentActivities.filter(
    a => a.average_watts
  ).length;

  const dataQuality = assessDataQuality(
    activitiesWithHR,
    activitiesWithPower,
    totalActivities
  );

  return {
    loadPoints,
    metrics,
    athleteThresholds,
    calculator,
    totalActivities,
    activitiesWithHR,
    activitiesWithPower,
    dataQuality,
  };
}

/**
 * Assess overall data quality for training load calculations
 */
function assessDataQuality(
  activitiesWithHR: number,
  activitiesWithPower: number,
  totalActivities: number
): 'excellent' | 'good' | 'fair' | 'poor' | 'none' {
  if (totalActivities === 0) return 'none';

  const hrPercentage = (activitiesWithHR / totalActivities) * 100;
  const powerPercentage = (activitiesWithPower / totalActivities) * 100;

  // Excellent: High HR coverage + some power data
  if (hrPercentage >= 80 && powerPercentage >= 20 && totalActivities >= 20) {
    return 'excellent';
  }

  // Good: Good HR coverage or decent power data
  if (
    (hrPercentage >= 60 && totalActivities >= 15) ||
    (powerPercentage >= 40 && totalActivities >= 10)
  ) {
    return 'good';
  }

  // Fair: Some HR data or activities
  if (hrPercentage >= 30 || totalActivities >= 10) {
    return 'fair';
  }

  // Poor: Little data available
  if (hrPercentage >= 10 || totalActivities >= 5) {
    return 'poor';
  }

  return 'none';
}

/**
 * Hook for getting training load for a specific date range
 */
export function useTrainingLoadRange(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  const { data: activities = [] } = useUserActivities(userId);

  return useQuery({
    queryKey: [
      'training-load-range',
      userId,
      startDate.toISOString(),
      endDate.toISOString(),
    ],
    queryFn: async () => {
      const filteredActivities = activities.filter((activity: Activity) => {
        const activityDate = new Date(activity.start_date_local);
        return activityDate >= startDate && activityDate <= endDate;
      });

      const athleteThresholds = estimateAthleteThresholds(activities);
      const calculator = new TrainingLoadCalculator(athleteThresholds);

      return calculator.processActivities(filteredActivities);
    },
    enabled: activities.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for getting training load trends over time
 */
export function useTrainingLoadTrends(userId: string, days: number = 180) {
  const { data: trainingLoadData } = useTrainingLoad(userId, { days });

  return useQuery({
    queryKey: [
      'training-load-trends',
      userId,
      days,
      trainingLoadData?.loadPoints.length,
    ],
    queryFn: () =>
      calculateTrainingLoadTrends(trainingLoadData?.loadPoints || [], days),
    enabled: !!trainingLoadData, // Enable even if loadPoints is empty to show rest days
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Calculate training load trends for visualization
 * Fills in all days in the date range (including rest days with 0 load)
 * and calculates rolling averages over actual calendar days
 */
function calculateTrainingLoadTrends(
  loadPoints: TrainingLoadPoint[],
  days: number = 90
) {
  // Even if loadPoints is empty, we should still return data for the date range
  // to show rest days and allow the chart to display properly

  // Create a map of date -> load point for quick lookup
  // Handle both date formats: "2024-01-15" and "2024-01-15T00:00:00Z"
  const loadPointMap = new Map<string, TrainingLoadPoint>();
  loadPoints.forEach(point => {
    // Extract just the date part (YYYY-MM-DD) for consistent lookup
    const dateKey = point.date.split('T')[0];
    loadPointMap.set(dateKey, point);
  });

  // Calculate date range: last N days from today
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (days - 1)); // Include today, so (days - 1) back

  // Fill in all days in the range
  const allDays: Array<{ date: string; point: TrainingLoadPoint | null }> = [];
  const currentDate = new Date(startDate);

  while (currentDate <= today) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const point = loadPointMap.get(dateStr) || null;

    // Create a zero-load point for rest days
    const zeroPoint: TrainingLoadPoint = {
      date: dateStr,
      trimp: 0,
      tss: 0,
      normalizedLoad: 0,
    };

    allDays.push({
      date: dateStr,
      point: point || zeroPoint,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Calculate rolling averages over actual calendar days
  const trends = allDays.map((day, index) => {
    const point = day.point!;
    const date = new Date(day.date);

    // 7-day rolling average (ATL) - over actual calendar days
    const sevenDaysAgo = new Date(date);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // Include today, so 6 days back

    const sevenDayPoints = allDays
      .filter(d => {
        const dDate = new Date(d.date);
        return dDate >= sevenDaysAgo && dDate <= date;
      })
      .map(d => d.point!);

    const atl =
      sevenDayPoints.reduce((sum, p) => sum + p.normalizedLoad, 0) /
      sevenDayPoints.length;

    // 42-day rolling average (CTL) - over actual calendar days
    const fortyTwoDaysAgo = new Date(date);
    fortyTwoDaysAgo.setDate(fortyTwoDaysAgo.getDate() - 41); // Include today, so 41 days back

    const fortyTwoDayPoints = allDays
      .filter(d => {
        const dDate = new Date(d.date);
        return dDate >= fortyTwoDaysAgo && dDate <= date;
      })
      .map(d => d.point!);

    const ctl =
      fortyTwoDayPoints.reduce((sum, p) => sum + p.normalizedLoad, 0) /
      fortyTwoDayPoints.length;

    // Training Stress Balance
    const tsb = ctl - atl;

    return {
      date: day.date,
      dailyLoad: point.normalizedLoad,
      atl: Math.round(atl),
      ctl: Math.round(ctl),
      tsb: Math.round(tsb),
      trimp: point.trimp,
      tss: point.tss,
    };
  });

  return trends;
}
