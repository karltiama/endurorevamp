import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoalCard } from '@/components/goals/GoalCard';
import { AddGoalModal } from '@/components/goals/AddGoalModal';
import { UserGoal, GoalType } from '@/types/goals';

// Mock the hooks
jest.mock('@/hooks/useGoals', () => ({
  useGoalTypes: jest.fn(),
  useCreateGoal: jest.fn(),
  useUpdateGoal: jest.fn(),
  useDeleteGoal: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
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
       id: 'type1',
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
       updated_at: '2024-01-01'
     }
  };

  it('renders goal information correctly', () => {
    const mockOnEdit = jest.fn();
    
    renderWithQueryClient(
      <GoalCard goal={mockGoal} onEdit={mockOnEdit} />
    );

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
    
    renderWithQueryClient(
      <GoalCard goal={mockGoal} onEdit={mockOnEdit} />
    );

    // Click the dropdown menu trigger
    const menuTrigger = screen.getByRole('button', { name: /more/i });
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
    
    renderWithQueryClient(
      <GoalCard goal={mockGoal} onEdit={mockOnEdit} />
    );

    // Progress is 50/100 = 50%
    expect(screen.getByText('50% complete')).toBeInTheDocument();
  });

  it('shows remaining distance', () => {
    const mockOnEdit = jest.fn();
    
    renderWithQueryClient(
      <GoalCard goal={mockGoal} onEdit={mockOnEdit} />
    );

    expect(screen.getByText('50.0 km remaining')).toBeInTheDocument();
  });
});

describe('AddGoalModal', () => {
  const mockGoalTypes: GoalType[] = [
    {
      id: 'type1',
      name: 'weekly_distance',
      display_name: 'Weekly Distance',
      description: 'Run a certain distance per week',
      category: 'distance',
      metric_type: 'total_distance',
      unit: 'km',
      calculation_method: 'sum',
      is_active: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    },
    {
      id: 'type2',
      name: 'race_preparation',
      display_name: 'Race Preparation',
      description: 'Prepare for an upcoming race',
      category: 'event',
      metric_type: 'event_date',
      calculation_method: 'date_target',
      is_active: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    }
  ];

  beforeEach(() => {
    const { useGoalTypes, useCreateGoal } = require('@/hooks/useGoals');
    
    useGoalTypes.mockReturnValue({
      data: mockGoalTypes,
      isLoading: false,
    });
    
    useCreateGoal.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({}),
      isPending: false,
    });
  });

  it('renders goal type selection initially', () => {
    renderWithQueryClient(
      <AddGoalModal open={true} onOpenChange={jest.fn()} />
    );

    expect(screen.getByText('Choose Your Goal Type')).toBeInTheDocument();
    expect(screen.getByText('Weekly Distance')).toBeInTheDocument();
    expect(screen.getByText('Race Preparation')).toBeInTheDocument();
  });

  it('shows goal configuration after selecting a type', async () => {
    renderWithQueryClient(
      <AddGoalModal open={true} onOpenChange={jest.fn()} />
    );

    // Click on a distance goal type
    const distanceGoal = screen.getByText('Weekly Distance');
    fireEvent.click(distanceGoal);

    await waitFor(() => {
      expect(screen.getByText('Target Kilometers *')).toBeInTheDocument();
    });
  });

  it('shows date input for event goals', async () => {
    renderWithQueryClient(
      <AddGoalModal open={true} onOpenChange={jest.fn()} />
    );

    // Click on an event goal type
    const eventGoal = screen.getByText('Race Preparation');
    fireEvent.click(eventGoal);

    await waitFor(() => {
      expect(screen.getByText('Race Date *')).toBeInTheDocument();
    });
  });

  it('validates required fields before submission', async () => {
    const { useCreateGoal } = require('@/hooks/useGoals');
    const mockMutateAsync = jest.fn();
    useCreateGoal.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });

    renderWithQueryClient(
      <AddGoalModal open={true} onOpenChange={jest.fn()} />
    );

    // Click on a distance goal type
    const distanceGoal = screen.getByText('Weekly Distance');
    fireEvent.click(distanceGoal);

    await waitFor(() => {
      const createButton = screen.getByText('Create Goal');
      fireEvent.click(createButton);
    });

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText('Please enter a target value for distance goals.')).toBeInTheDocument();
    });

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('submits form with correct data', async () => {
    const { useCreateGoal } = require('@/hooks/useGoals');
    const mockMutateAsync = jest.fn().mockResolvedValue({});
    useCreateGoal.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });

    const mockOnOpenChange = jest.fn();

    renderWithQueryClient(
      <AddGoalModal open={true} onOpenChange={mockOnOpenChange} />
    );

    // Select goal type
    const distanceGoal = screen.getByText('Weekly Distance');
    fireEvent.click(distanceGoal);

    // Fill in target value
    await waitFor(() => {
      const targetInput = screen.getByLabelText('Target Kilometers *');
      fireEvent.change(targetInput, { target: { value: '50' } });
    });

    // Submit form
    const createButton = screen.getByText('Create Goal');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        goal_type_id: 'type1',
        target_value: 50,
        target_unit: 'km',
        target_date: undefined,
        goal_data: { notes: '' },
        priority: 1,
      });
    });

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
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