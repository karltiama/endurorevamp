/**
 * Centralized React Query keys for the entire application
 */
export const QUERY_KEYS = {
  // Authentication & Users
  user: {
    profile: 'user-profile',
    activities: (userId: string) => ['user', 'activities', userId],
    preferences: (userId: string) => ['user', 'preferences', userId],
  },

  // Strava Integration
  strava: {
    connection: (userId?: string) =>
      ['strava-connection', userId].filter(Boolean),
    token: (userId?: string) => ['strava-token', userId].filter(Boolean),
    sync: {
      status: 'strava-sync-status',
      activities: 'strava-activities',
    },
    athlete: 'strava-athlete',
    activities: 'strava-activities',
    weeklyMetrics: 'strava-weekly-metrics',
  },

  // Goals & Progress
  goals: {
    types: 'goal-types',
    userGoals: (userId: string) => ['user-goals', userId],
    goalProgress: (goalId: string) => ['goal-progress', goalId],
    onboarding: (userId: string) => ['onboarding', userId],
  },

  // Training & Analytics
  training: {
    load: (userId: string) => ['training', 'load', userId],
    zones: (userId: string) => ['zone-analysis', userId],
    metrics: (userId: string) => ['training-metrics', userId],
  },

  // Dashboard
  dashboard: {
    keyMetrics: (userId: string) => ['dashboard', 'key-metrics', userId],
    lastActivity: (userId: string) => ['dashboard', 'last-activity', userId],
    monthlyChart: (userId: string) => ['dashboard', 'monthly-chart', userId],
  },

  // Activities & Performance
  activities: {
    user: (userId: string) => ['user', 'activities', userId],
    monthly: (userId: string, year: number, month: number) => [
      'activities',
      'monthly',
      userId,
      year,
      month,
    ],
    analytics: (userId: string) => ['activities', 'analytics', userId],
  },

  // API Routes (for invalidation)
  api: {
    goals: 'api-goals',
    activities: 'api-activities',
    training: 'api-training',
    onboarding: 'api-onboarding',
  },
} as const;

/**
 * Helper functions for query key management
 */
export const QueryKeyHelpers = {
  /**
   * Get all query keys for a specific user (for bulk invalidation)
   */
  getUserKeys: (userId: string) => [
    ...QUERY_KEYS.user.activities(userId),
    ...QUERY_KEYS.user.preferences(userId),
    ...QUERY_KEYS.goals.userGoals(userId),
    ...QUERY_KEYS.training.load(userId),
    ...QUERY_KEYS.training.zones(userId),
    ...QUERY_KEYS.dashboard.keyMetrics(userId),
    ...QUERY_KEYS.dashboard.lastActivity(userId),
    ...QUERY_KEYS.activities.user(userId),
  ],

  /**
   * Get all Strava-related keys (for Strava operations)
   */
  getStravaKeys: (userId?: string) => [
    ...QUERY_KEYS.strava.connection(userId),
    ...QUERY_KEYS.strava.token(userId),
    QUERY_KEYS.strava.sync.status,
    QUERY_KEYS.strava.sync.activities,
    QUERY_KEYS.strava.athlete,
    QUERY_KEYS.strava.activities,
    QUERY_KEYS.strava.weeklyMetrics,
  ],

  /**
   * Get all dashboard-related keys
   */
  getDashboardKeys: (userId: string) => [
    ...QUERY_KEYS.dashboard.keyMetrics(userId),
    ...QUERY_KEYS.dashboard.lastActivity(userId),
    ...QUERY_KEYS.dashboard.monthlyChart(userId),
    ...QUERY_KEYS.activities.user(userId),
    ...QUERY_KEYS.training.load(userId),
  ],

  /**
   * Get all goal-related keys
   */
  getGoalKeys: (userId: string) => [
    QUERY_KEYS.goals.types,
    ...QUERY_KEYS.goals.userGoals(userId),
    ...QUERY_KEYS.goals.onboarding(userId),
  ],
};

/**
 * Query key validation (development helper)
 */
export const validateQueryKey = (key: unknown): boolean => {
  if (typeof key === 'string') return true;
  if (Array.isArray(key)) {
    return key.every(
      item =>
        typeof item === 'string' ||
        typeof item === 'number' ||
        typeof item === 'boolean'
    );
  }
  return false;
};

/**
 * Export specific key builders for backward compatibility
 */
export const USER_ACTIVITIES_KEY = QUERY_KEYS.user.activities;
export const STRAVA_CONNECTION_KEY = QUERY_KEYS.strava.connection;
export const STRAVA_TOKEN_KEY = QUERY_KEYS.strava.token;
export const STRAVA_SYNC_STATUS_KEY = QUERY_KEYS.strava.sync.status;
export const TRAINING_LOAD_KEY = QUERY_KEYS.training.load;
export const ZONE_ANALYSIS_KEY = QUERY_KEYS.training.zones;

/**
 * Helper function to invalidate related queries
 */
export const getInvalidationKeys = {
  afterActivitySync: (userId: string) => [
    QUERY_KEYS.strava.activities,
    ...QUERY_KEYS.training.zones(userId),
    ...QUERY_KEYS.training.load(userId),
    ...QUERY_KEYS.dashboard.keyMetrics(userId),
    ...QUERY_KEYS.dashboard.lastActivity(userId),
  ],

  afterGoalUpdate: (userId: string) => [
    QUERY_KEYS.goals.types,
    ...QUERY_KEYS.goals.userGoals(userId),
    ...QUERY_KEYS.dashboard.keyMetrics(userId),
  ],

  afterAuthChange: (userId: string) => [
    QUERY_KEYS.user.profile,
    ...QUERY_KEYS.user.preferences(userId),
    QUERY_KEYS.strava.athlete,
  ],
};
