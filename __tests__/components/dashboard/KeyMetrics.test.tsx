import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KeyMetrics } from '@/components/dashboard/KeyMetrics';
import { Activity } from '@/lib/strava/types';

// Mock the hooks
jest.mock('@/hooks/useGoals', () => ({
  useUserGoals: jest.fn(),
  useUpdateGoal: jest.fn(() => ({ mutate: jest.fn(), isLoading: false, error: null })),
  useCreateGoal: jest.fn(() => ({ mutate: jest.fn(), isLoading: false, error: null })),
  useDeleteGoal: jest.fn(() => ({ mutate: jest.fn(), isLoading: false, error: null })),
  useGoalTypes: jest.fn(() => ({ data: [], isLoading: false, error: null })),
}));

jest.mock('@/hooks/use-user-activities', () => ({
  useUserActivities: jest.fn()
}));

jest.mock('@/hooks/useUnitPreferences', () => ({
  useUnitPreferences: jest.fn()
}));

import { useUserGoals } from '@/hooks/useGoals';
import { useUserActivities } from '@/hooks/use-user-activities';
import { useUnitPreferences } from '@/hooks/useUnitPreferences';

const mockUseUserGoals = useUserGoals as jest.MockedFunction<typeof useUserGoals>;
const mockUseUserActivities = useUserActivities as jest.MockedFunction<typeof useUserActivities>;
const mockUseUnitPreferences = useUnitPreferences as jest.MockedFunction<typeof useUnitPreferences>;

const createMockActivity = (overrides: Partial<Activity> = {}): Activity => ({
  id: '1',
  user_id: 'user-1',
  strava_activity_id: 123456,
  name: 'Morning Run',
  sport_type: 'Run',
  start_date: new Date().toISOString(),
  start_date_local: new Date().toISOString(),
  timezone: 'America/New_York',
  distance: 5000, // 5km
  moving_time: 1800, // 30 minutes
  elapsed_time: 1900,
  total_elevation_gain: 100,
  ...overrides,
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('KeyMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock for unit preferences
    mockUseUnitPreferences.mockReturnValue({
      preferences: { distance: 'km', pace: 'min/km' },
      updatePreferences: jest.fn(),
      setDistanceUnit: jest.fn(),
      toggleUnits: jest.fn(),
      isLoading: false
    });
  });

  it('renders loading skeleton when data is loading', () => {
    mockUseUserGoals.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn()
    } as any);
    
    mockUseUserActivities.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn()
    } as any);

    const { container } = render(<KeyMetrics userId="test-user" />, { wrapper: createWrapper() });
    
    // Should show skeleton loading cards - look for the specific skeleton structure
    const skeletonCards = container.querySelectorAll('.animate-pulse');
    expect(skeletonCards).toHaveLength(3); // 3 skeleton cards
  });

  it('renders setup message when no dashboard goals are configured', () => {
    mockUseUserGoals.mockReturnValue({
      data: { goals: [], onboarding: null },
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);
    
    mockUseUserActivities.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<KeyMetrics userId="test-user" />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Set Up Your Dashboard Goals')).toBeInTheDocument();
    expect(screen.getByText('Choose Dashboard Goals')).toBeInTheDocument();
  });

  it('renders goal metrics for dashboard goals', () => {
    const mockGoals = [
      {
        id: '1',
        user_id: 'test-user',
        goal_type_id: 'weekly-distance',
        target_value: 20,
        target_unit: 'km',
        time_period: 'weekly',
        current_progress: 15,
        is_active: true,
        is_completed: false,
        priority: 1,
        goal_data: {
          show_on_dashboard: true,
          dashboard_priority: 1
        },
        goal_type: {
          id: 'weekly-distance',
          display_name: 'Weekly Distance',
          category: 'distance',
          name: 'weekly_distance_goal'
        }
      },
      {
        id: '2',
        user_id: 'test-user',
        goal_type_id: 'frequency',
        target_value: 3,
        target_unit: 'runs',
        time_period: 'weekly',
        current_progress: 2,
        is_active: true,
        is_completed: false,
        priority: 2,
        goal_data: {
          show_on_dashboard: true,
          dashboard_priority: 2
        },
        goal_type: {
          id: 'frequency',
          display_name: 'Weekly Runs',
          category: 'frequency',
          name: 'weekly_frequency_goal'
        }
      }
    ];

    mockUseUserGoals.mockReturnValue({
      data: { goals: mockGoals, onboarding: null },
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);
    
    mockUseUserActivities.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<KeyMetrics userId="test-user" />, { wrapper: createWrapper() });
    
    // Should show goal metric cards
    expect(screen.getByText('Weekly Distance')).toBeInTheDocument();
    expect(screen.getByText('Weekly Runs')).toBeInTheDocument();
    expect(screen.getByText('15.0 km')).toBeInTheDocument(); // current progress
    expect(screen.getByText('2 runs')).toBeInTheDocument(); // current progress
    expect(screen.getByText('75.0%')).toBeInTheDocument(); // 15/20 * 100
    expect(screen.getByText('66.7%')).toBeInTheDocument(); // 2/3 * 100
  });

  it('sorts dashboard goals by priority', () => {
    const mockGoals = [
      {
        id: '1',
        user_id: 'test-user',
        goal_type_id: 'goal-1',
        target_value: 20,
        is_active: true,
        is_completed: false,
        current_progress: 10,
        goal_data: {
          show_on_dashboard: true,
          dashboard_priority: 3
        },
        goal_type: {
          id: 'goal-1',
          display_name: 'Third Priority',
          category: 'distance'
        }
      },
      {
        id: '2',
        user_id: 'test-user',
        goal_type_id: 'goal-2',
        target_value: 30,
        is_active: true,
        is_completed: false,
        current_progress: 15,
        goal_data: {
          show_on_dashboard: true,
          dashboard_priority: 1
        },
        goal_type: {
          id: 'goal-2',
          display_name: 'First Priority',
          category: 'distance'
        }
      }
    ];

    mockUseUserGoals.mockReturnValue({
      data: { goals: mockGoals, onboarding: null },
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);
    
    mockUseUserActivities.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<KeyMetrics userId="test-user" />, { wrapper: createWrapper() });
    
    const priorityBadges = screen.getAllByText(/#\d/);
    expect(priorityBadges[0]).toHaveTextContent('#1'); // First Priority should be first
    expect(priorityBadges[1]).toHaveTextContent('#2'); // Third Priority should be second
  });
}); 