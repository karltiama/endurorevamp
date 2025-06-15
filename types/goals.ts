// Types for the user goals and onboarding system
export interface GoalType {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  unit?: string;
  category: 'distance' | 'time' | 'event' | 'general' | 'health' | 'habit' | 'performance';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserGoal {
  id: string;
  user_id: string;
  goal_type_id: string;
  target_value?: number;
  target_unit?: string;
  target_date?: string;
  goal_data: Record<string, any>;
  is_active: boolean;
  is_completed: boolean;
  priority: number;
  current_progress: number;
  progress_unit?: string;
  last_progress_update?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  
  // Joined data
  goal_type?: GoalType;
}

export interface GoalProgress {
  id: string;
  user_goal_id: string;
  progress_value: number;
  progress_unit: string;
  progress_date: string;
  source: 'manual' | 'strava' | 'import';
  source_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface UserOnboarding {
  id: string;
  user_id: string;
  goals_completed: boolean;
  strava_connected: boolean;
  profile_completed: boolean;
  first_sync_completed: boolean;
  started_at: string;
  completed_at?: string;
  current_step: 'goals' | 'strava' | 'profile' | 'sync' | 'complete';
  created_at: string;
  updated_at: string;
}

// Form types for the onboarding modal
export interface GoalFormData {
  goalTypeId: string;
  targetValue?: number;
  targetUnit?: string;
  targetDate?: string;
  notes?: string;
  priority?: number;
}

export interface OnboardingGoalsForm {
  selectedGoals: GoalFormData[];
}

// API request/response types
export interface CreateGoalRequest {
  goal_type_id: string;
  target_value?: number;
  target_unit?: string;
  target_date?: string;
  goal_data?: Record<string, any>;
  priority?: number;
}

export interface CreateGoalResponse {
  goal: UserGoal;
  success: boolean;
  error?: string;
}

export interface UpdateOnboardingRequest {
  current_step?: string;
  goals_completed?: boolean;
  strava_connected?: boolean;
  profile_completed?: boolean;
  first_sync_completed?: boolean;
}

export interface UpdateOnboardingResponse {
  onboarding: UserOnboarding;
  success: boolean;
  error?: string;
}

export interface GetGoalTypesResponse {
  goalTypes: GoalType[];
  success: boolean;
  error?: string;
}

export interface GetUserGoalsResponse {
  goals: UserGoal[];
  onboarding?: UserOnboarding;
  success: boolean;
  error?: string;
}

// UI component types
export interface GoalOption {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: string;
  unit?: string;
  requiresValue: boolean;
  requiresDate: boolean;
  placeholder?: string;
  minValue?: number;
  maxValue?: number;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: string;
  isCompleted: boolean;
  isActive: boolean;
}

// Validation types
export interface GoalValidationError {
  field: string;
  message: string;
}

export interface GoalValidationResult {
  isValid: boolean;
  errors: GoalValidationError[];
}

// Helper types for goal calculations
export interface GoalProgressSummary {
  goalId: string;
  goalType: string;
  targetValue: number;
  currentProgress: number;
  progressPercentage: number;
  isOnTrack: boolean;
  remainingToTarget: number;
  timeRemaining?: number; // days
  averageDaily?: number;
  averageWeekly?: number;
}

export interface WeeklyGoalStatus {
  weekStart: string;
  weekEnd: string;
  targetDistance: number;
  currentDistance: number;
  remainingDistance: number;
  isComplete: boolean;
  progressPercentage: number;
  dailyAverage: number;
  projectedTotal: number;
}

// Race preparation specific types
export interface RaceGoalData {
  raceName: string;
  raceDate: string;
  raceDistance: number;
  raceDistanceUnit: string;
  targetTime?: string;
  currentPace?: string;
  trainingPlan?: string;
}

// Distance goal specific types
export interface DistanceGoalData {
  weeklyTarget?: number;
  monthlyTarget?: number;
  unit: 'km' | 'miles';
  startDate?: string;
} 