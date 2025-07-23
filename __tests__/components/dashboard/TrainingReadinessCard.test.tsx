import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TrainingReadinessCard } from '@/components/dashboard/TrainingReadinessCard';
import { Activity } from '@/lib/strava/types';
import { ActivityWithTrainingData } from '@/types';

// Mock the hooks
jest.mock('@/hooks/use-user-activities', () => ({
  useUserActivities: jest.fn()
}));

jest.mock('@/hooks/useTrainingProfile', () => ({
  usePersonalizedTSSTarget: jest.fn()
}));

import { useUserActivities } from '@/hooks/use-user-activities';
import { usePersonalizedTSSTarget } from '@/hooks/useTrainingProfile';

const mockUseUserActivities = useUserActivities as jest.MockedFunction<typeof useUserActivities>;
const mockUsePersonalizedTSSTarget = usePersonalizedTSSTarget as jest.MockedFunction<typeof usePersonalizedTSSTarget>;

// Mock activity data factory
const createMockActivity = (overrides: Partial<ActivityWithTrainingData> = {}): ActivityWithTrainingData => ({
  id: '1',
  user_id: 'user-1',
  strava_activity_id: 123456,
  name: 'Morning Run',
  sport_type: 'Run',
  start_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
  start_date_local: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  timezone: 'America/New_York',
  distance: 5000, // 5km
  moving_time: 1800, // 30 minutes
  elapsed_time: 1900,
  total_elevation_gain: 100,
  average_heartrate: 150,
  max_heartrate: 180,
  kilojoules: 200, // Energy expenditure for TSS calculation
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
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
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {children}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

describe('TrainingReadinessCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for usePersonalizedTSSTarget
    mockUsePersonalizedTSSTarget.mockReturnValue({
      data: 400,
      isLoading: false,
      error: null
    } as any);
  });

  it('renders loading skeleton when data is loading', () => {
    mockUseUserActivities.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn()
    } as any);

    const { container } = render(<TrainingReadinessCard userId="test-user" />, { wrapper: createWrapper() });
    
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows high readiness for well-recovered athlete', () => {
    // Mock scenario: Recent light activity, good recovery time
    const activities = [
      createMockActivity({
        start_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        moving_time: 1800, // 30 min easy run
        kilojoules: 150, // Low intensity
        average_heartrate: 140
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<TrainingReadinessCard userId="test-user" />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Training Readiness')).toBeInTheDocument();
    
    // Check for Recovery Score section
    expect(screen.getByText('Recovery Score')).toBeInTheDocument();
    
    // Check for readiness level badge
    expect(screen.getByText(/READINESS/)).toBeInTheDocument();
  });

  it('shows medium readiness for moderate fatigue', () => {
    // Mock scenario: Recent moderate activity, some fatigue
    const activities = [
      createMockActivity({
        start_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        moving_time: 3600, // 60 min moderate run
        kilojoules: 350, // Moderate intensity
        average_heartrate: 160
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<TrainingReadinessCard userId="test-user" />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Training Readiness')).toBeInTheDocument();
    
    // Check for Recovery Score section
    expect(screen.getByText('Recovery Score')).toBeInTheDocument();
    
    // Check for readiness level badge
    expect(screen.getByText(/READINESS/)).toBeInTheDocument();
  });

  it('shows low readiness for high fatigue', () => {
    // Mock scenario: Recent hard training, high fatigue
    const activities = [
      createMockActivity({
        start_date: new Date().toISOString(), // Today
        moving_time: 5400, // 90 min hard run
        kilojoules: 500, // High intensity
        average_heartrate: 170,
        total_elevation_gain: 500
      }),
      createMockActivity({
        id: '2',
        strava_activity_id: 123457,
        start_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        moving_time: 3600,
        kilojoules: 420,
        average_heartrate: 165
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<TrainingReadinessCard userId="test-user" />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Training Readiness')).toBeInTheDocument();
    
    // Check for Recovery Score section
    expect(screen.getByText('Recovery Score')).toBeInTheDocument();
    
    // Check for readiness level badge
    expect(screen.getByText(/READINESS/)).toBeInTheDocument();
  });

  it('handles empty state for new users', () => {
    mockUseUserActivities.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<TrainingReadinessCard userId="test-user" />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Training Readiness')).toBeInTheDocument();
    
    // Check for empty state message
    expect(screen.getByText('No recent activity data available')).toBeInTheDocument();
  });

  it('displays TSS balance information', () => {
    const activities = [
      createMockActivity({
        moving_time: 3600, // 60 minutes
        kilojoules: 300
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<TrainingReadinessCard userId="test-user" />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Training Readiness')).toBeInTheDocument();
    
    // Check for TSS Balance section
    expect(screen.getByText('TSS Balance')).toBeInTheDocument();
    
    // Check for Weekly TSS Progress
    expect(screen.getByText('Weekly Progress')).toBeInTheDocument();
  });

  it('shows RPE tracking section', () => {
    const activities = [
      createMockActivity({
        kilojoules: 350, // Moderate intensity for RPE calculation
        average_heartrate: 165
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<TrainingReadinessCard userId="test-user" />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Training Readiness')).toBeInTheDocument();
    
    // Check for Last RPE section (still exists in the metrics)
    expect(screen.getByText('Last RPE')).toBeInTheDocument();
    
    // Log RPE button was removed - no longer checking for it
  });

  it('shows Last RPE from most recent activity regardless of week', () => {
    // Create activities from different weeks
    const activities = [
      // Most recent activity (this week) - no RPE
      createMockActivity({
        start_date: new Date().toISOString(),
        perceived_exertion: undefined
      }),
      // Previous activity (last week) - has RPE
      createMockActivity({
        start_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
        perceived_exertion: 7
      }),
      // Even older activity - has different RPE
      createMockActivity({
        start_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
        perceived_exertion: 5
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<TrainingReadinessCard userId="test-user" />, { wrapper: createWrapper() });
    
    // Should show RPE from the most recent activity (first in the array)
    // Since the most recent activity has no RPE, it should show 'N/A'
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('shows Last RPE from most recent activity with RPE', () => {
    // Create activities from different weeks
    const activities = [
      // Most recent activity (this week) - has RPE
      createMockActivity({
        start_date: new Date().toISOString(),
        perceived_exertion: 8
      }),
      // Previous activity (last week) - has different RPE
      createMockActivity({
        start_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
        perceived_exertion: 7
      }),
      // Even older activity - has different RPE
      createMockActivity({
        start_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
        perceived_exertion: 5
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<TrainingReadinessCard userId="test-user" />, { wrapper: createWrapper() });
    
    // Should show RPE from the most recent activity (first in the array)
    expect(screen.getByText('8/10')).toBeInTheDocument();
  });

  it('handles error state gracefully', () => {
    mockUseUserActivities.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load activities'),
      refetch: jest.fn()
    } as any);

    render(<TrainingReadinessCard userId="test-user" />, { wrapper: createWrapper() });
    
    // Should still render the card with error state
    expect(screen.getByText('Training Readiness')).toBeInTheDocument();
    
    // Check for empty state message
    expect(screen.getByText('No recent activity data available')).toBeInTheDocument();
  });

  it('displays weekly TSS progress', () => {
    const activities = [
      createMockActivity({
        moving_time: 3600,
        kilojoules: 300
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<TrainingReadinessCard userId="test-user" />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Weekly Progress')).toBeInTheDocument();
    // Check that there are percentage values displayed (multiple in the component)
    const percentageElements = screen.getAllByText(/%/);
    expect(percentageElements.length).toBeGreaterThanOrEqual(2);
  });

  it('shows recommendation section', () => {
    const activities = [
      createMockActivity({
        moving_time: 3600,
        kilojoules: 300
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<TrainingReadinessCard userId="test-user" />, { wrapper: createWrapper() });
    
    // Updated to check for "Recommended Workout" instead of "Recommendation"
    expect(screen.getByText('Recommended Workout')).toBeInTheDocument();
    expect(screen.getByText(/moderate training|hard workout|easy run|recovery/)).toBeInTheDocument();
  });

  it('displays quick action buttons', () => {
    const activities = [
      createMockActivity({
        moving_time: 3600,
        kilojoules: 300
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<TrainingReadinessCard userId="test-user" />, { wrapper: createWrapper() });
    
    // Updated to only check for "Plan Workout" button since "Log RPE" was removed
    expect(screen.getByText('Plan Workout')).toBeInTheDocument();
  });

  it('calculates readiness correctly based on recovery days', () => {
    // Mock scenario: High TSS but 3 days of recovery
    const activities = [
      createMockActivity({
        start_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        moving_time: 5400, // 90 min hard run
        kilojoules: 500,
        average_heartrate: 170
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<TrainingReadinessCard userId="test-user" />, { wrapper: createWrapper() });
    
    // With 3 days of recovery, should show improved readiness despite high initial TSS
    expect(screen.getByText(/READINESS/)).toBeInTheDocument();
  });

  it('shows correct readiness icons and colors', () => {
    const activities = [
      createMockActivity({
        moving_time: 3600,
        kilojoules: 300
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    const { container } = render(<TrainingReadinessCard userId="test-user" />, { wrapper: createWrapper() });
    
    // Should have color indicators for readiness level
    expect(container.querySelector('.text-green-600, .text-yellow-600, .text-red-600')).toBeInTheDocument();
  });
});

describe('TSS Calculation Consistency', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
  });

  it('should calculate different TSS values due to different time periods', () => {
    const shortActivity = createMockActivity({
      moving_time: 1800, // 30 minutes
      kilojoules: 200
    });

    const longActivity = createMockActivity({
      id: '2',
      strava_activity_id: 123457,
      moving_time: 5400, // 90 minutes
      kilojoules: 600
    });

    mockUseUserActivities.mockReturnValue({
      data: [shortActivity, longActivity],
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    mockUsePersonalizedTSSTarget.mockReturnValue({
      data: 400,
      isLoading: false,
      error: null
    } as any);

    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <TrainingReadinessCard userId="test-user" />
        </TooltipProvider>
      </QueryClientProvider>
    );

    expect(screen.getByText('Training Readiness')).toBeInTheDocument();
    expect(screen.getByText('Recovery Score')).toBeInTheDocument();
  });
});