import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { 
  UserTrainingProfile, 
  UserTrainingPreferences,
  ThresholdCalculationHistory,
  CompleteTrainingProfile,
  ProfileAnalysis,
  ThresholdEstimation,
  TrainingProfileFormData,
  TrainingPreferencesFormData,
  ExperienceLevel,
  HeartRateZones,
  PowerZones,
  PaceZones
} from '@/types/training-profile'
import { Activity } from '@/lib/strava/types'
import { estimateAthleteThresholds } from '@/lib/training/training-load'

export class TrainingProfileService {
  
  /**
   * Get complete training profile for a user
   */
  static async getCompleteProfile(userId: string, useServerClient = false): Promise<CompleteTrainingProfile | null> {
    const supabase = useServerClient ? await createServerClient() : createClient()
    
    try {
      // Get training profile
      const { data: profile, error: profileError } = await supabase
        .from('user_training_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      // Get training preferences
      const { data: preferences, error: preferencesError } = await supabase
        .from('user_training_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      // Get calculation history (last 5 entries)
      const { data: history, error: historyError } = await supabase
        .from('threshold_calculation_history')
        .select('*')
        .eq('user_id', userId)
        .order('calculation_date', { ascending: false })
        .limit(5)

      // If no profile exists, return null
      if (profileError && profileError.code === 'PGRST116') {
        return null
      }

      if (profileError) throw profileError

      return {
        profile: profile as UserTrainingProfile,
        preferences: preferences as UserTrainingPreferences || await this.createDefaultPreferences(userId, useServerClient),
        calculation_history: (history || []) as ThresholdCalculationHistory[]
      }
    } catch (error) {
      console.error('Error fetching complete training profile:', error)
      throw error
    }
  }

  /**
   * Create or update training profile
   */
  static async updateProfile(
    userId: string, 
    data: TrainingProfileFormData, 
    useServerClient = false
  ): Promise<UserTrainingProfile> {
    const supabase = useServerClient ? await createServerClient() : createClient()
    
    try {
      // Check if profile exists
      const { data: existing } = await supabase
        .from('user_training_profiles')
        .select('id')
        .eq('user_id', userId)
        .single()

      const profileData = {
        user_id: userId,
        ...data,
        // Track source of manual overrides
        ...(data.max_heart_rate && { max_hr_source: 'user_set' }),
        ...(data.resting_heart_rate && { resting_hr_source: 'user_set' }),
        ...(data.functional_threshold_power && { ftp_source: 'user_set' }),
        ...(data.weekly_tss_target && { tss_target_source: 'user_set' }),
      }

      let result
      if (existing) {
        // Update existing profile
        const { data, error } = await supabase
          .from('user_training_profiles')
          .update(profileData)
          .eq('user_id', userId)
          .select()
          .single()
        
        if (error) throw error
        result = data
      } else {
        // Create new profile with defaults
        const defaultProfile = this.createDefaultProfile(userId)
        const { data, error } = await supabase
          .from('user_training_profiles')
          .insert({ ...defaultProfile, ...profileData })
          .select()
          .single()
        
        if (error) throw error
        result = data
      }

      return result as UserTrainingProfile
    } catch (error) {
      console.error('Error updating training profile:', error)
      throw error
    }
  }

  /**
   * Update training preferences
   */
  static async updatePreferences(
    userId: string,
    data: TrainingPreferencesFormData,
    useServerClient = false
  ): Promise<UserTrainingPreferences> {
    const supabase = useServerClient ? await createServerClient() : createClient()
    
    try {
      const { data: result, error } = await supabase
        .from('user_training_preferences')
        .upsert({
          user_id: userId,
          ...data
        })
        .select()
        .single()

      if (error) throw error
      return result as UserTrainingPreferences
    } catch (error) {
      console.error('Error updating training preferences:', error)
      throw error
    }
  }

  /**
   * Calculate thresholds from user's activity data
   */
  static async calculateThresholds(
    userId: string,
    activities: Activity[],
    useServerClient = false
  ): Promise<ThresholdEstimation> {
    const supabase = useServerClient ? await createServerClient() : createClient()
    
    try {
      // Use existing threshold estimation function
      const estimated = estimateAthleteThresholds(activities)
      
      // Calculate confidence scores based on data quality
      const activitiesWithHR = activities.filter(a => a.has_heartrate && a.average_heartrate)
      const activitiesWithPower = activities.filter(a => a.average_watts)
      const totalActivities = activities.length
      
      const confidence = this.calculateConfidence(activitiesWithHR.length, activitiesWithPower.length, totalActivities)
      
      const dateRange = this.getDateRange(activities)
      
      // Store calculation in history
      await supabase
        .from('threshold_calculation_history')
        .insert({
          user_id: userId,
          activities_analyzed: totalActivities,
          date_range_start: dateRange.start,
          date_range_end: dateRange.end,
          estimated_max_hr: estimated.maxHeartRate,
          estimated_resting_hr: estimated.restingHeartRate,
          estimated_ftp: estimated.functionalThresholdPower,
          estimated_lthr: estimated.lactateThreshold,
          confidence_score: confidence.overall,
          calculation_method: 'percentile_analysis',
          algorithm_version: '1.0'
        })

      // Generate recommendations
      const recommendations = this.generateThresholdRecommendations(confidence, estimated)

      return {
        estimated_values: {
          max_heart_rate: estimated.maxHeartRate,
          resting_heart_rate: estimated.restingHeartRate,
          lactate_threshold_hr: estimated.lactateThreshold,
          functional_threshold_power: estimated.functionalThresholdPower
        },
        confidence_scores: confidence,
        data_quality: {
          activities_analyzed: totalActivities,
          date_range_days: Math.floor((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24)),
          hr_activities: activitiesWithHR.length,
          power_activities: activitiesWithPower.length
        },
        recommendations
      }
    } catch (error) {
      console.error('Error calculating thresholds:', error)
      throw error
    }
  }

  /**
   * Automatically update profile with calculated thresholds
   */
  static async autoUpdateFromCalculation(
    userId: string,
    estimation: ThresholdEstimation,
    useServerClient = false
  ): Promise<UserTrainingProfile> {
    const updateData: TrainingProfileFormData = {}
    
    // Only update if confidence is reasonably high and value doesn't exist
    const profile = await this.getCompleteProfile(userId, useServerClient)
    
    if (estimation.confidence_scores.max_heart_rate && estimation.confidence_scores.max_heart_rate > 0.7) {
      if (!profile?.profile.max_heart_rate || profile.profile.max_hr_source === 'estimated') {
        updateData.max_heart_rate = estimation.estimated_values.max_heart_rate
      }
    }
    
    if (estimation.confidence_scores.resting_heart_rate && estimation.confidence_scores.resting_heart_rate > 0.6) {
      if (!profile?.profile.resting_heart_rate || profile.profile.resting_hr_source === 'estimated') {
        updateData.resting_heart_rate = estimation.estimated_values.resting_heart_rate
      }
    }
    
    if (estimation.confidence_scores.functional_threshold_power && estimation.confidence_scores.functional_threshold_power > 0.7) {
      if (!profile?.profile.functional_threshold_power || profile.profile.ftp_source === 'estimated') {
        updateData.functional_threshold_power = estimation.estimated_values.functional_threshold_power
      }
    }

    // Calculate personalized TSS target
    if (profile?.profile) {
      const personalizedTSS = this.calculatePersonalizedTSSTarget(profile.profile, estimation)
      if (personalizedTSS !== profile.profile.weekly_tss_target && profile.profile.tss_target_source === 'estimated') {
        updateData.weekly_tss_target = personalizedTSS
      }
    }

    return this.updateProfile(userId, updateData, useServerClient)
  }

  /**
   * Analyze profile completeness and provide recommendations
   */
  static analyzeProfile(profile: CompleteTrainingProfile): ProfileAnalysis {
    const { profile: tp, preferences: prefs, calculation_history } = profile
    
    let completeness = 0
    const missing: string[] = []
    const recommendations: string[] = []
    
    // Basic info scoring (30%)
    if (tp.age) completeness += 5; else missing.push('age')
    if (tp.weight) completeness += 5; else missing.push('weight')
    if (tp.sex) completeness += 5; else missing.push('biological sex')
    if (tp.experience_level) completeness += 5
    if (tp.primary_sport) completeness += 5
    if (prefs.primary_goal) completeness += 5
    
    // Threshold data scoring (50%)
    if (tp.max_heart_rate) completeness += 15; else missing.push('max heart rate')
    if (tp.resting_heart_rate) completeness += 10; else missing.push('resting heart rate')
    if (tp.lactate_threshold_hr) completeness += 10
    if (tp.functional_threshold_power) completeness += 10
    if (tp.weekly_tss_target) completeness += 5
    
    // Training preferences scoring (20%)
    if (prefs.preferred_training_days?.length) completeness += 5
    if (prefs.max_weekly_training_time) completeness += 5
    if (prefs.easy_percentage && prefs.moderate_percentage && prefs.hard_percentage) completeness += 5
    if (prefs.recovery_priority) completeness += 5

    // Determine confidence level
    const hasRecentCalculation = calculation_history.length > 0 && 
      calculation_history[0].confidence_score && calculation_history[0].confidence_score > 0.7
    
    const confidence_level = 
      completeness >= 80 && hasRecentCalculation ? 'high' :
      completeness >= 60 ? 'medium' : 'low'

    // Check if recalculation is needed
    const lastCalc = calculation_history[0]
    const needsRecalculation = !lastCalc || 
      (new Date().getTime() - new Date(lastCalc.calculation_date).getTime()) > (30 * 24 * 60 * 60 * 1000) // 30 days

    // Generate recommendations
    if (missing.length > 0) {
      recommendations.push(`Complete your profile by adding: ${missing.join(', ')}`)
    }
    
    if (needsRecalculation) {
      recommendations.push('Recalculate your training thresholds based on recent activities')
    }
    
    if (completeness < 70) {
      recommendations.push('Add more personal information to get better training recommendations')
    }

    const lastUpdated = tp.updated_at ? 
      Math.floor((new Date().getTime() - new Date(tp.updated_at).getTime()) / (1000 * 60 * 60 * 24)) : 0

    return {
      completeness_score: Math.round(completeness),
      missing_critical_data: missing,
      recommendations,
      confidence_level,
      needs_recalculation: needsRecalculation,
      last_updated_days_ago: lastUpdated
    }
  }

  /**
   * Calculate personalized TSS target based on profile
   */
  static calculatePersonalizedTSSTarget(
    profile: UserTrainingProfile, 
    estimation?: ThresholdEstimation
  ): number {
    let baseTSS = 400 // Default moderate target
    
    // Adjust based on experience level
    const experienceMultipliers: Record<ExperienceLevel, number> = {
      'beginner': 0.7,      // 280 TSS
      'intermediate': 1.0,  // 400 TSS
      'advanced': 1.3,      // 520 TSS
      'elite': 1.6          // 640 TSS
    }
    
    baseTSS *= experienceMultipliers[profile.experience_level] || 1.0
    
    // Adjust based on training philosophy
    const philosophyMultipliers = {
      'volume': 1.2,
      'intensity': 0.9,
      'balanced': 1.0,
      'polarized': 1.1
    }
    
    baseTSS *= philosophyMultipliers[profile.training_philosophy] || 1.0
    
    // Adjust based on available training time
    if (profile.weekly_training_hours_target) {
      if (profile.weekly_training_hours_target < 5) baseTSS *= 0.8
      else if (profile.weekly_training_hours_target > 10) baseTSS *= 1.2
    }
    
    // Adjust based on data quality if estimation provided
    if (estimation && estimation.data_quality.activities_analyzed > 20) {
      // User has good activity history, can handle slightly higher targets
      baseTSS *= 1.1
    }
    
    return Math.round(Math.max(200, Math.min(1000, baseTSS))) // Clamp between 200-1000
  }

  /**
   * Generate training zones based on thresholds
   */
  static generateTrainingZones(profile: UserTrainingProfile): {
    heartRateZones: HeartRateZones
    powerZones: PowerZones
    paceZones: PaceZones
  } {
    const heartRateZones: HeartRateZones = {}
    const powerZones: PowerZones = {}
    const paceZones: PaceZones = {}
    
    // Heart Rate Zones (5-zone model)
    if (profile.max_heart_rate) {
      const maxHR = profile.max_heart_rate
      heartRateZones.zone_1 = {
        min: Math.round(maxHR * 0.50),
        max: Math.round(maxHR * 0.60),
        name: 'Recovery',
        description: 'Active recovery, very easy effort'
      }
      heartRateZones.zone_2 = {
        min: Math.round(maxHR * 0.60),
        max: Math.round(maxHR * 0.70),
        name: 'Aerobic Base',
        description: 'Comfortable, conversational pace'
      }
      heartRateZones.zone_3 = {
        min: Math.round(maxHR * 0.70),
        max: Math.round(maxHR * 0.80),
        name: 'Tempo',
        description: 'Comfortably hard, moderate effort'
      }
      heartRateZones.zone_4 = {
        min: Math.round(maxHR * 0.80),
        max: Math.round(maxHR * 0.90),
        name: 'Threshold',
        description: 'Hard effort, lactate threshold'
      }
      heartRateZones.zone_5 = {
        min: Math.round(maxHR * 0.90),
        max: maxHR,
        name: 'VO2 Max',
        description: 'Very hard, maximum effort'
      }
    }
    
    // Power Zones (7-zone Coggan model)
    if (profile.functional_threshold_power) {
      const ftp = profile.functional_threshold_power
      powerZones.zone_1 = {
        min: 0,
        max: Math.round(ftp * 0.55),
        name: 'Active Recovery',
        percentage: '< 55% FTP'
      }
      powerZones.zone_2 = {
        min: Math.round(ftp * 0.56),
        max: Math.round(ftp * 0.75),
        name: 'Endurance',
        percentage: '56-75% FTP'
      }
      powerZones.zone_3 = {
        min: Math.round(ftp * 0.76),
        max: Math.round(ftp * 0.90),
        name: 'Tempo',
        percentage: '76-90% FTP'
      }
      powerZones.zone_4 = {
        min: Math.round(ftp * 0.91),
        max: Math.round(ftp * 1.05),
        name: 'Lactate Threshold',
        percentage: '91-105% FTP'
      }
      powerZones.zone_5 = {
        min: Math.round(ftp * 1.06),
        max: Math.round(ftp * 1.20),
        name: 'VO2 Max',
        percentage: '106-120% FTP'
      }
      powerZones.zone_6 = {
        min: Math.round(ftp * 1.21),
        max: Math.round(ftp * 1.50),
        name: 'Anaerobic Capacity',
        percentage: '121-150% FTP'
      }
      powerZones.zone_7 = {
        min: Math.round(ftp * 1.51),
        max: Math.round(ftp * 2.50),
        name: 'Neuromuscular Power',
        percentage: '> 150% FTP'
      }
    }
    
    return { heartRateZones, powerZones, paceZones }
  }

  // Private helper methods
  private static createDefaultProfile(userId: string): Partial<UserTrainingProfile> {
    return {
      user_id: userId,
      experience_level: 'intermediate',
      primary_sport: 'Run',
      weekly_tss_target: 400,
      heart_rate_zones: {},
      power_zones: {},
      pace_zones: {},
      max_hr_source: 'estimated',
      resting_hr_source: 'estimated',
      ftp_source: 'estimated',
      tss_target_source: 'estimated',
      preferred_units: 'metric',
      training_philosophy: 'balanced'
    }
  }

  private static async createDefaultPreferences(
    userId: string,
    useServerClient = false
  ): Promise<UserTrainingPreferences> {
    const supabase = useServerClient ? await createServerClient() : createClient()
    
    const defaultPrefs = {
      user_id: userId,
      primary_goal: 'general_fitness' as const,
      preferred_training_days: [1, 2, 3, 4, 5], // Mon-Fri
      preferred_workout_duration: 60,
      easy_percentage: 80,
      moderate_percentage: 15,
      hard_percentage: 5,
      mandatory_rest_days: 1,
      recovery_priority: 'moderate' as const,
      daily_training_reminders: false,
      weekly_progress_summary: true,
      goal_milestone_alerts: true
    }

    const { data, error } = await supabase
      .from('user_training_preferences')
      .insert(defaultPrefs)
      .select()
      .single()

    if (error) throw error
    return data as UserTrainingPreferences
  }

  private static calculateConfidence(hrActivities: number, powerActivities: number, totalActivities: number) {
    const hrConfidence = Math.min(1.0, hrActivities / 20) // Need ~20 HR activities for good confidence
    const powerConfidence = Math.min(1.0, powerActivities / 10) // Need ~10 power activities
    const overallConfidence = Math.min(1.0, totalActivities / 30) // Need ~30 total activities
    
    return {
      max_heart_rate: hrConfidence,
      resting_heart_rate: hrConfidence * 0.8, // Slightly less confident about resting HR
      lactate_threshold_hr: hrConfidence * 0.9,
      functional_threshold_power: powerConfidence,
      overall: overallConfidence
    }
  }

  private static getDateRange(activities: Activity[]) {
    if (activities.length === 0) {
      const now = new Date()
      return {
        start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: now.toISOString().split('T')[0]
      }
    }
    
    const dates = activities.map(a => new Date(a.start_date)).sort((a, b) => a.getTime() - b.getTime())
    return {
      start: dates[0].toISOString().split('T')[0],
      end: dates[dates.length - 1].toISOString().split('T')[0]
    }
  }

  private static generateThresholdRecommendations(confidence: any, estimated: any): string[] {
    const recommendations: string[] = []
    
    if (confidence.max_heart_rate < 0.7) {
      recommendations.push('Complete more activities with heart rate data for better max HR estimation')
    }
    
    if (confidence.functional_threshold_power < 0.7 && estimated.functionalThresholdPower) {
      recommendations.push('Add more cycling activities with power data for better FTP estimation')
    }
    
    if (confidence.overall < 0.6) {
      recommendations.push('Complete more training activities to improve threshold estimations')
    }
    
    return recommendations
  }
} 