// Simplified Training Profile Types
// Focus on essential user data and preferences only

export type ExperienceLevel =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'elite';
export type PrimaryGoal =
  | 'general_fitness'
  | 'weight_loss'
  | 'endurance_building'
  | 'speed_improvement'
  | 'race_preparation';
export type TrainingPhilosophy =
  | 'volume'
  | 'intensity'
  | 'balanced'
  | 'polarized';
export type Units = 'metric' | 'imperial';

// Core user profile - the essentials only
export interface UserProfile {
  id: string;
  user_id: string;

  // Basic athlete info
  age?: number;
  weight?: number; // kg
  sex?: 'M' | 'F';
  experience_level: ExperienceLevel;

  // Training targets (calculated from other fields)
  weekly_tss_target: number;

  // User preferences
  preferred_units: Units;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// Training preferences - how they want to train
export interface TrainingPreferences {
  id: string;
  user_id: string;

  // Goals and motivation
  primary_goal: PrimaryGoal;
  goal_description?: string;
  goal_target_date?: string;

  // Weekly schedule
  preferred_training_days: number[]; // [1,2,3,4,5] = Mon-Fri
  max_weekly_training_time?: number; // minutes
  preferred_workout_duration: number; // minutes, default 60

  // Training philosophy
  training_philosophy: TrainingPhilosophy;

  // Intensity distribution preferences (varies by experience level)
  easy_percentage: number; // beginner: 85%, intermediate: 80%, advanced: 75%, elite: 70%
  moderate_percentage: number; // beginner: 12%, intermediate: 15%, advanced: 20%, elite: 25%
  hard_percentage: number; // beginner: 3%, intermediate: 5%, advanced: 5%, elite: 5%

  // Recovery
  mandatory_rest_days: number; // default 1

  // Notification preferences (features to be implemented later)
  weekly_progress_emails: boolean; // Send weekly training summary emails
  goal_milestone_alerts: boolean; // Notify when approaching/achieving goals
  training_reminders: boolean; // Daily/weekly training reminders

  // Timestamps
  created_at: string;
  updated_at: string;
}

// NEW: Analysis parameter preferences for dynamic training profile
export interface AnalysisParameters {
  // Distance thresholds (km/week)
  distance_beginner_threshold: number; // default: 15
  distance_intermediate_threshold: number; // default: 30
  distance_advanced_threshold: number; // default: 50

  // Pace thresholds (seconds/km)
  pace_beginner_threshold: number; // default: 360 (6:00 min/km)
  pace_intermediate_threshold: number; // default: 300 (5:00 min/km)
  pace_advanced_threshold: number; // default: 250 (4:10 min/km)

  // Frequency thresholds (runs/week)
  frequency_beginner_threshold: number; // default: 3
  frequency_intermediate_threshold: number; // default: 5
  frequency_advanced_threshold: number; // default: 6

  // TSS thresholds
  tss_beginner_threshold: number; // default: 300
  tss_intermediate_threshold: number; // default: 600
  tss_advanced_threshold: number; // default: 900

  // Target multipliers (how aggressive to be with targets)
  distance_target_multiplier: number; // default: 1.3 (30% increase)
  pace_target_multiplier: number; // default: 0.9 (10% improvement)
  frequency_target_multiplier: number; // default: 1.2 (20% increase)
  tss_target_multiplier: number; // default: 1.2 (20% increase)

  // Analysis sensitivity
  strength_threshold_percent: number; // default: 30 (within 30% of target)
  improvement_threshold_percent: number; // default: 20 (20% below target)

  // Age/fitness adjustments
  age_adjustment_factor: number; // default: 1.0 (no adjustment)
  fitness_level_adjustment: number; // default: 1.0 (no adjustment)
}

// Complete profile with analysis parameters
export interface CompleteUserProfile {
  profile: UserProfile;
  preferences: TrainingPreferences;
  analysis_parameters?: AnalysisParameters;
}

// Form data for updating analysis parameters
export interface AnalysisParametersFormData {
  // Distance thresholds
  distance_beginner_threshold?: number;
  distance_intermediate_threshold?: number;
  distance_advanced_threshold?: number;

  // Pace thresholds
  pace_beginner_threshold?: number;
  pace_intermediate_threshold?: number;
  pace_advanced_threshold?: number;

  // Frequency thresholds
  frequency_beginner_threshold?: number;
  frequency_intermediate_threshold?: number;
  frequency_advanced_threshold?: number;

  // TSS thresholds
  tss_beginner_threshold?: number;
  tss_intermediate_threshold?: number;
  tss_advanced_threshold?: number;

  // Target multipliers
  distance_target_multiplier?: number;
  pace_target_multiplier?: number;
  frequency_target_multiplier?: number;
  tss_target_multiplier?: number;

  // Analysis sensitivity
  strength_threshold_percent?: number;
  improvement_threshold_percent?: number;

  // Age/fitness adjustments
  age_adjustment_factor?: number;
  fitness_level_adjustment?: number;
}

// Form data types for editing
export interface UserProfileFormData {
  age?: number;
  weight?: number;
  sex?: 'M' | 'F';
  experience_level?: ExperienceLevel;
  preferred_units?: Units;
}

export interface TrainingPreferencesFormData {
  primary_goal?: PrimaryGoal;
  goal_description?: string;
  goal_target_date?: string;
  preferred_training_days?: number[];
  max_weekly_training_time?: number;
  preferred_workout_duration?: number;
  training_philosophy?: TrainingPhilosophy;
  easy_percentage?: number;
  moderate_percentage?: number;
  hard_percentage?: number;
  mandatory_rest_days?: number;
  weekly_progress_emails?: boolean;
  goal_milestone_alerts?: boolean;
  training_reminders?: boolean;
}

// Helper function to get default intensity distribution by experience level
export function getDefaultIntensityDistribution(
  experienceLevel: ExperienceLevel
): {
  easy: number;
  moderate: number;
  hard: number;
} {
  switch (experienceLevel) {
    case 'beginner':
      return { easy: 85, moderate: 12, hard: 3 }; // More conservative
    case 'intermediate':
      return { easy: 80, moderate: 15, hard: 5 }; // Standard 80/20 rule
    case 'advanced':
      return { easy: 75, moderate: 20, hard: 5 }; // More tempo work
    case 'elite':
      return { easy: 70, moderate: 25, hard: 5 }; // More structured intensity
    default:
      return { easy: 80, moderate: 15, hard: 5 };
  }
}

// Analysis results
export interface ProfileAnalysis {
  completeness_score: number; // 0-100
  missing_fields: string[];
  recommendations: string[];
  personalized_tss_target: number;
}
