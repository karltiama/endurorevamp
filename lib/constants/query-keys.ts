/**
 * Centralized React Query keys for consistent caching
 */
export const queryKeys = {
  // Auth
  auth: {
    user: ['auth', 'user'] as const,
    session: ['auth', 'session'] as const,
  },
  
  // Strava
  strava: {
    athlete: ['strava', 'athlete'] as const,
    activities: (filters?: any) => ['strava', 'activities', filters] as const,
    activity: (id: string) => ['strava', 'activity', id] as const,
    token: ['strava', 'token'] as const,
    sync: ['strava', 'sync'] as const,
  },
  
  // Training
  training: {
    zones: ['training', 'zones'] as const,
    zoneAnalysis: ['zone-analysis'] as const,
    trainingLoad: ['training', 'load'] as const,
  },
  
  // Goals
  goals: {
    all: ['goals'] as const,
    userGoals: (userId: string) => ['goals', 'user', userId] as const,
    progress: (goalId: string) => ['goals', 'progress', goalId] as const,
  },
  
  // Dashboard
  dashboard: {
    keyMetrics: ['dashboard', 'key-metrics'] as const,
    recentActivities: ['dashboard', 'recent-activities'] as const,
  },
} as const

/**
 * Helper function to invalidate related queries
 */
export const getInvalidationKeys = {
  afterActivitySync: () => [
    queryKeys.strava.activities(),
    queryKeys.training.zones,
    queryKeys.training.trainingLoad,
    queryKeys.dashboard.keyMetrics,
    queryKeys.dashboard.recentActivities,
  ],
  
  afterGoalUpdate: (userId: string) => [
    queryKeys.goals.all,
    queryKeys.goals.userGoals(userId),
    queryKeys.dashboard.keyMetrics,
  ],
  
  afterAuthChange: () => [
    queryKeys.auth.user,
    queryKeys.auth.session,
    queryKeys.strava.athlete,
  ],
} 