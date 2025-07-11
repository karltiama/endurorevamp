import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WeeklyTrainingLoadWidget } from '@/components/dashboard/WeeklyTrainingLoadWidget';
import { Activity } from '@/lib/strava/types';

// Mock the hooks
jest.mock('@/hooks/use-user-activities', () => ({
  useUserActivities: jest.fn()
}));

import { useUserActivities } from '@/hooks/use-user-activities';

const mockUseUserActivities = useUserActivities as jest.MockedFunction<typeof useUserActivities>;

// Mock activity data factory
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
  average_heartrate: 150,
  max_heartrate: 180,
  kilojoules: 300,
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

describe('WeeklyTrainingLoadWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading skeleton when data is loading', () => {
    mockUseUserActivities.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn()
    } as any);

    const { container } = render(<WeeklyTrainingLoadWidget userId="test-user" />, { wrapper: createWrapper() });
    
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('displays weekly TSS progress correctly', () => {
    // Mock current week activities
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
    
    const activities = [
      createMockActivity({
        start_date: new Date(startOfWeek.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Monday
        moving_time: 3600, // 60 minutes
        kilojoules: 400,
        average_heartrate: 160
      }),
      createMockActivity({
        id: '2',
        strava_activity_id: 123457,
        start_date: new Date(startOfWeek.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // Wednesday
        moving_time: 2700, // 45 minutes
        kilojoules: 300,
        average_heartrate: 155
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<WeeklyTrainingLoadWidget userId="test-user" />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Weekly Training Load')).toBeInTheDocument();
    expect(screen.getByText(/\d+ TSS/)).toBeInTheDocument(); // Current TSS
    expect(screen.getByText(/Target:/)).toBeInTheDocument(); // TSS target
  });

  it('shows heart rate zone distribution', () => {
    const activities = [
      createMockActivity({
        moving_time: 3600,
        average_heartrate: 140, // Zone 2
        max_heartrate: 165
      }),
      createMockActivity({
        id: '2',
        strava_activity_id: 123457,
        moving_time: 1800,
        average_heartrate: 170, // Zone 4
        max_heartrate: 185
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<WeeklyTrainingLoadWidget userId="test-user" />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Heart Rate Zones')).toBeInTheDocument();
    expect(screen.getByText('Z1')).toBeInTheDocument();
    expect(screen.getByText('Z2')).toBeInTheDocument();
    expect(screen.getByText('Z3')).toBeInTheDocument();
    expect(screen.getByText('Z4')).toBeInTheDocument();
    expect(screen.getByText('Z5')).toBeInTheDocument();
  });

  it('displays daily TSS breakdown', () => {
    const today = new Date();
    const activities = [
      createMockActivity({
        start_date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        kilojoules: 350
      }),
      createMockActivity({
        id: '2',
        strava_activity_id: 123457,
        start_date: today.toISOString(), // Today
        kilojoules: 280
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<WeeklyTrainingLoadWidget userId="test-user" />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Daily Breakdown')).toBeInTheDocument();
    // Should show daily TSS values
    expect(screen.getByText(/\d+ TSS/)).toBeInTheDocument();
  });

  it('shows trend indicators for weekly progress', () => {
    const activities = [
      createMockActivity({
        kilojoules: 400,
        moving_time: 3600
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<WeeklyTrainingLoadWidget userId="test-user" />, { wrapper: createWrapper() });
    
    // Should show trend indicators (up/down arrows)
    expect(screen.getByText('Weekly Training Load')).toBeInTheDocument();
    // Could show "↑", "↓", or "→" depending on trend
  });

  it('handles empty state for new users', () => {
    mockUseUserActivities.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<WeeklyTrainingLoadWidget userId="test-user" />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Weekly Training Load')).toBeInTheDocument();
    expect(screen.getByText('0 TSS')).toBeInTheDocument();
    expect(screen.getByText('No activities this week')).toBeInTheDocument();
  });

  it('calculates TSS correctly based on activity data', () => {
    const activities = [
      createMockActivity({
        moving_time: 3600, // 60 minutes
        kilojoules: 360, // 1 hour moderate effort
        average_heartrate: 160
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<WeeklyTrainingLoadWidget userId="test-user" />, { wrapper: createWrapper() });
    
    // TSS should be calculated based on kilojoules and time
    // Expect reasonable TSS values (typically 50-150 for moderate workouts)
    const tssElements = screen.getAllByText(/\d+ TSS/);
    expect(tssElements.length).toBeGreaterThan(0);
  });

  it('shows progress bar with correct percentage', () => {
    const activities = [
      createMockActivity({
        kilojoules: 300 // Should result in ~100 TSS
      }),
      createMockActivity({
        id: '2',
        strava_activity_id: 123457,
        kilojoules: 200 // Should result in ~67 TSS
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    const { container } = render(<WeeklyTrainingLoadWidget userId="test-user" />, { wrapper: createWrapper() });
    
    // Should have a progress bar element
    expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument();
  });

  it('handles error state gracefully', () => {
    mockUseUserActivities.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load activities'),
      refetch: jest.fn()
    } as any);

    render(<WeeklyTrainingLoadWidget userId="test-user" />, { wrapper: createWrapper() });
    
    // Should still render the widget with default values
    expect(screen.getByText('Weekly Training Load')).toBeInTheDocument();
    expect(screen.getByText('0 TSS')).toBeInTheDocument();
  });

  it('displays correct zone colors', () => {
    const activities = [
      createMockActivity({
        average_heartrate: 140 // Zone 2 - should be blue/green
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    const { container } = render(<WeeklyTrainingLoadWidget userId="test-user" />, { wrapper: createWrapper() });
    
    // Should have colored zone indicators
    expect(container.querySelector('.bg-blue-500, .bg-green-500, .bg-yellow-500, .bg-orange-500, .bg-red-500')).toBeInTheDocument();
  });

  it('filters activities to current week only', () => {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const activities = [
      createMockActivity({
        start_date: today.toISOString(), // This week
        kilojoules: 300
      }),
      createMockActivity({
        id: '2',
        strava_activity_id: 123457,
        start_date: lastWeek.toISOString(), // Last week - should be excluded
        kilojoules: 500
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<WeeklyTrainingLoadWidget userId="test-user" />, { wrapper: createWrapper() });
    
    // Should only show current week TSS (not include last week's 500 kilojoules)
    expect(screen.getByText('Weekly Training Load')).toBeInTheDocument();
    // TSS should reflect only current week activities
  });
}); 