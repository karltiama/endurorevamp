import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { 
  AnalysisParameters, 
  AnalysisParametersFormData,
  ExperienceLevel 
} from '@/types/training-profile-simplified'

/**
 * Service for managing analysis parameters for dynamic training profile
 */
export class AnalysisParametersService {
  
  /**
   * Get analysis parameters for a user
   */
  static async getAnalysisParameters(userId: string, useServerClient = false): Promise<AnalysisParameters | null> {
    const supabase = useServerClient ? await createServerClient() : createClient()
    
    try {
      const { data, error } = await supabase
        .from('analysis_parameters')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code === 'PGRST116') {
        return null // No parameters set
      }

      if (error) throw error
      return data as AnalysisParameters
    } catch (error) {
      console.error('Error fetching analysis parameters:', error)
      throw error
    }
  }

  /**
   * Create or update analysis parameters
   */
  static async upsertAnalysisParameters(
    userId: string, 
    data: AnalysisParametersFormData,
    useServerClient = false
  ): Promise<AnalysisParameters> {
    const supabase = useServerClient ? await createServerClient() : createClient()
    
    try {
      const { data: result, error } = await supabase
        .from('analysis_parameters')
        .upsert({
          user_id: userId,
          ...data,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return result as AnalysisParameters
    } catch (error) {
      console.error('Error upserting analysis parameters:', error)
      throw error
    }
  }

  /**
   * Get default analysis parameters based on experience level
   */
  static getDefaultParameters(experienceLevel: ExperienceLevel): AnalysisParameters {
    const baseParams = {
      // Distance thresholds (km/week)
      distance_beginner_threshold: 15,
      distance_intermediate_threshold: 30,
      distance_advanced_threshold: 50,
      
      // Pace thresholds (seconds/km)
      pace_beginner_threshold: 360, // 6:00 min/km
      pace_intermediate_threshold: 300, // 5:00 min/km
      pace_advanced_threshold: 250, // 4:10 min/km
      
      // Frequency thresholds (runs/week)
      frequency_beginner_threshold: 3,
      frequency_intermediate_threshold: 5,
      frequency_advanced_threshold: 6,
      
      // TSS thresholds
      tss_beginner_threshold: 300,
      tss_intermediate_threshold: 600,
      tss_advanced_threshold: 900,
      
      // Target multipliers
      distance_target_multiplier: 1.3, // 30% increase
      pace_target_multiplier: 0.9, // 10% improvement
      frequency_target_multiplier: 1.2, // 20% increase
      tss_target_multiplier: 1.2, // 20% increase
      
      // Analysis sensitivity
      strength_threshold_percent: 30, // within 30% of target
      improvement_threshold_percent: 20, // 20% below target
      
      // Age/fitness adjustments
      age_adjustment_factor: 1.0,
      fitness_level_adjustment: 1.0
    }

    // Adjust parameters based on experience level
    switch (experienceLevel) {
      case 'beginner':
        return {
          ...baseParams,
          // More conservative targets for beginners
          distance_target_multiplier: 1.2, // 20% increase
          pace_target_multiplier: 0.95, // 5% improvement
          frequency_target_multiplier: 1.1, // 10% increase
          tss_target_multiplier: 1.1, // 10% increase
          strength_threshold_percent: 40, // More generous strength detection
          improvement_threshold_percent: 15 // More sensitive to improvements
        }
      
      case 'intermediate':
        return baseParams
      
      case 'advanced':
        return {
          ...baseParams,
          // More aggressive targets for advanced runners
          distance_target_multiplier: 1.4, // 40% increase
          pace_target_multiplier: 0.85, // 15% improvement
          frequency_target_multiplier: 1.3, // 30% increase
          tss_target_multiplier: 1.3, // 30% increase
          strength_threshold_percent: 25, // Stricter strength detection
          improvement_threshold_percent: 25 // Less sensitive to small improvements
        }
      
      case 'elite':
        return {
          ...baseParams,
          // Elite-level parameters
          distance_beginner_threshold: 25, // Higher thresholds
          distance_intermediate_threshold: 45,
          distance_advanced_threshold: 70,
          pace_beginner_threshold: 330, // Faster pace thresholds
          pace_intermediate_threshold: 270,
          pace_advanced_threshold: 220,
          frequency_beginner_threshold: 4,
          frequency_intermediate_threshold: 6,
          frequency_advanced_threshold: 7,
          tss_beginner_threshold: 400,
          tss_intermediate_threshold: 700,
          tss_advanced_threshold: 1000,
          distance_target_multiplier: 1.5, // 50% increase
          pace_target_multiplier: 0.8, // 20% improvement
          frequency_target_multiplier: 1.4, // 40% increase
          tss_target_multiplier: 1.4, // 40% increase
          strength_threshold_percent: 20, // Very strict
          improvement_threshold_percent: 30 // Very strict
        }
      
      default:
        return baseParams
    }
  }

  /**
   * Get personalized parameters for a user
   */
  static async getPersonalizedParameters(
    userId: string, 
    experienceLevel: ExperienceLevel,
    useServerClient = false
  ): Promise<AnalysisParameters> {
    // Try to get user's custom parameters
    const customParams = await this.getAnalysisParameters(userId, useServerClient)
    
    if (customParams) {
      return customParams
    }
    
    // Return default parameters based on experience level
    return this.getDefaultParameters(experienceLevel)
  }

  /**
   * Apply age and fitness adjustments to parameters
   */
  static applyAgeFitnessAdjustments(
    params: AnalysisParameters,
    age?: number,
    fitnessLevel?: 'low' | 'medium' | 'high'
  ): AnalysisParameters {
    const adjustedParams = { ...params }

    // Age adjustments
    if (age) {
      if (age > 50) {
        // More conservative targets for older athletes
        adjustedParams.pace_beginner_threshold *= 1.1 // 10% slower
        adjustedParams.pace_intermediate_threshold *= 1.05 // 5% slower
        adjustedParams.pace_advanced_threshold *= 1.02 // 2% slower
        adjustedParams.distance_target_multiplier *= 0.9 // 10% less aggressive
        adjustedParams.tss_target_multiplier *= 0.9
      } else if (age < 25) {
        // More aggressive targets for younger athletes
        adjustedParams.pace_target_multiplier *= 0.95 // 5% more aggressive
        adjustedParams.distance_target_multiplier *= 1.1 // 10% more aggressive
        adjustedParams.tss_target_multiplier *= 1.1
      }
    }

    // Fitness level adjustments
    if (fitnessLevel) {
      switch (fitnessLevel) {
        case 'low':
          adjustedParams.distance_target_multiplier *= 0.8 // 20% less aggressive
          adjustedParams.pace_target_multiplier *= 1.05 // 5% less aggressive
          adjustedParams.strength_threshold_percent *= 1.2 // 20% more generous
          break
        case 'high':
          adjustedParams.distance_target_multiplier *= 1.2 // 20% more aggressive
          adjustedParams.pace_target_multiplier *= 0.95 // 5% more aggressive
          adjustedParams.strength_threshold_percent *= 0.8 // 20% stricter
          break
        // 'medium' uses default values
      }
    }

    return adjustedParams
  }
} 