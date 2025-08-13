import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useGoalsOrchestrator,
  useGoalAnalytics,
  useGoalRecommendations,
} from '@/hooks/useGoalsOrchestrator';
import { GoalOrchestrator } from '@/lib/goals/orchestrator';

// Mock the AuthProvider
const mockUser = { id: 'user-1', email: 'test@example.com' };
jest.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({ user: mockUser }),
}));

// Mock the GoalOrchestrator
jest.mock('@/lib/goals/orchestrator', () => ({
  GoalOrchestrator: {
    getGoalAnalytics: jest.fn(),
    getGoalRecommendations: jest.fn(),
    createGoal: jest.fn(),
    createGoalFromSuggestion: jest.fn(),
    updateGoal: jest.fn(),
    manageDashboardGoals: jest.fn(),
    bulkUpdateGoals: jest.fn(),
    archiveCompletedGoals: jest.fn(),
    validateGoalData: jest.fn(),
    getGoalInsights: jest.fn(),
  },
}));

// Mock the useGoals hook
jest.mock('@/hooks/useGoals', () => ({
  goalQueryKeys: {
    all: ['goals'],
    userGoals: ['goals', 'user'],
    goalTypes: ['goals', 'types'],
    onboarding: ['onboarding'],
  },
}));

const mockOrchestrator = GoalOrchestrator as jest.Mocked<
  typeof GoalOrchestrator
>;

// Test wrapper with React Query
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useGoalsOrchestrator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide analytics and recommendations', async () => {
    const mockAnalytics = {
      totalGoals: 5,
      activeGoals: 3,
      completedGoals: 2,
      dashboardGoals: 2,
      goalsByCategory: { distance: 2, frequency: 1 },
      goalsByContext: { manual: 3, suggestion: 2 },
      suggestionGoals: 2,
      autoTrackingGoals: 3,
      averageProgress: 65,
      completionRate: 40,
    };

    const mockRecommendations = [
      {
        id: 'setup_dashboard',
        type: 'dashboard_setup' as const,
        title: 'Set Up Dashboard Goals',
        description: 'Choose goals for your dashboard',
        priority: 'high' as const,
        action: { type: 'manage_dashboard' as const },
      },
    ];

    mockOrchestrator.getGoalAnalytics.mockResolvedValue(mockAnalytics);
    mockOrchestrator.getGoalRecommendations.mockResolvedValue(
      mockRecommendations
    );

    const { result } = renderHook(() => useGoalsOrchestrator(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.analytics).toEqual(mockAnalytics);
      expect(result.current.recommendations).toEqual(mockRecommendations);
    });

    expect(mockOrchestrator.getGoalAnalytics).toHaveBeenCalledWith('user-1');
    expect(mockOrchestrator.getGoalRecommendations).toHaveBeenCalledWith(
      'user-1'
    );
  });

  it('should provide goal creation functions', async () => {
    const mockGoal = {
      id: 'goal-1',
      goal_type_id: 'type-1',
      target_value: 50,
      goal_data: { creation_context: 'manual' },
    } as any;

    mockOrchestrator.createGoal.mockResolvedValue(mockGoal);

    const { result } = renderHook(() => useGoalsOrchestrator(), {
      wrapper: createWrapper(),
    });

    const goalData = {
      goal_type_id: 'type-1',
      target_value: 50,
      goal_data: { notes: 'Test goal' },
    };

    const createdGoal = await result.current.createGoal({
      goalData,
      context: { type: 'manual' },
    });

    expect(createdGoal).toEqual(mockGoal);
    expect(mockOrchestrator.createGoal).toHaveBeenCalledWith(goalData, {
      type: 'manual',
    });
  });

  it('should provide goal update functions', async () => {
    const mockGoal = {
      id: 'goal-1',
      target_value: 60,
      goal_data: { last_updated: '2024-01-01' },
    } as any;

    mockOrchestrator.updateGoal.mockResolvedValue(mockGoal);

    const { result } = renderHook(() => useGoalsOrchestrator(), {
      wrapper: createWrapper(),
    });

    const updates = { target_value: 60 };
    const context = {
      updateType: 'target' as const,
      reason: 'adjusted_target',
    };

    const updatedGoal = await result.current.updateGoal({
      goalId: 'goal-1',
      updates,
      context,
    });

    expect(updatedGoal).toEqual(mockGoal);
    expect(mockOrchestrator.updateGoal).toHaveBeenCalledWith(
      'goal-1',
      updates,
      context
    );
  });

  it('should provide dashboard management functions', async () => {
    const mockUpdatedGoals = [
      {
        id: 'goal-1',
        goal_data: { show_on_dashboard: true, dashboard_priority: 1 },
      },
      {
        id: 'goal-2',
        goal_data: { show_on_dashboard: true, dashboard_priority: 2 },
      },
    ] as any;

    mockOrchestrator.manageDashboardGoals.mockResolvedValue(mockUpdatedGoals);

    const { result } = renderHook(() => useGoalsOrchestrator(), {
      wrapper: createWrapper(),
    });

    const managedGoals = await result.current.manageDashboardGoals([
      'goal-1',
      'goal-2',
    ]);

    expect(managedGoals).toEqual(mockUpdatedGoals);
    expect(mockOrchestrator.manageDashboardGoals).toHaveBeenCalledWith(
      ['goal-1', 'goal-2'],
      'user-1'
    );
  });

  it('should provide bulk update functions', async () => {
    const mockUpdatedGoals = [
      { id: 'goal-1', target_value: 60 },
      { id: 'goal-2', target_value: 70 },
    ] as any;

    mockOrchestrator.bulkUpdateGoals.mockResolvedValue(mockUpdatedGoals);

    const { result } = renderHook(() => useGoalsOrchestrator(), {
      wrapper: createWrapper(),
    });

    const updates = [
      { goalId: 'goal-1', updates: { target_value: 60 } },
      { goalId: 'goal-2', updates: { target_value: 70 } },
    ];

    const context = { updateType: 'target' as const, reason: 'bulk_update' };

    const updatedGoals = await result.current.bulkUpdateGoals({
      updates,
      context,
    });

    expect(updatedGoals).toEqual(mockUpdatedGoals);
    expect(mockOrchestrator.bulkUpdateGoals).toHaveBeenCalledWith(
      updates,
      context
    );
  });

  it('should provide archive function', async () => {
    mockOrchestrator.archiveCompletedGoals.mockResolvedValue(3);

    const { result } = renderHook(() => useGoalsOrchestrator(), {
      wrapper: createWrapper(),
    });

    const archivedCount = await result.current.archiveCompletedGoals();

    expect(archivedCount).toBe(3);
    expect(mockOrchestrator.archiveCompletedGoals).toHaveBeenCalledWith(
      'user-1'
    );
  });

  it('should provide utility functions', () => {
    const mockValidation = { isValid: true, errors: [] };
    const mockInsights = {
      progressTrend: 'improving' as const,
      timeToCompletion: 30,
      recommendations: ['Keep it up!'],
    };

    mockOrchestrator.validateGoalData.mockReturnValue(mockValidation);
    mockOrchestrator.getGoalInsights.mockResolvedValue(mockInsights);

    const { result } = renderHook(() => useGoalsOrchestrator(), {
      wrapper: createWrapper(),
    });

    const goalData = {
      goal_type_id: 'type-1',
      target_value: 50,
      goal_data: {},
    };

    const validation = result.current.validateGoalData(goalData);
    expect(validation).toEqual(mockValidation);
    expect(mockOrchestrator.validateGoalData).toHaveBeenCalledWith(goalData);

    const insights = result.current.getGoalInsights('goal-1');
    expect(insights).resolves.toEqual(mockInsights);
    expect(mockOrchestrator.getGoalInsights).toHaveBeenCalledWith('goal-1');
  });

  it('should provide loading states', () => {
    mockOrchestrator.getGoalAnalytics.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );
    mockOrchestrator.getGoalRecommendations.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    const { result } = renderHook(() => useGoalsOrchestrator(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoadingAnalytics).toBe(true);
    expect(result.current.isLoadingRecommendations).toBe(true);
  });
});

describe('useGoalAnalytics', () => {
  it('should fetch and return analytics', async () => {
    const mockAnalytics = {
      totalGoals: 5,
      activeGoals: 3,
      completedGoals: 2,
      dashboardGoals: 2,
      goalsByCategory: { distance: 2, frequency: 1 },
      goalsByContext: { manual: 3, suggestion: 2 },
      suggestionGoals: 2,
      autoTrackingGoals: 3,
      averageProgress: 65,
      completionRate: 40,
    };

    mockOrchestrator.getGoalAnalytics.mockResolvedValue(mockAnalytics);

    const { result } = renderHook(() => useGoalAnalytics(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.analytics).toEqual(mockAnalytics);
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockOrchestrator.getGoalAnalytics).toHaveBeenCalledWith('user-1');
  });

  it('should handle errors', async () => {
    const mockError = new Error('Analytics fetch failed');
    mockOrchestrator.getGoalAnalytics.mockRejectedValue(mockError);

    const { result } = renderHook(() => useGoalAnalytics(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toEqual(mockError);
      expect(result.current.isLoading).toBe(false);
    });
  });
});

describe('useGoalRecommendations', () => {
  it('should fetch and return recommendations', async () => {
    const mockRecommendations = [
      {
        id: 'setup_dashboard',
        type: 'dashboard_setup' as const,
        title: 'Set Up Dashboard Goals',
        description: 'Choose goals for your dashboard',
        priority: 'high' as const,
        action: { type: 'manage_dashboard' as const },
      },
    ];

    mockOrchestrator.getGoalRecommendations.mockResolvedValue(
      mockRecommendations
    );

    const { result } = renderHook(() => useGoalRecommendations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.recommendations).toEqual(mockRecommendations);
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockOrchestrator.getGoalRecommendations).toHaveBeenCalledWith(
      'user-1'
    );
  });

  it('should handle errors', async () => {
    const mockError = new Error('Recommendations fetch failed');
    mockOrchestrator.getGoalRecommendations.mockRejectedValue(mockError);

    const { result } = renderHook(() => useGoalRecommendations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toEqual(mockError);
      expect(result.current.isLoading).toBe(false);
    });
  });
});
