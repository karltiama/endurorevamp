import { Activity } from '@/lib/strava/types'
import { ActivityWithTrainingData } from '@/types'
import { createClient } from '@/lib/supabase/client'

// Training Load interfaces
export interface TrainingLoadPoint {
  date: string
  trimp: number
  tss: number
  normalizedLoad: number
  activity?: {
    name: string
    sport_type: string
    duration: number
    avgHR?: number
    avgPower?: number
  }
}

export interface TrainingLoadMetrics {
  acute: number        // 7-day average (ATL)
  chronic: number      // 42-day average (CTL) 
  balance: number      // TSB = CTL - ATL
  rampRate: number     // Weekly CTL change
  status: 'peak' | 'maintain' | 'build' | 'recover'
  recommendation: string
}

export interface AthleteThresholds {
  maxHeartRate: number
  restingHeartRate: number
  functionalThresholdPower?: number
  lactateThreshold?: number
  weight?: number
}

// Sport-specific multipliers for TRIMP calculation
const SPORT_MULTIPLIERS = {
  'Run': 1.0,
  'Ride': 0.85,        // Cycling typically lower intensity for same HR
  'VirtualRide': 0.85,
  'Swim': 1.1,         // Swimming often higher intensity
  'Hike': 0.7,
  'Walk': 0.5,
  'Workout': 0.9,
  'WeightTraining': 0.8,
  'Yoga': 0.6,
  'CrossCountrySkiing': 1.0,
  'AlpineSki': 0.8,
  'Snowboard': 0.8,
  'IceSkate': 0.9,
  'InlineSkate': 0.9,
  'Rowing': 1.0,
  'Kayaking': 0.9,
  'Canoeing': 0.9,
  'StandUpPaddling': 0.8,
  'Surfing': 0.7,
  'Kitesurf': 0.8,
  'Windsurf': 0.8,
  'Soccer': 1.0,
  'Tennis': 0.9,
  'Basketball': 0.95,
  'Badminton': 0.9,
  'Golf': 0.4,
  'RockClimbing': 0.9,
  'Default': 0.8
}

// Enhanced weight training multipliers based on exercise type
const WEIGHT_TRAINING_MULTIPLIERS = {
  'strength': 0.7,      // Low rep, high intensity (1-5 reps)
  'hypertrophy': 0.8,   // Moderate rep range (6-12 reps)
  'endurance': 0.9,     // High rep, low intensity (15+ reps)
  'power': 0.75,        // Explosive movements
  'circuit': 1.0,       // High intensity circuit training
  'default': 0.8
}

export class TrainingLoadCalculator {
  private athleteThresholds: AthleteThresholds

  constructor(athleteThresholds: AthleteThresholds) {
    this.athleteThresholds = athleteThresholds
  }

  /**
   * Calculate TRIMP (Training Impulse) for an activity
   * Uses Banister's TRIMP formula with exponential heart rate weighting
   */
  calculateTRIMP(activity: Activity): number {
    // Require heart rate data for TRIMP
    if (!activity.has_heartrate || !activity.average_heartrate || !activity.moving_time) {
      return 0
    }

    const duration = activity.moving_time / 60 // Convert to minutes
    const avgHR = activity.average_heartrate
    const maxHR = this.athleteThresholds.maxHeartRate
    const restHR = this.athleteThresholds.restingHeartRate

    // Calculate heart rate reserve ratio
    const hrReserve = (avgHR - restHR) / (maxHR - restHR)
    const hrRatio = Math.max(0, Math.min(1, hrReserve)) // Clamp between 0-1

    // Exponential weighting factor based on gender (using 1.92 as general coefficient)
    const exponentialFactor = 1.92
    const intensityFactor = hrRatio * exponentialFactor

    // Base TRIMP calculation
    let trimp = duration * hrRatio * (0.64 * Math.exp(intensityFactor))

    // Apply sport-specific multiplier
    const sportMultiplier = SPORT_MULTIPLIERS[activity.sport_type as keyof typeof SPORT_MULTIPLIERS] || SPORT_MULTIPLIERS.Default
    trimp *= sportMultiplier

    return Math.round(trimp)
  }

  /**
   * Calculate weight training-specific load
   * Considers exercise type, intensity, and neuromuscular stress
   */
  calculateWeightTrainingLoad(activity: ActivityWithTrainingData): number {
    const duration = activity.moving_time / 60 // minutes
    
    // Base calculation using heart rate if available
    let baseLoad = 0
    
    if (activity.has_heartrate && activity.average_heartrate) {
      const avgHR = activity.average_heartrate
      const maxHR = this.athleteThresholds.maxHeartRate
      const restHR = this.athleteThresholds.restingHeartRate
      
      // Heart rate reserve ratio
      const hrReserve = (avgHR - restHR) / (maxHR - restHR)
      const hrRatio = Math.max(0, Math.min(1, hrReserve))
      
      // Weight training typically has lower HR but higher neuromuscular stress
      const neuromuscularFactor = 1.3 // Compensate for lower HR in strength training
      baseLoad = duration * hrRatio * neuromuscularFactor
    } else {
      // Fallback: duration-based estimation
      baseLoad = duration * 0.8 // Moderate intensity assumption
    }
    
    // Determine exercise type from activity name or use default
    const exerciseType = this.determineWeightTrainingType(activity)
    const typeMultiplier = WEIGHT_TRAINING_MULTIPLIERS[exerciseType] || WEIGHT_TRAINING_MULTIPLIERS.default
    
    // Apply intensity adjustments based on RPE if available
    let intensityMultiplier = 1.0
    if (activity.perceived_exertion) {
      // RPE 1-10 scale to intensity multiplier
      intensityMultiplier = 0.5 + (activity.perceived_exertion / 10) * 0.8 // 0.5 to 1.3 range
    }
    
    const finalLoad = baseLoad * typeMultiplier * intensityMultiplier
    return Math.round(finalLoad)
  }

  /**
   * Determine weight training type from activity name
   */
  private determineWeightTrainingType(activity: ActivityWithTrainingData): keyof typeof WEIGHT_TRAINING_MULTIPLIERS {
    const name = activity.name.toLowerCase()
    
    // Circuit training indicators
    if (name.includes('circuit') || name.includes('hiit') || name.includes('crossfit')) {
      return 'circuit'
    }
    
    // Power training indicators
    if (name.includes('power') || name.includes('clean') || name.includes('snatch') || 
        name.includes('jerk') || name.includes('plyo')) {
      return 'power'
    }
    
    // Strength training indicators (low rep, high weight)
    if (name.includes('strength') || name.includes('max') || name.includes('1rm') || 
        name.includes('heavy') || name.includes('3x5') || name.includes('5x5')) {
      return 'strength'
    }
    
    // Endurance training indicators (high rep, low weight)
    if (name.includes('endurance') || name.includes('light') || name.includes('15+') || 
        name.includes('20+') || name.includes('burnout')) {
      return 'endurance'
    }
    
    // Default to hypertrophy (moderate rep range)
    return 'hypertrophy'
  }

  /**
   * Calculate TSS (Training Stress Score) for an activity
   * Power-based when available, HR-based otherwise
   */
  calculateTSS(activity: Activity): number {
    const duration = activity.moving_time / 3600 // Convert to hours

    // Power-based TSS (preferred when available)
    if (activity.average_watts && this.athleteThresholds.functionalThresholdPower) {
      const avgPower = activity.average_watts
      const ftp = this.athleteThresholds.functionalThresholdPower
      const intensityFactor = avgPower / ftp
      const normalizedPower = avgPower * this.calculateVariabilityIndex(activity)
      
      // TSS = (seconds * NP * IF) / (FTP * 3600) * 100
      const tss = (activity.moving_time * normalizedPower * intensityFactor) / (ftp * 3600) * 100
      return Math.round(Math.max(0, tss))
    }

    // Heart rate-based TSS (fallback)
    if (activity.has_heartrate && activity.average_heartrate) {
      const avgHR = activity.average_heartrate
      const maxHR = this.athleteThresholds.maxHeartRate
      const lthr = this.athleteThresholds.lactateThreshold || maxHR * 0.85 // Estimate if not provided

      const hrRatio = avgHR / lthr
      const intensityFactor = Math.max(0.5, Math.min(1.15, hrRatio)) // Clamp reasonable IF range

      // HR-based TSS approximation
      const tss = duration * intensityFactor * intensityFactor * 100

      // Apply sport-specific multiplier
      const sportMultiplier = SPORT_MULTIPLIERS[activity.sport_type as keyof typeof SPORT_MULTIPLIERS] || SPORT_MULTIPLIERS.Default
      return Math.round(Math.max(0, tss * sportMultiplier))
    }

    // Fallback: duration-based estimation
    return Math.round(duration * 50) // Rough estimate: 50 TSS per hour
  }

  /**
   * Calculate normalized training load (0-100 scale)
   * Combines TRIMP and TSS with activity context
   */
  calculateNormalizedLoad(activity: ActivityWithTrainingData): number {
    // Use weight training-specific calculation for weight training activities
    if (activity.sport_type === 'WeightTraining') {
      return this.calculateWeightTrainingLoad(activity)
    }

    const trimp = this.calculateTRIMP(activity)
    const tss = this.calculateTSS(activity)
    const duration = activity.moving_time / 3600 // hours

    // Base score using the higher of TRIMP or TSS (normalized)
    let baseScore = 0
    
    if (trimp > 0 && tss > 0) {
      // When both available, use weighted average
      baseScore = (trimp * 0.6 + tss * 0.4) / 2
    } else if (tss > 0) {
      baseScore = tss
    } else if (trimp > 0) {
      baseScore = trimp * 1.2 // Slight boost when only HR available
    } else {
      // Duration-based fallback
      baseScore = duration * 30
    }

    // Apply intensity multipliers
    const intensityMultiplier = this.getIntensityMultiplier(activity)
    const sportMultiplier = SPORT_MULTIPLIERS[activity.sport_type as keyof typeof SPORT_MULTIPLIERS] || SPORT_MULTIPLIERS.Default

    let normalizedScore = baseScore * intensityMultiplier * sportMultiplier

    // Normalize to 0-100 scale
    normalizedScore = Math.min(100, Math.max(0, normalizedScore / 2))

    return Math.round(normalizedScore)
  }

  /**
   * Calculate training load metrics over time
   */
  calculateLoadMetrics(loadPoints: TrainingLoadPoint[]): TrainingLoadMetrics {
    if (loadPoints.length === 0) {
      return {
        acute: 0,
        chronic: 0,
        balance: 0,
        rampRate: 0,
        status: 'recover',
        recommendation: 'Start building your training load gradually'
      }
    }

    // Sort by date
    const sortedPoints = loadPoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    // Calculate CTL (Chronic Training Load) - exponentially weighted 42-day average
    const ctl = this.calculateExponentialAverage(sortedPoints.map(p => p.normalizedLoad), 42)
    
    // Calculate ATL (Acute Training Load) - exponentially weighted 7-day average
    const atl = this.calculateExponentialAverage(sortedPoints.slice(-7).map(p => p.normalizedLoad), 7)
    
    // Calculate TSB (Training Stress Balance)
    const tsb = ctl - atl
    
    // Calculate ramp rate (CTL change per week)
    const rampRate = this.calculateRampRate(sortedPoints)
    
    // Determine training status
    const status = this.determineTrainingStatus(ctl, atl, tsb, rampRate)
    
    // Generate recommendation
    const recommendation = this.generateRecommendation(status)

    return {
      acute: Math.round(atl),
      chronic: Math.round(ctl),
      balance: Math.round(tsb),
      rampRate: Math.round(rampRate * 10) / 10,
      status,
      recommendation
    }
  }

  /**
   * Process activities into training load points
   * Aggregates multiple activities per day into single daily load points
   */
  processActivities(activities: Activity[]): TrainingLoadPoint[] {
    // Filter activities and group by date
    const activitiesByDate = new Map<string, Activity[]>()
    
    activities
      .filter(activity => activity.moving_time > 300) // At least 5 minutes
      .forEach(activity => {
        const date = activity.start_date_local.split('T')[0] // Get just the date part
        if (!activitiesByDate.has(date)) {
          activitiesByDate.set(date, [])
        }
        activitiesByDate.get(date)!.push(activity)
      })
    
    // Create aggregated load points (one per day)
    const loadPoints = Array.from(activitiesByDate.entries()).map(([date, dayActivities]) => {
      // Aggregate all metrics for the day
      const totalTrimp = dayActivities.reduce((sum, activity) => sum + this.calculateTRIMP(activity), 0)
      const totalTss = dayActivities.reduce((sum, activity) => sum + this.calculateTSS(activity), 0)
      const totalLoad = dayActivities.reduce((sum, activity) => sum + this.calculateNormalizedLoad(activity), 0)
      
      // Get the primary activity for display (longest duration)
      const primaryActivity = dayActivities.reduce((longest, current) => 
        current.moving_time > longest.moving_time ? current : longest
      )
      
      return {
        date: `${date}T00:00:00Z`, // Standardize to start of day
        trimp: totalTrimp,
        tss: totalTss,
        normalizedLoad: totalLoad,
        activity: {
          name: dayActivities.length > 1 
            ? `${dayActivities.length} activities` 
            : primaryActivity.name,
          sport_type: dayActivities.length > 1 
            ? 'Mixed' 
            : primaryActivity.sport_type,
          duration: dayActivities.reduce((sum, act) => sum + act.moving_time, 0),
          avgHR: dayActivities.some(act => act.average_heartrate) 
            ? Math.round(dayActivities.reduce((sum, act) => sum + (act.average_heartrate || 0), 0) / dayActivities.length)
            : undefined,
          avgPower: dayActivities.some(act => act.average_watts) 
            ? Math.round(dayActivities.reduce((sum, act) => sum + (act.average_watts || 0), 0) / dayActivities.length)
            : undefined
        }
      }
    })
    
    return loadPoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  // Private helper methods

  private calculateVariabilityIndex(activity: Activity): number {
    // Simplified VI calculation - in reality this requires power data stream
    // Using sport-based estimates
    const sportVI = {
      'Run': 1.02,
      'Ride': 1.05,
      'VirtualRide': 1.02,
      'Default': 1.03
    }
    return sportVI[activity.sport_type as keyof typeof sportVI] || sportVI.Default
  }

  private getIntensityMultiplier(activity: Activity): number {
    // Calculate intensity based on available metrics
    let intensityFactor = 1.0

    if (activity.average_heartrate && this.athleteThresholds.maxHeartRate) {
      const hrRatio = activity.average_heartrate / this.athleteThresholds.maxHeartRate
      intensityFactor = Math.max(0.5, Math.min(1.2, hrRatio))
    } else if (activity.average_watts && this.athleteThresholds.functionalThresholdPower) {
      const powerRatio = activity.average_watts / this.athleteThresholds.functionalThresholdPower
      intensityFactor = Math.max(0.5, Math.min(1.3, powerRatio))
    }

    return intensityFactor
  }

  private calculateExponentialAverage(values: number[], timeConstant: number): number {
    if (values.length === 0) return 0
    
    const alpha = 1 / timeConstant
    let ema = values[0]
    
    for (let i = 1; i < values.length; i++) {
      ema = alpha * values[i] + (1 - alpha) * ema
    }
    
    return ema
  }

  private calculateRampRate(loadPoints: TrainingLoadPoint[]): number {
    if (loadPoints.length < 14) return 0
    
    const recent = loadPoints.slice(-14) // Last 2 weeks
    const firstWeek = recent.slice(0, 7)
    const secondWeek = recent.slice(7, 14)
    
    const firstWeekAvg = firstWeek.reduce((sum, p) => sum + p.normalizedLoad, 0) / 7
    const secondWeekAvg = secondWeek.reduce((sum, p) => sum + p.normalizedLoad, 0) / 7
    
    return secondWeekAvg - firstWeekAvg
  }

  private determineTrainingStatus(ctl: number, atl: number, tsb: number, rampRate: number): TrainingLoadMetrics['status'] {
    if (tsb < -10 && rampRate > 5) return 'peak'
    if (tsb > 5) return 'recover'
    if (rampRate > 3) return 'build'
    return 'maintain'
  }

  private generateRecommendation(status: TrainingLoadMetrics['status']): string {
    switch (status) {
      case 'peak':
        return 'High training stress detected. Consider reducing intensity and incorporating recovery.'
      case 'build':
        return 'Good building phase. Maintain current training progression while monitoring recovery.'
      case 'maintain':
        return 'Steady training load. Consider varying intensity or adding progressive overload.'
      case 'recover':
        return 'Low training stress. Good time for recovery or gradually increasing training load.'
      default:
        return 'Continue monitoring your training load and adjust based on how you feel.'
    }
  }
}

/**
 * Utility function to estimate athlete thresholds from activity data
 */
export function estimateAthleteThresholds(activities: Activity[]): AthleteThresholds {
  const activitiesWithHR = activities.filter(a => a.has_heartrate && a.average_heartrate)
  const activitiesWithPower = activities.filter(a => a.average_watts)

  // Estimate max heart rate (95th percentile of max HRs)
  const maxHRs = activitiesWithHR
    .map(a => a.max_heartrate || a.average_heartrate)
    .filter((hr): hr is number => hr !== undefined && hr > 0)
    .sort((a, b) => b - a)
  
  const maxHeartRate = maxHRs.length > 0 ? maxHRs[Math.floor(maxHRs.length * 0.05)] || 190 : 190

  // Estimate resting heart rate (5th percentile of average HRs)
  const avgHRs = activitiesWithHR
    .map(a => a.average_heartrate)
    .filter((hr): hr is number => hr !== undefined && hr > 0)
    .sort((a, b) => a - b)
  
  const restingHeartRate = avgHRs.length > 0 ? avgHRs[Math.floor(avgHRs.length * 0.05)] || 60 : 60

  // Estimate FTP (95th percentile of weighted average watts for efforts > 20 minutes)
  const powerActivities = activitiesWithPower.filter(a => a.moving_time > 1200) // > 20 minutes
  const powerValues = powerActivities
    .map(a => a.weighted_average_watts || a.average_watts)
    .filter((p): p is number => p !== undefined && p > 0)
    .sort((a, b) => b - a)
  
  const functionalThresholdPower = powerValues.length > 0 
    ? powerValues[Math.floor(powerValues.length * 0.1)] // 90th percentile for FTP estimate
    : undefined

  return {
    maxHeartRate,
    restingHeartRate,
    functionalThresholdPower,
    lactateThreshold: maxHeartRate * 0.85, // Rough estimate
  }
} 

/**
 * Ensure all activities have TSS calculated
 * This function updates activities in the database that don't have TSS values
 */
export async function ensureActivitiesHaveTSS(userId: string): Promise<{ updated: number; errors: number }> {
  const supabase = await createClient()
  let updated = 0
  let errors = 0

  try {
    // Get all activities for this user that don't have TSS
    const { data: activities, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .is('training_stress_score', null)

    if (error) {
      console.error('Error fetching activities for TSS update:', error)
      return { updated: 0, errors: 1 }
    }

    if (!activities || activities.length === 0) {
      console.log('✅ All activities already have TSS values')
      return { updated: 0, errors: 0 }
    }

    console.log(`🔄 Updating TSS for ${activities.length} activities...`)

    // Initialize training load calculator with default thresholds
    const defaultThresholds = {
      maxHeartRate: 185,
      restingHeartRate: 60,
      functionalThresholdPower: 250,
      lactateThreshold: 157
    }
    const trainingLoadCalculator = new TrainingLoadCalculator(defaultThresholds)

    for (const activity of activities) {
      try {
        // Calculate TSS for this activity
        const tss = trainingLoadCalculator.calculateTSS(activity)

        // Update the activity with TSS
        const { error: updateError } = await supabase
          .from('activities')
          .update({ 
            training_stress_score: tss,
            updated_at: new Date().toISOString()
          })
          .eq('id', activity.id)

        if (updateError) {
          console.error(`Error updating TSS for activity ${activity.id}:`, updateError)
          errors++
        } else {
          updated++
          console.log(`✅ Updated TSS for activity ${activity.id}: ${tss}`)
        }
      } catch (error) {
        console.error(`Error processing activity ${activity.id}:`, error)
        errors++
      }
    }

    console.log(`📊 TSS update summary: ${updated} updated, ${errors} errors`)
    return { updated, errors }
  } catch (error) {
    console.error('Error in ensureActivitiesHaveTSS:', error)
    return { updated: 0, errors: 1 }
  }
}

/**
 * Get activities with calculated TSS for a specific time period
 */
export async function getActivitiesWithTSS(userId: string, startDate?: Date, endDate?: Date): Promise<Activity[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .not('training_stress_score', 'is', null)
    .order('start_date', { ascending: false })

  if (startDate) {
    query = query.gte('start_date', startDate.toISOString())
  }
  
  if (endDate) {
    query = query.lte('start_date', endDate.toISOString())
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching activities with TSS:', error)
    throw new Error(`Failed to fetch activities: ${error.message}`)
  }

  return data || []
}

/**
 * Calculate weekly TSS for a specific week
 */
export async function calculateWeeklyTSS(userId: string, weekStart: Date): Promise<{
  totalTSS: number
  activitiesCount: number
  averageTSS: number
  dailyBreakdown: { [key: string]: number }
}> {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  const activities = await getActivitiesWithTSS(userId, weekStart, weekEnd)
  
  const dailyBreakdown: { [key: string]: number } = {}
  let totalTSS = 0

  activities.forEach(activity => {
    const activityDate = new Date(activity.start_date)
    const dayKey = activityDate.toISOString().split('T')[0]
    
    const tss = (activity as Activity & { training_stress_score?: number }).training_stress_score || 0
    totalTSS += tss
    
    dailyBreakdown[dayKey] = (dailyBreakdown[dayKey] || 0) + tss
  })

  return {
    totalTSS: Math.round(totalTSS),
    activitiesCount: activities.length,
    averageTSS: activities.length > 0 ? Math.round(totalTSS / activities.length) : 0,
    dailyBreakdown
  }
} 