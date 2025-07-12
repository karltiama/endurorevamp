// Simplified Training Profile Types
// Focus on essential user data and preferences only

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite'
export type PrimaryGoal = 'general_fitness' | 'weight_loss' | 'endurance_building' | 'speed_improvement' | 'race_preparation'
export type TrainingPhilosophy = 'volume' | 'intensity' | 'balanced' | 'polarized'
export type Units = 'metric' | 'imperial'

// Core user profile - the essentials only
export interface UserProfile {
  id: string
  user_id: string
  
  // Basic athlete info
  age?: number
  weight?: number // kg
  sex?: 'M' | 'F'
  experience_level: ExperienceLevel
  
  // Training targets (calculated from other fields)
  weekly_tss_target: number
  
  // User preferences
  preferred_units: Units
  
  // Timestamps
  created_at: string
  updated_at: string
}

// Training preferences - how they want to train
export interface TrainingPreferences {
  id: string
  user_id: string
  
  // Goals and motivation
  primary_goal: PrimaryGoal
  goal_description?: string
  goal_target_date?: string
  
  // Weekly schedule
  preferred_training_days: number[] // [1,2,3,4,5] = Mon-Fri
  max_weekly_training_time?: number // minutes
  preferred_workout_duration: number // minutes, default 60
  
  // Training philosophy
  training_philosophy: TrainingPhilosophy
  
  // Intensity distribution preferences (varies by experience level)
  easy_percentage: number // beginner: 85%, intermediate: 80%, advanced: 75%, elite: 70%
  moderate_percentage: number // beginner: 12%, intermediate: 15%, advanced: 20%, elite: 25%  
  hard_percentage: number // beginner: 3%, intermediate: 5%, advanced: 5%, elite: 5%
  
  // Recovery
  mandatory_rest_days: number // default 1
  
  // Notification preferences (features to be implemented later)
  weekly_progress_emails: boolean // Send weekly training summary emails
  goal_milestone_alerts: boolean // Notify when approaching/achieving goals
  training_reminders: boolean // Daily/weekly training reminders
  
  // Timestamps
  created_at: string
  updated_at: string
}

// Complete profile combining both
export interface CompleteUserProfile {
  profile: UserProfile
  preferences: TrainingPreferences
}

// Form data types for editing
export interface UserProfileFormData {
  age?: number
  weight?: number
  sex?: 'M' | 'F'
  experience_level?: ExperienceLevel
  preferred_units?: Units
}

export interface TrainingPreferencesFormData {
  primary_goal?: PrimaryGoal
  goal_description?: string
  goal_target_date?: string
  preferred_training_days?: number[]
  max_weekly_training_time?: number
  preferred_workout_duration?: number
  training_philosophy?: TrainingPhilosophy
  easy_percentage?: number
  moderate_percentage?: number
  hard_percentage?: number
  mandatory_rest_days?: number
  weekly_progress_emails?: boolean
  goal_milestone_alerts?: boolean
  training_reminders?: boolean
}

// Helper function to get default intensity distribution by experience level
export function getDefaultIntensityDistribution(experienceLevel: ExperienceLevel): {
  easy: number
  moderate: number
  hard: number
} {
  switch (experienceLevel) {
    case 'beginner':
      return { easy: 85, moderate: 12, hard: 3 } // More conservative
    case 'intermediate':
      return { easy: 80, moderate: 15, hard: 5 } // Standard 80/20 rule
    case 'advanced':
      return { easy: 75, moderate: 20, hard: 5 } // More tempo work
    case 'elite':
      return { easy: 70, moderate: 25, hard: 5 } // More structured intensity
    default:
      return { easy: 80, moderate: 15, hard: 5 }
  }
}

// Analysis results
export interface ProfileAnalysis {
  completeness_score: number // 0-100
  missing_fields: string[]
  recommendations: string[]
  personalized_tss_target: number
} 