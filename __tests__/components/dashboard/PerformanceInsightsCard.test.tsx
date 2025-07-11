import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PerformanceInsightsCard } from '@/components/dashboard/PerformanceInsightsCard';
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
  average_speed: 2.78, // 10 km/h in m/s
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

describe('PerformanceInsightsCard', () => {
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

    const { container } = render(<PerformanceInsightsCard userId="test-user" />, { wrapper: createWrapper() });
    
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('displays performance insights correctly', () => {
    const activities = [
      createMockActivity({
        start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        average_speed: 2.5, // Slower pace
        distance: 5000
      }),
      createMockActivity({
        id: '2',
        strava_activity_id: 123457,
        start_date: new Date().toISOString(), // Today
        average_speed: 3.0, // Faster pace - improvement
        distance: 5000
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<PerformanceInsightsCard userId="test-user" />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Performance Insights')).toBeInTheDocument();
    expect(screen.getByText('Pace Trend')).toBeInTheDocument();
    expect(screen.getByText('Recent Achievements')).toBeInTheDocument();
  });

  it('shows pace improvement trends', () => {
    const activities = [
      createMockActivity({
        start_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
        average_speed: 2.5, // 5:00 min/km pace
        distance: 5000
      }),
      createMockActivity({
        id: '2',
        strava_activity_id: 123457,
        start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        average_speed: 2.8, // 4:46 min/km pace - improvement
        distance: 5000
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<PerformanceInsightsCard userId="test-user" />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Pace Trend')).toBeInTheDocument();
    // Should show improvement indicators
    expect(screen.getByText(/improving/i)).toBeInTheDocument();
  });

  it('displays consistency streak information', () => {
    const today = new Date();
    const activities = [
      createMockActivity({
        start_date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() // Yesterday
      }),
      createMockActivity({
        id: '2',
        strava_activity_id: 123457,
        start_date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      }),
      createMockActivity({
        id: '3',
        strava_activity_id: 123458,
        start_date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<PerformanceInsightsCard userId="test-user" />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Consistency Streak')).toBeInTheDocument();
    expect(screen.getByText(/3 days/i)).toBeInTheDocument();
  });

  it('shows recent achievements and PRs', () => {
    const activities = [
      createMockActivity({
        distance: 10000, // 10km - potential distance PR
        moving_time: 2400, // 40 minutes
        start_date: new Date().toISOString()
      }),
      createMockActivity({
        id: '2',
        strava_activity_id: 123457,
        distance: 8000, // 8km
        moving_time: 2000,
        start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<PerformanceInsightsCard userId="test-user" />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Recent Achievements')).toBeInTheDocument();
    expect(screen.getByText(/Distance PR/i)).toBeInTheDocument();
  });

  it('displays weekly distance comparison', () => {
    const thisWeek = new Date();
    const lastWeek = new Date(thisWeek.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const activities = [
      createMockActivity({
        start_date: thisWeek.toISOString(),
        distance: 5000 // This week: 5km
      }),
      createMockActivity({
        id: '2',
        strava_activity_id: 123457,
        start_date: lastWeek.toISOString(),
        distance: 3000 // Last week: 3km
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<PerformanceInsightsCard userId="test-user" />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Weekly Distance')).toBeInTheDocument();
    expect(screen.getByText(/vs last week/i)).toBeInTheDocument();
  });

  it('handles empty state for new users', () => {
    mockUseUserActivities.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<PerformanceInsightsCard userId="test-user" />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Performance Insights')).toBeInTheDocument();
    expect(screen.getByText('Start training to see insights')).toBeInTheDocument();
  });

  it('shows training load trends', () => {
    const activities = [
      createMockActivity({
        kilojoules: 400,
        moving_time: 3600,
        start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      }),
      createMockActivity({
        id: '2',
        strava_activity_id: 123457,
        kilojoules: 300,
        moving_time: 2700,
        start_date: new Date().toISOString()
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<PerformanceInsightsCard userId="test-user" />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Training Load')).toBeInTheDocument();
    // Should show trend indicators
  });

  it('displays heart rate trend analysis', () => {
    const activities = [
      createMockActivity({
        average_heartrate: 160,
        start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      }),
      createMockActivity({
        id: '2',
        strava_activity_id: 123457,
        average_heartrate: 155, // Lower HR - fitness improvement
        start_date: new Date().toISOString()
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<PerformanceInsightsCard userId="test-user" />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Heart Rate Trend')).toBeInTheDocument();
    // Should show improvement indicators for lower average HR
  });

  it('shows correct trend icons and colors', () => {
    const activities = [
      createMockActivity({
        average_speed: 3.0, // Good pace improvement
        start_date: new Date().toISOString()
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    const { container } = render(<PerformanceInsightsCard userId="test-user" />, { wrapper: createWrapper() });
    
    // Should have trend indicators (arrows) and appropriate colors
    expect(container.querySelector('.text-green-600, .text-red-600, .text-gray-600')).toBeInTheDocument();
  });

  it('handles error state gracefully', () => {
    mockUseUserActivities.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load activities'),
      refetch: jest.fn()
    } as any);

    render(<PerformanceInsightsCard userId="test-user" />, { wrapper: createWrapper() });
    
    // Should still render the card with default values
    expect(screen.getByText('Performance Insights')).toBeInTheDocument();
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('calculates pace improvements correctly', () => {
    const activities = [
      createMockActivity({
        start_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        distance: 5000,
        moving_time: 1500, // 5:00 min/km
        average_speed: 3.33
      }),
      createMockActivity({
        id: '2',
        strava_activity_id: 123457,
        start_date: new Date().toISOString(),
        distance: 5000,
        moving_time: 1400, // 4:40 min/km - 20 second improvement
        average_speed: 3.57
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<PerformanceInsightsCard userId="test-user" />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Pace Trend')).toBeInTheDocument();
    // Should show specific improvement metrics
    expect(screen.getByText(/20s faster/i)).toBeInTheDocument();
  });

  it('identifies different types of achievements', () => {
    const activities = [
      createMockActivity({
        distance: 21097, // Half marathon distance
        start_date: new Date().toISOString()
      }),
      createMockActivity({
        id: '2',
        strava_activity_id: 123457,
        distance: 15000, // 15km
        start_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<PerformanceInsightsCard userId="test-user" />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Recent Achievements')).toBeInTheDocument();
    expect(screen.getByText(/Half Marathon/i)).toBeInTheDocument();
  });
}); 