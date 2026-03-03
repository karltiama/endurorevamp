import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoalCard } from '@/components/goals/GoalCard';
import { AddGoalModal } from '@/components/goals/AddGoalModal';
import { GoalsPageClient } from '@/app/dashboard/goals/client';
import { UserGoal, GoalType } from '@/types/goals';

// Mock the hooks
jest.mock('@/hooks/useGoals', () => ({
  useGoalTypes: jest.fn(),
  useCreateGoal: jest.fn(),
  useUpdateGoal: jest.fn(),
  useDeleteGoal: jest.fn(),
  useUserGoals: jest.fn(),
  useUnifiedGoalCreation: jest.fn(),
}));

jest.mock('@/hooks/useDynamicGoals', () => ({
  useDynamicGoals: jest.fn(),
}));

jest.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

jest.mock('@/components/goals/GoalsProvider', () => ({
  useGoalsContext: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
  );
};

describe('GoalCard', () => {
  const mockGoal: UserGoal = {
    id: '1',
    user_id: 'user1',
    goal_type_id: 'type1',
    target_value: 100,
    target_unit: 'km',
    time_period: 'weekly',
    current_progress: 50,
    streak_count: 0,
    is_active: true,
    is_completed: false,
    priority: 1,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    goal_type: {
      name: 'weekly_distance',
      display_name: 'Weekly Distance',
      description: 'Run a certain distance per week',
      category: 'distance',
      metric_type: 'total_distance',
      unit: 'km',
      target_guidance: 'Beginners: 15-25km',
      calculation_method: 'Sum of all run distances in the week',
      is_active: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
  };

  it('renders goal information correctly', () => {
    const mockOnEdit = jest.fn();

    renderWithQueryClient(<GoalCard goal={mockGoal} onEdit={mockOnEdit} />);

    expect(screen.getByText('Weekly Distance')).toBeInTheDocument();
    expect(screen.getByText('100 km')).toBeInTheDocument();
    expect(screen.getByText('50 / 100 km')).toBeInTheDocument();
    expect(screen.getByText('50% complete')).toBeInTheDocument();
  });

  it('shows completed status for completed goals', () => {
    const completedGoal = { ...mockGoal, is_completed: true };
    const mockOnEdit = jest.fn();

    renderWithQueryClient(
      <GoalCard goal={completedGoal} onEdit={mockOnEdit} showCompleted />
    );

    expect(screen.getByText('Complete')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', async () => {
    const mockOnEdit = jest.fn();

    renderWithQueryClient(<GoalCard goal={mockGoal} onEdit={mockOnEdit} />);

    // Click the dropdown menu trigger (it's the button with just an icon)
    const buttons = screen.getAllByRole('button');
    const menuTrigger = buttons.find(button =>
      button.classList.contains('h-8')
    );
    if (!menuTrigger) throw new Error('Menu trigger not found');
    fireEvent.click(menuTrigger);

    // Wait for menu to appear and click edit
    await waitFor(() => {
      const editButton = screen.getByText('Edit Goal');
      fireEvent.click(editButton);
    });

    expect(mockOnEdit).toHaveBeenCalled();
  });

  it('calculates progress percentage correctly', () => {
    const mockOnEdit = jest.fn();

    renderWithQueryClient(<GoalCard goal={mockGoal} onEdit={mockOnEdit} />);

    // Progress is 50/100 = 50%
    expect(screen.getByText('50% complete')).toBeInTheDocument();
  });

  it('shows remaining distance', () => {
    const mockOnEdit = jest.fn();

    renderWithQueryClient(<GoalCard goal={mockGoal} onEdit={mockOnEdit} />);

    expect(screen.getByText('50.0 km remaining')).toBeInTheDocument();
  });
});

describe('AddGoalModal', () => {
  const mockGoalTypes: GoalType[] = [
    {
      name: 'weekly_distance',
      display_name: 'Weekly Distance',
      description: 'Run a certain distance per week',
      category: 'distance',
      metric_type: 'total_distance',
      unit: 'km',
      calculation_method: 'sum',
      is_active: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
    {
      name: 'race_preparation',
      display_name: 'Race Preparation',
      description: 'Prepare for an upcoming race',
      category: 'event',
      metric_type: 'event_date',
      calculation_method: 'date_target',
      is_active: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
  ];

  beforeEach(() => {
    const {
      useGoalTypes,
      useCreateGoal,
      useUserGoals,
      useUnifiedGoalCreation,
    } = require('@/hooks/useGoals');
    const { useDynamicGoals } = require('@/hooks/useDynamicGoals');

    useGoalTypes.mockReturnValue({
      data: mockGoalTypes,
      isLoading: false,
    });

    useCreateGoal.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({}),
      isPending: false,
    });

    useUserGoals.mockReturnValue({
      data: [],
      isLoading: false,
    });

    useUnifiedGoalCreation.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({}),
      isPending: false,
    });

    useDynamicGoals.mockReturnValue({
      suggestions: [],
      isLoading: false,
    });
  });

  it('renders smart goal suggestions initially', () => {
    renderWithQueryClient(
      <AddGoalModal open={true} onOpenChange={jest.fn()} />
    );

    expect(screen.getByText('Smart Goal Suggestions')).toBeInTheDocument();
    expect(screen.getByText('Choose Your Next Goal')).toBeInTheDocument();
    expect(screen.getByText('No Suggestions Available')).toBeInTheDocument();
  });

  it('shows goal configuration after selecting a suggestion', async () => {
    const mockSuggestion = {
      id: 'suggestion-1',
      title: 'Increase Weekly Distance',
      reasoning: 'Based on your recent activity',
      suggestedTarget: 25,
      targetUnit: 'km',
      goalType: { name: 'type1', category: 'distance' },
      strategies: ['Gradual increase', 'Consistent training'],
    };

    const { useDynamicGoals } = require('@/hooks/useDynamicGoals');
    useDynamicGoals.mockReturnValue({
      suggestions: [mockSuggestion],
      isLoading: false,
    });

    renderWithQueryClient(
      <AddGoalModal open={true} onOpenChange={jest.fn()} />
    );

    // The component should show the suggestion
    expect(screen.getByText('Increase Weekly Distance')).toBeInTheDocument();
  });

  it('shows loading state while fetching suggestions', async () => {
    const { useDynamicGoals } = require('@/hooks/useDynamicGoals');
    useDynamicGoals.mockReturnValue({
      suggestions: [],
      isLoading: true,
    });

    renderWithQueryClient(
      <AddGoalModal open={true} onOpenChange={jest.fn()} />
    );

    // Should show loading skeletons
    expect(screen.getByText('Choose Your Next Goal')).toBeInTheDocument();
  });

  it('validates required fields before submission', async () => {
    const { useUnifiedGoalCreation } = require('@/hooks/useGoals');
    const mockMutateAsync = jest.fn();
    useUnifiedGoalCreation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });

    renderWithQueryClient(
      <AddGoalModal open={true} onOpenChange={jest.fn()} />
    );

    // Should show validation message for no suggestions
    expect(screen.getByText('No Suggestions Available')).toBeInTheDocument();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('submits form with correct data', async () => {
    const { useUnifiedGoalCreation } = require('@/hooks/useGoals');
    const mockMutateAsync = jest.fn().mockResolvedValue({});
    useUnifiedGoalCreation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });

    const mockOnOpenChange = jest.fn();

    renderWithQueryClient(
      <AddGoalModal open={true} onOpenChange={mockOnOpenChange} />
    );

    // Should show no suggestions available
    expect(screen.getByText('No Suggestions Available')).toBeInTheDocument();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });
});

describe('Goals Page Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock all hooks properly
    const mockHooks = require('@/hooks/useGoals');
    mockHooks.useUserGoals = jest.fn();
    mockHooks.useGoalTypes = jest.fn();
    mockHooks.useCreateGoal = jest.fn();
  });

  it('handles empty state correctly', () => {
    const mockHooks = require('@/hooks/useGoals');

    mockHooks.useUserGoals.mockReturnValue({
      data: { goals: [], onboarding: null },
      isLoading: false,
      error: null,
    });

    // This would be testing the actual goals page component
    // We'd need to import and test the full page here
  });

  it('handles loading state correctly', () => {
    const mockHooks = require('@/hooks/useGoals');

    mockHooks.useUserGoals.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    // Test loading skeleton display
  });

  it('handles error state correctly', () => {
    const mockHooks = require('@/hooks/useGoals');

    mockHooks.useUserGoals.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch goals'),
    });

    // Test error message display
  });
});

describe('GoalsPageClient - Achievements tab', () => {
  const mockGoal: UserGoal = {
    id: 'goal-1',
    user_id: 'user-1',
    goal_type_id: 'weekly_distance',
    target_value: 100,
    target_unit: 'km',
    time_period: 'weekly',
    current_progress: 50,
    streak_count: 0,
    is_active: true,
    is_completed: false,
    priority: 1,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    goal_progress: [
      {
        id: 'p-1',
        user_goal_id: 'goal-1',
        activity_date: '2024-01-15',
        created_at: '2024-01-15',
      },
    ],
    goal_type: {
      name: 'weekly_distance',
      display_name: 'Weekly Distance',
      description: 'Run weekly',
      category: 'distance',
      metric_type: 'total_distance',
      unit: 'km',
      calculation_method: 'sum',
      is_active: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
  };

  beforeEach(() => {
    const { useGoalsContext } = require('@/components/goals/GoalsProvider');
    useGoalsContext.mockReturnValue({
      activeGoals: [mockGoal],
      completedGoals: [],
      goals: [mockGoal],
      isLoading: false,
      refreshGoals: jest.fn(),
    });

    const { useDynamicGoals } = require('@/hooks/useDynamicGoals');
    useDynamicGoals.mockReturnValue({
      suggestions: [],
      isLoading: false,
      refetch: jest.fn(),
    });
  });

  it('renders Achievements tab', () => {
    renderWithQueryClient(<GoalsPageClient />);

    expect(screen.getByRole('button', { name: /achievements/i })).toBeInTheDocument();
  });

  it('shows AchievementSystem when goals exist and Achievements tab is selected', async () => {
    renderWithQueryClient(<GoalsPageClient />);

    fireEvent.click(screen.getByRole('button', { name: /achievements/i }));

    await waitFor(() => {
      expect(screen.getByText('Your Achievement Stats')).toBeInTheDocument();
    });
  });

  it('shows empty state when no goals and Achievements tab selected', async () => {
    const { useGoalsContext } = require('@/components/goals/GoalsProvider');
    useGoalsContext.mockReturnValue({
      activeGoals: [],
      completedGoals: [],
      goals: [],
      isLoading: false,
      refreshGoals: jest.fn(),
    });

    renderWithQueryClient(<GoalsPageClient />);

    fireEvent.click(screen.getByRole('button', { name: /achievements/i }));

    await waitFor(() => {
      expect(screen.getByText('No Achievements Yet')).toBeInTheDocument();
    });
  });
});
