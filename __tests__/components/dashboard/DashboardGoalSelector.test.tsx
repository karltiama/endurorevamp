import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardGoalSelector } from '@/components/dashboard/DashboardGoalSelector';
import { useUserGoals, useUpdateGoal, useGoalTypes } from '@/hooks/useGoals';

// Mock the hooks
jest.mock('@/hooks/useGoals', () => ({
  useUserGoals: jest.fn(),
  useUpdateGoal: jest.fn(),
  useGoalTypes: jest.fn(),
  useCreateGoal: jest.fn(),
  useDeleteGoal: jest.fn(),
}));

const mockUseUserGoals = useUserGoals as jest.MockedFunction<typeof useUserGoals>;
const mockUseUpdateGoal = useUpdateGoal as jest.MockedFunction<typeof useUpdateGoal>;
const mockUseGoalTypes = useGoalTypes as jest.MockedFunction<typeof useGoalTypes>;

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Mock goal data
const mockGoals = [
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
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    goal_type: {
      id: 'weekly-distance',
      name: 'weekly_distance',
      display_name: 'Weekly Distance',
      description: 'Track your weekly running distance',
      category: 'distance' as const,
      metric_type: 'total_distance',
      unit: 'km',
      calculation_method: 'sum',
      is_active: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    },
    goal_data: {
      show_on_dashboard: false
    }
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
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    goal_type: {
      id: 'monthly-runs',
      name: 'monthly_runs',
      display_name: 'Monthly Runs',
      description: 'Complete a certain number of runs each month',
      category: 'frequency' as const,
      metric_type: 'run_count',
      unit: 'runs',
      calculation_method: 'count',
      is_active: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    },
    goal_data: {
      show_on_dashboard: true,
      dashboard_priority: 1
    }
  },
  {
    id: '3',
    user_id: 'user-1',
    goal_type_id: '5k-pace',
    target_value: 300, // 5:00 min/km in seconds
    target_unit: 'min/km',
    current_progress: 320,
    is_active: true,
    is_completed: false,
    priority: 3,
    time_period: 'ongoing' as const,
    streak_count: 0,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    goal_type: {
      id: '5k-pace',
      name: '5k_pace',
      display_name: '5K Pace',
      description: 'Improve your 5K running pace',
      category: 'pace' as const,
      metric_type: 'average_pace',
      unit: 'min/km',
      calculation_method: 'average',
      is_active: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    },
    goal_data: {
      show_on_dashboard: false
    }
  }
];

describe('DashboardGoalSelector', () => {
  const mockUpdateGoal = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseUserGoals.mockReturnValue({
      data: { goals: mockGoals, onboarding: null },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
      isError: false,
      isSuccess: true
    } as any);

    mockUseUpdateGoal.mockReturnValue({
      mutateAsync: mockUpdateGoal,
      isPending: false,
      isError: false,
      error: null
    } as any);

    mockUseGoalTypes.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
      isError: false,
      isSuccess: true
    } as any);
  });

  it('renders correctly when open', () => {
    render(
      <TestWrapper>
        <DashboardGoalSelector open={true} onOpenChange={jest.fn()} />
      </TestWrapper>
    );

    expect(screen.getByText('Choose Dashboard Goals')).toBeInTheDocument();
    expect(screen.getByText('Select up to 3 goals to track as key metrics on your dashboard')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseUserGoals.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
      isError: false,
      isSuccess: false
    } as any);

    render(
      <TestWrapper>
        <DashboardGoalSelector open={true} onOpenChange={jest.fn()} />
      </TestWrapper>
    );

    expect(screen.getByText('Loading your goals...')).toBeInTheDocument();
  });

  it('displays active goals', () => {
    render(
      <TestWrapper>
        <DashboardGoalSelector open={true} onOpenChange={jest.fn()} />
      </TestWrapper>
    );

    expect(screen.getByText('Weekly Distance')).toBeInTheDocument();
    expect(screen.getByText('Monthly Runs')).toBeInTheDocument();
    expect(screen.getByText('5K Pace')).toBeInTheDocument();
  });

  it('shows current dashboard goals as selected', () => {
    render(
      <TestWrapper>
        <DashboardGoalSelector open={true} onOpenChange={jest.fn()} />
      </TestWrapper>
    );

    // Monthly Runs should be selected as it has show_on_dashboard: true
    expect(screen.getByText('#1 on Dashboard')).toBeInTheDocument();
  });

  it('allows selecting goals up to limit of 3', async () => {
    render(
      <TestWrapper>
        <DashboardGoalSelector open={true} onOpenChange={jest.fn()} />
      </TestWrapper>
    );

    // Click on Weekly Distance goal
    const weeklyGoal = screen.getByText('Weekly Distance').closest('.cursor-pointer') as HTMLElement;
    
    if (weeklyGoal) {
      fireEvent.click(weeklyGoal);
    }

    await waitFor(() => {
      expect(screen.getByText('2/3 goals selected for your dashboard')).toBeInTheDocument();
    });
  });

  it('prevents selecting more than 3 goals', async () => {
    // Mock 4 goals with none selected initially
    const extendedMockGoals = [
      ...mockGoals.map(goal => ({
        ...goal,
        goal_data: { show_on_dashboard: false }
      })),
      {
        id: '4',
        user_id: 'user-1',
        goal_type_id: 'elevation',
        target_value: 1000,
        target_unit: 'm',
        current_progress: 500,
        is_active: true,
        is_completed: false,
        priority: 4,
        time_period: 'monthly' as const,
        streak_count: 0,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        goal_type: {
          id: 'elevation',
          name: 'elevation',
          display_name: 'Monthly Elevation',
          description: 'Climb elevation each month',
          category: 'elevation' as const,
          metric_type: 'total_elevation',
          unit: 'm',
          calculation_method: 'sum',
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        },
        goal_data: {
          show_on_dashboard: false
        }
      }
    ];

    mockUseUserGoals.mockReturnValue({
      data: { goals: extendedMockGoals, onboarding: null },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
      isError: false,
      isSuccess: true
    } as any);

    render(
      <TestWrapper>
        <DashboardGoalSelector open={true} onOpenChange={jest.fn()} />
      </TestWrapper>
    );

    // Select first three goals  
    const goalCards = screen.getAllByText(/Weekly Distance|Monthly Runs|5K Pace|Monthly Elevation/)
      .map(text => text.closest('.cursor-pointer'))
      .filter(Boolean) as HTMLElement[];

    // Click first 3 goals
    for (let i = 0; i < Math.min(3, goalCards.length); i++) {
      const goalCard = goalCards[i];
      if (goalCard) {
        fireEvent.click(goalCard);
      }
    }

    await waitFor(() => {
      expect(screen.getByText('3/3 goals selected for your dashboard')).toBeInTheDocument();
    });

    // Fourth goal should be disabled
    const fourthGoal = goalCards[3];
    if (fourthGoal) {
      expect(fourthGoal).toHaveClass('opacity-60', 'cursor-not-allowed');
    }
  });

  it('saves dashboard goals correctly', async () => {
    const mockOnOpenChange = jest.fn();
    
    render(
      <TestWrapper>
        <DashboardGoalSelector open={true} onOpenChange={mockOnOpenChange} />
      </TestWrapper>
    );

    // Select a goal
    const weeklyGoal = screen.getByText('Weekly Distance').closest('.cursor-pointer') as HTMLElement;
    if (weeklyGoal) {
      fireEvent.click(weeklyGoal);
    }

    // Click save button
    const saveButton = screen.getByRole('button', { name: /Save Dashboard Goals/ });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateGoal).toHaveBeenCalled();
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('shows "Add New Goal" modal when no goals exist', () => {
    mockUseUserGoals.mockReturnValue({
      data: { goals: [], onboarding: null },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
      isError: false,
      isSuccess: true
    } as any);

    render(
      <TestWrapper>
        <DashboardGoalSelector open={true} onOpenChange={jest.fn()} />
      </TestWrapper>
    );

    expect(screen.getByText('No Active Goals')).toBeInTheDocument();
    expect(screen.getByText('Create Your First Goal')).toBeInTheDocument();
  });

  it('handles errors gracefully', async () => {
    mockUpdateGoal.mockRejectedValueOnce(new Error('Failed to update'));

    render(
      <TestWrapper>
        <DashboardGoalSelector open={true} onOpenChange={jest.fn()} />
      </TestWrapper>
    );

    // Select a goal and try to save
    const weeklyGoal = screen.getByText('Weekly Distance').closest('.cursor-pointer');
    if (weeklyGoal) {
      fireEvent.click(weeklyGoal);
    }

    const saveButton = screen.getByRole('button', { name: /Save Dashboard Goals/ });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to update dashboard goals')).toBeInTheDocument();
    });
  });

  it('does not render when closed', () => {
    render(
      <TestWrapper>
        <DashboardGoalSelector open={false} onOpenChange={jest.fn()} />
      </TestWrapper>
    );

    expect(screen.queryByText('Choose Dashboard Goals')).not.toBeInTheDocument();
  });
}); 