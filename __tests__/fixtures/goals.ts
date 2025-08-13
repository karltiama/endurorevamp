// Shared realistic mock data for all goal-related tests
// This ensures consistency and prevents test failures from mismatched data shapes

export const mockGoalTypes = [
  {
    id: 'weekly-distance',
    name: 'weekly_distance',
    display_name: 'Weekly Distance',
    description: 'Track your weekly running distance',
    category: 'distance' as const,
    metric_type: 'total_distance',
    unit: 'km',
    calculation_method: 'sum',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'monthly-runs',
    name: 'monthly_runs',
    display_name: 'Monthly Runs',
    description: 'Complete a certain number of runs each month',
    category: 'frequency' as const,
    metric_type: 'run_count',
    unit: 'runs',
    calculation_method: 'count',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

export const mockGoals = [
  {
    id: '1',
    user_id: 'user-1',
    goal_type_id: 'weekly-distance',
    target_value: 50,
    target_unit: 'km',
    current_progress: 25,
    is_active: true,
    is_completed: false,
    priority: 1,
    time_period: 'weekly' as const,
    streak_count: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    goal_type: mockGoalTypes[0],
    goal_data: {
      show_on_dashboard: false,
    },
  },
  {
    id: '2',
    user_id: 'user-1',
    goal_type_id: 'monthly-runs',
    target_value: 20,
    target_unit: 'runs',
    current_progress: 12,
    is_active: true,
    is_completed: false,
    priority: 2,
    time_period: 'monthly' as const,
    streak_count: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    goal_type: mockGoalTypes[1],
    goal_data: {
      show_on_dashboard: true,
      dashboard_priority: 1,
    },
  },
];

export const mockUserGoalsResponse = {
  goals: mockGoals,
  onboarding: null,
};

// Supabase response shape for consistency
export const mockSupabaseGoalsResponse = {
  data: mockGoals,
  error: null,
  count: mockGoals.length,
  status: 200,
  statusText: 'OK',
};

// Common hook return shapes
export const createMockUseUserGoalsReturn = (overrides = {}) => ({
  data: mockUserGoalsResponse,
  isLoading: false,
  isError: false,
  error: null,
  refetch: jest.fn(),
  isRefetching: false,
  isSuccess: true,
  ...overrides,
});

export const createMockUseGoalTypesReturn = (overrides = {}) => ({
  data: mockGoalTypes,
  isLoading: false,
  isError: false,
  error: null,
  refetch: jest.fn(),
  isRefetching: false,
  isSuccess: true,
  ...overrides,
});
