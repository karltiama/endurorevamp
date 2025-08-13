// Types for the user goals and onboarding system
export interface GoalType {
  name: string; // Primary key (was 'id' before migration)
  display_name: string;
  description: string;
  category:
    | 'distance'
    | 'pace'
    | 'frequency'
    | 'duration'
    | 'elevation'
    | 'heart_rate'
    | 'event';
  metric_type: string; // e.g., 'total_distance', 'average_pace', 'run_count', etc.
  unit?: string; // km, miles, min/km, min/mile, bpm, m, ft, count, minutes, hours
  target_guidance?: string; // Guidance for setting realistic targets
  calculation_method: string; // How progress is calculated from activities
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserGoal {
  id: string;
  user_id: string;
  goal_type_id: string;
  target_value?: number; // The numeric target (e.g., 50 km, 5:00 min/km, 4 runs)
  target_unit?: string; // Unit for the target
  target_date?: string; // Optional target date for time-bound goals
  time_period: 'weekly' | 'monthly' | 'single_activity' | 'ongoing';
  current_progress: number; // Current progress toward target
  best_result?: number; // Best single result achieved (for pace, distance PRs, etc.)
  streak_count: number; // For consistency goals
  goal_data?: GoalData; // Additional goal-specific data
  is_active: boolean;
  is_completed: boolean;
  priority: number; // 1-5, higher = more important
  created_at: string;
  updated_at: string;
  completed_at?: string;
  last_progress_update?: string;
  goal_type?: GoalType; // Joined goal type information
}

export interface GoalProgress {
  id: string;
  user_goal_id: string;
  activity_id?: string; // Strava activity ID
  activity_date: string;
  value_achieved?: number; // The value achieved in this activity
  contribution_amount?: number; // How much this activity contributed to the goal
  notes?: string;
  created_at: string;
}

export interface UserOnboarding {
  id: string;
  user_id: string;
  goals_completed: boolean;
  strava_connected: boolean;
  profile_completed?: boolean;
  first_sync_completed?: boolean;
  current_step: 'goals' | 'strava' | 'complete';
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateOnboardingRequest {
  goals_completed?: boolean;
  strava_connected?: boolean;
  profile_completed?: boolean;
  first_sync_completed?: boolean;
  current_step?: 'goals' | 'strava' | 'complete';
}

// Goal-specific data types
export interface GoalData {
  notes?: string;

  // Dashboard display settings
  show_on_dashboard?: boolean; // Whether this goal appears on the dashboard
  dashboard_priority?: number; // Order priority on dashboard (1-3)

  // Context and creation metadata
  creation_context?: 'manual' | 'suggestion' | 'onboarding' | 'dashboard';
  is_onboarding_goal?: boolean;

  // Suggestion-specific data
  from_suggestion?: boolean;
  suggestion_id?: string;
  suggestion_title?: string;
  suggestion_reasoning?: string;
  suggestion_strategies?: string[];
  suggestion_benefits?: string[];
  success_probability?: number;
  required_commitment?: 'low' | 'medium' | 'high';
  warnings?: string[];

  // Pace-specific data
  target_pace_seconds?: number; // Target pace in seconds per km
  distance_range?: [number, number]; // Distance range for pace goals (e.g., [4.5, 5.5] for 5K)

  // Heart rate specific data
  target_zones?: number[]; // HR zones to target (e.g., [1, 2] for aerobic base)
  zone_ranges?: {
    zone_1?: [number, number]; // BPM ranges for each zone
    zone_2?: [number, number];
    zone_3?: [number, number];
    zone_4?: [number, number];
    zone_5?: [number, number];
  };

  // Frequency-specific data
  target_frequency?: number; // Number of runs per week/month

  // Elevation-specific data
  elevation_preference?: 'flat' | 'hilly' | 'mixed';

  // General metadata
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  estimated_weeks?: number; // Estimated time to complete goal
}

// API request/response types
export interface CreateGoalRequest {
  goal_type_id: string;
  target_value?: number;
  target_unit?: string;
  target_date?: string;
  time_period?: 'weekly' | 'monthly' | 'single_activity' | 'ongoing';
  goal_data?: GoalData;
  priority?: number;
}

export interface UpdateGoalRequest {
  target_value?: number;
  target_date?: string;
  goal_data?: GoalData;
  current_progress?: number;
  is_completed?: boolean;
  priority?: number;
}

// API Response types
export interface GetGoalTypesResponse {
  success: boolean;
  goalTypes: GoalType[];
  error?: string;
}

export interface UserStats {
  activityCount: number;
  hasStravaConnection: boolean;
}

export interface GetUserGoalsResponse {
  success: boolean;
  goals: UserGoal[];
  onboarding?: UserOnboarding;
  userStats?: UserStats;
  error?: string;
}

export interface CreateGoalResponse {
  success: boolean;
  goal: UserGoal;
  error?: string;
}

export interface UpdateGoalResponse {
  success: boolean;
  goal: UserGoal;
  error?: string;
}

export interface DeleteGoalResponse {
  success: boolean;
  message: string;
  error?: string;
}

// UI component prop types
export interface GoalCardProps {
  goal: UserGoal;
  onEdit: () => void;
  showCompleted?: boolean;
}

export interface GoalFormData {
  goalTypeId: string;
  targetValue?: number;
  targetUnit?: string;
  targetDate?: string;
  timePeriod?: 'weekly' | 'monthly' | 'single_activity' | 'ongoing';
  notes?: string;
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  priority?: number;
  // Pace-specific fields
  targetPaceMinutes?: number;
  targetPaceSeconds?: number;
  // Frequency-specific fields
  targetFrequency?: number;
  // Heart rate specific fields
  targetZones?: number[];
}

// Helper types for calculations
export interface GoalProgressSummary {
  goalId: string;
  goalName: string;
  targetValue?: number;
  currentProgress: number;
  bestResult?: number;
  progressPercentage: number;
  isCompleted: boolean;
  daysRemaining?: number;
  estimatedCompletion?: string;
  recentTrend: 'improving' | 'declining' | 'stable';
}

export interface ActivityContribution {
  activityId: string;
  activityDate: string;
  contributionAmount: number;
  valueAchieved?: number;
  goalIds: string[]; // Which goals this activity contributed to
}

// Goal metric calculation types
export interface MetricCalculation {
  metricType: string;
  value: number;
  unit: string;
  calculationMethod: string;
  dataPoints: number; // How many activities contributed to this calculation
  confidenceLevel: 'high' | 'medium' | 'low'; // Based on data quality
}

// Target setting guidance
export interface TargetGuidance {
  category: string;
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  recommended_targets: {
    conservative: number;
    moderate: number;
    aggressive: number;
  };
  unit: string;
  tips: string[];
  warning?: string;
}

// Types for different goal categories
export interface DistanceGoal extends UserGoal {
  goal_type: GoalType & { category: 'distance' };
  target_value: number; // Required for distance goals
  target_unit: 'km' | 'miles';
}

export interface PaceGoal extends UserGoal {
  goal_type: GoalType & { category: 'pace' };
  target_value: number; // Target pace in seconds per km
  target_unit: 'min/km' | 'min/mile';
  goal_data: GoalData & {
    distance_range?: [number, number];
    target_pace_seconds: number;
  };
}

export interface FrequencyGoal extends UserGoal {
  goal_type: GoalType & { category: 'frequency' };
  target_value: number; // Number of runs
  target_unit: 'runs';
  time_period: 'weekly' | 'monthly';
}

export interface HeartRateGoal extends UserGoal {
  goal_type: GoalType & { category: 'heart_rate' };
  target_value: number; // Minutes in target zones
  target_unit: 'minutes';
  goal_data: GoalData & {
    target_zones: number[];
    zone_ranges?: GoalData['zone_ranges'];
  };
}

// Form types for the onboarding modal
export interface OnboardingGoalsForm {
  selectedGoals: GoalFormData[];
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
export interface GoalProgressCalculation {
  goalId: string;
  goalType: string;
  targetValue?: number;
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
