// User Training Profile Types
// These types correspond to the user_training_profiles database schema

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite'
export type ThresholdSource = 'estimated' | 'user_set' | 'lab_tested' | 'field_tested' | 'measured' | 'coach_set'
export type Units = 'metric' | 'imperial'
export type TrainingPhilosophy = 'volume' | 'intensity' | 'balanced' | 'polarized'
export type PrimaryGoal = 'general_fitness' | 'weight_loss' | 'endurance_building' | 'speed_improvement' | 'race_preparation' | 'strength_building' | 'recovery' | 'maintenance'
export type RecoveryPriority = 'low' | 'moderate' | 'high'

// Core training profile interface
export interface UserTrainingProfile {
  id: string
  user_id: string
  
  // Basic athlete info
  age?: number
  weight?: number // kg
  height?: number // cm
  sex?: 'M' | 'F'
  experience_level: ExperienceLevel
  primary_sport: string
  
  // Heart Rate Thresholds
  max_heart_rate?: number
  resting_heart_rate?: number
  lactate_threshold_hr?: number
  aerobic_threshold_hr?: number
  
  // Power Thresholds
  functional_threshold_power?: number // FTP in watts
  critical_power?: number
  
  // Training Load Targets
  weekly_tss_target: number
  monthly_distance_target?: number // km
  weekly_training_hours_target?: number
  
  // Training Zones (JSONB)
  heart_rate_zones: HeartRateZones
  power_zones: PowerZones
  pace_zones: PaceZones
  
  // Source tracking
  max_hr_source: ThresholdSource
  resting_hr_source: ThresholdSource
  ftp_source: ThresholdSource
  tss_target_source: ThresholdSource
  
  // Calculation metadata
  last_threshold_calculation?: string
  calculation_data_points?: number
  threshold_confidence?: number // 0.0-1.0
  
  // User preferences
  preferred_units: Units
  training_philosophy: TrainingPhilosophy
  
  // Timestamps
  created_at: string
  updated_at: string
}

// Training zones interfaces
export interface HeartRateZones {
  zone_1?: { min: number; max: number; name: string; description: string }
  zone_2?: { min: number; max: number; name: string; description: string }
  zone_3?: { min: number; max: number; name: string; description: string }
  zone_4?: { min: number; max: number; name: string; description: string }
  zone_5?: { min: number; max: number; name: string; description: string }
}

export interface PowerZones {
  zone_1?: { min: number; max: number; name: string; percentage: string }
  zone_2?: { min: number; max: number; name: string; percentage: string }
  zone_3?: { min: number; max: number; name: string; percentage: string }
  zone_4?: { min: number; max: number; name: string; percentage: string }
  zone_5?: { min: number; max: number; name: string; percentage: string }
  zone_6?: { min: number; max: number; name: string; percentage: string }
  zone_7?: { min: number; max: number; name: string; percentage: string }
}

export interface PaceZones {
  recovery?: { pace_per_km: number; description: string }
  easy?: { pace_per_km: number; description: string }
  tempo?: { pace_per_km: number; description: string }
  threshold?: { pace_per_km: number; description: string }
  vo2_max?: { pace_per_km: number; description: string }
}

// Training preferences interface
export interface UserTrainingPreferences {
  id: string
  user_id: string
  
  // Training goals
  primary_goal: PrimaryGoal
  goal_target_date?: string
  goal_description?: string
  
  // Weekly structure
  preferred_training_days: number[] // 1-7, Mon=1
  max_weekly_training_time?: number // minutes
  preferred_workout_duration: number // minutes
  
  // Intensity distribution
  easy_percentage: number
  moderate_percentage: number
  hard_percentage: number
  
  // Recovery preferences
  mandatory_rest_days: number
  recovery_priority: RecoveryPriority
  
  // Notifications
  daily_training_reminders: boolean
  weekly_progress_summary: boolean
  goal_milestone_alerts: boolean
  
  // Timestamps
  created_at: string
  updated_at: string
}

// Threshold calculation history
export interface ThresholdCalculationHistory {
  id: string
  user_id: string
  
  calculation_date: string
  activities_analyzed: number
  date_range_start: string
  date_range_end: string
  
  // Calculated values
  estimated_max_hr?: number
  estimated_resting_hr?: number
  estimated_ftp?: number
  estimated_lthr?: number
  confidence_score?: number
  
  // Metadata
  calculation_method: string
  algorithm_version: string
  
  created_at: string
}

// Form data types for updating profiles
export interface TrainingProfileFormData {
  // Basic info
  age?: number
  weight?: number
  height?: number
  sex?: 'M' | 'F'
  experience_level?: ExperienceLevel
  primary_sport?: string
  
  // Manual threshold overrides
  max_heart_rate?: number
  resting_heart_rate?: number
  lactate_threshold_hr?: number
  functional_threshold_power?: number
  
  // Training targets
  weekly_tss_target?: number
  monthly_distance_target?: number
  weekly_training_hours_target?: number
  
  // Preferences
  preferred_units?: Units
  training_philosophy?: TrainingPhilosophy
}

export interface TrainingPreferencesFormData {
  primary_goal?: PrimaryGoal
  goal_target_date?: string
  goal_description?: string
  
  preferred_training_days?: number[]
  max_weekly_training_time?: number
  preferred_workout_duration?: number
  
  easy_percentage?: number
  moderate_percentage?: number
  hard_percentage?: number
  
  mandatory_rest_days?: number
  recovery_priority?: RecoveryPriority
  
  daily_training_reminders?: boolean
  weekly_progress_summary?: boolean
  goal_milestone_alerts?: boolean
}

// Combined profile with preferences for easier usage
export interface CompleteTrainingProfile {
  profile: UserTrainingProfile
  preferences: UserTrainingPreferences
  calculation_history: ThresholdCalculationHistory[]
}

// Profile analysis interface
export interface ProfileAnalysis {
  completeness_score: number // 0-100
  missing_critical_data: string[]
  recommendations: string[]
  confidence_level: 'low' | 'medium' | 'high'
  needs_recalculation: boolean
  last_updated_days_ago: number
}

// Threshold estimation result
export interface ThresholdEstimation {
  estimated_values: {
    max_heart_rate?: number
    resting_heart_rate?: number
    lactate_threshold_hr?: number
    functional_threshold_power?: number
  }
  confidence_scores: {
    max_heart_rate?: number
    resting_heart_rate?: number
    lactate_threshold_hr?: number
    functional_threshold_power?: number
  }
  data_quality: {
    activities_analyzed: number
    date_range_days: number
    hr_activities: number
    power_activities: number
  }
  recommendations: string[]
} 