import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { 
  UserProfile, 
  TrainingPreferences,
  CompleteUserProfile,
  ProfileAnalysis,
  UserProfileFormData,
  TrainingPreferencesFormData,
  ExperienceLevel,
  getDefaultIntensityDistribution
} from '@/types/training-profile-simplified'
import { Activity } from '@/lib/strava/types'

/**
 * Simplified Training Profile Service
 * 
 * This service focuses on profile management and integrates with existing
 * zone analysis and threshold calculation systems instead of duplicating them.
 */
export class TrainingProfileService {
  
  /**
   * Get complete training profile for a user
   */
  static async getCompleteProfile(userId: string, useServerClient = false): Promise<CompleteUserProfile | null> {
    const supabase = useServerClient ? await createServerClient() : createClient()
    
    try {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      // Get training preferences
      const { data: preferences, error: preferencesError } = await supabase
        .from('training_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      // If no profile exists, return null
      if (profileError && profileError.code === 'PGRST116') {
        return null
      }

      if (profileError) throw profileError

      return {
        profile: profile as UserProfile,
        preferences: preferences as TrainingPreferences || await this.createDefaultPreferences(userId, useServerClient)
      }
    } catch (error) {
      console.error('Error fetching complete training profile:', error)
      throw error
    }
  }

  /**
   * Create or update user profile
   */
  static async updateProfile(
    userId: string, 
    data: UserProfileFormData, 
    useServerClient = false
  ): Promise<UserProfile> {
    const supabase = useServerClient ? await createServerClient() : createClient()
    
    try {
      // Check if profile exists
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', userId)
        .single()

      const profileData = {
        user_id: userId,
        ...data,
        updated_at: new Date().toISOString()
      }

      let result
      if (existing) {
        // Update existing profile
        const { data, error } = await supabase
          .from('user_profiles')
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
          .from('user_profiles')
          .insert({ ...defaultProfile, ...profileData })
          .select()
          .single()
        
        if (error) throw error
        result = data
      }

      return result as UserProfile
    } catch (error) {
      console.error('Error updating user profile:', error)
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
  ): Promise<TrainingPreferences> {
    const supabase = useServerClient ? await createServerClient() : createClient()
    
    try {
      const { data: result, error } = await supabase
        .from('training_preferences')
        .upsert({
          user_id: userId,
          ...data,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return result as TrainingPreferences
    } catch (error) {
      console.error('Error updating training preferences:', error)
      throw error
    }
  }

  /**
   * Use existing zone analysis system for thresholds
   * This integrates with the existing TrainingZoneAnalysis instead of duplicating it
   */
  static async calculateThresholds(userId: string, activities: Activity[]): Promise<any> {
    try {
      console.log('🔄 Using existing zone analysis system...')
      
      // Import existing zone analysis (already comprehensive)
      const { TrainingZoneAnalysis } = await import('@/lib/training/zone-analysis')
      const zoneAnalysis = new TrainingZoneAnalysis()
      
      // Get comprehensive analysis (reuses existing logic)
      const analysis = await zoneAnalysis.analyzeUserZones(userId)
      
      console.log('✅ Zone analysis completed:', analysis)
      return analysis
    } catch (error) {
      console.error('Error calculating thresholds:', error)
      throw error
    }
  }

  /**
   * Get training zones using existing system
   */
  static async getTrainingZones(userId: string): Promise<any> {
    try {
      console.log('🎯 Getting training zones from existing system...')
      
      // Use existing zone analysis system
      const { TrainingZoneAnalysis } = await import('@/lib/training/zone-analysis')
      const zoneAnalysis = new TrainingZoneAnalysis()
      
      // Get comprehensive zone analysis
      const analysis = await zoneAnalysis.analyzeUserZones(userId)
      
      return {
        suggestedModel: analysis.suggestedZoneModel,
        alternativeModels: analysis.alternativeModels,
        confidence: analysis.confidence
      }
    } catch (error) {
      console.error('Error getting training zones:', error)
      throw error
    }
  }

  /**
   * Calculate personalized TSS target based on profile
   */
  static calculatePersonalizedTSSTarget(profile: UserProfile, preferences?: TrainingPreferences): number {
    let baseTSS = 400 // Default moderate target
    
    // Adjust based on experience level
    const experienceMultipliers: Record<ExperienceLevel, number> = {
      'beginner': 0.7,      // 280 TSS
      'intermediate': 1.0,  // 400 TSS
      'advanced': 1.3,      // 520 TSS
      'elite': 1.6          // 640 TSS
    }
    
    baseTSS *= experienceMultipliers[profile.experience_level]
    
    // Adjust based on training philosophy if available
    if (preferences?.training_philosophy) {
      switch (preferences.training_philosophy) {
        case 'volume':
          baseTSS *= 1.2 // +20% for volume-focused
          break
        case 'intensity':
          baseTSS *= 0.9 // -10% for intensity-focused
          break
        case 'polarized':
          baseTSS *= 1.1 // +10% for polarized
          break
        // 'balanced' uses default multiplier
      }
    }
    
    return Math.round(baseTSS)
  }

  /**
   * Analyze profile completeness and provide recommendations
   */
  static analyzeProfile(profile: CompleteUserProfile): ProfileAnalysis {
    const { profile: userProfile, preferences } = profile
    
    let completeness = 0
    const missing: string[] = []
    const recommendations: string[] = []
    
    // Basic info scoring (40%)
    if (userProfile.age) completeness += 8; else missing.push('age')
    if (userProfile.weight) completeness += 8; else missing.push('weight')
    if (userProfile.sex) completeness += 8; else missing.push('biological sex')
    if (userProfile.experience_level) completeness += 8
    if (userProfile.preferred_units) completeness += 8
    
    // Training preferences scoring (60%)
    if (preferences.primary_goal) completeness += 12; else missing.push('primary goal')
    if (preferences.goal_description) completeness += 8; else missing.push('goal description')
    if (preferences.preferred_training_days.length > 0) completeness += 10; else missing.push('training schedule')
    if (preferences.max_weekly_training_time) completeness += 8; else missing.push('weekly training time')
    if (preferences.training_philosophy) completeness += 12
    if (preferences.mandatory_rest_days) completeness += 10
    
    // Generate recommendations
    if (missing.includes('age') || missing.includes('weight') || missing.includes('biological sex')) {
      recommendations.push('Add basic physical info to improve TSS target calculation')
    }
    
    if (missing.includes('primary goal')) {
      recommendations.push('Set a primary training goal to get personalized workout suggestions')
    }
    
    if (missing.includes('training schedule')) {
      recommendations.push('Define your preferred training days for better workout planning')
    }
    
    if (completeness < 70) {
      recommendations.push('Complete your profile to unlock personalized training insights')
    }
    
    // Calculate personalized TSS target
    const personalizedTSSTarget = this.calculatePersonalizedTSSTarget(userProfile, preferences)
    
    return {
      completeness_score: Math.round(completeness),
      missing_fields: missing,
      recommendations,
      personalized_tss_target: personalizedTSSTarget
    }
  }

  /**
   * Create default profile for new user
   */
  private static createDefaultProfile(userId: string): Partial<UserProfile> {
    return {
      user_id: userId,
      experience_level: 'intermediate',
      weekly_tss_target: 400,
      preferred_units: 'metric',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  /**
   * Create default preferences for new user
   */
  private static async createDefaultPreferences(
    userId: string, 
    useServerClient = false
  ): Promise<TrainingPreferences> {
    const supabase = useServerClient ? await createServerClient() : createClient()
    
    const defaultIntensity = getDefaultIntensityDistribution('intermediate')
    
    const defaultPreferences = {
      user_id: userId,
      primary_goal: 'general_fitness' as const,
      preferred_training_days: [1, 2, 3, 4, 5], // Mon-Fri
      preferred_workout_duration: 60,
      training_philosophy: 'balanced' as const,
      easy_percentage: defaultIntensity.easy,
      moderate_percentage: defaultIntensity.moderate,
      hard_percentage: defaultIntensity.hard,
      mandatory_rest_days: 1,
      weekly_progress_emails: true,
      goal_milestone_alerts: true,
      training_reminders: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('training_preferences')
      .insert(defaultPreferences)
      .select()
      .single()

    if (error) throw error
    return data as TrainingPreferences
  }
} 