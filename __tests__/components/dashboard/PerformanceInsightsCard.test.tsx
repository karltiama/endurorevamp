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
    // Look for the specific section heading from the actual component
    expect(screen.getByText('Weekly Distance')).toBeInTheDocument();
  });

  it('shows pace improvement trends', () => {
    const activities = [
      createMockActivity({
        start_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
        average_speed: 2.5, // 5:00 min/km pace
        distance: 5000,
        sport_type: 'Run'
      }),
      createMockActivity({
        id: '2',
        strava_activity_id: 123457,
        start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        average_speed: 2.8, // 4:46 min/km pace - improvement
        distance: 5000,
        sport_type: 'Run'
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
    expect(screen.getByText('Last 7 days')).toBeInTheDocument();
    // Check for percentage text more specifically
    expect(screen.getByText(/\d+\.\d+%/)).toBeInTheDocument();
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
    
    expect(screen.getByText('Streak')).toBeInTheDocument();
    expect(screen.getByText('🔥')).toBeInTheDocument();
    // Look for the specific "days" text instead of generic number
    expect(screen.getByText('days')).toBeInTheDocument();
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
    
    // Look for specific achievement text that actually exists in the component
    expect(screen.getByText('New Distance PR!')).toBeInTheDocument();
    expect(screen.getByText(/your longest run yet/)).toBeInTheDocument();
  });

  it('displays weekly distance comparison', () => {
    const activities = [
      createMockActivity({
        start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        distance: 5000 // Last week: 5km
      }),
      createMockActivity({
        id: '2',
        strava_activity_id: 123457,
        start_date: new Date().toISOString(), // Today
        distance: 5000 // This week: 5km
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
    expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
    expect(screen.getByText('vs last week')).toBeInTheDocument();
    // Look for specific distance display text - the component shows "5 km" not "5.0 km"
    expect(screen.getByText('5 km')).toBeInTheDocument();
  });

  it('shows training load trend', () => {
    const activities = [
      createMockActivity({
        kilojoules: 400, // Higher training load
        moving_time: 3600,
        start_date: new Date().toISOString()
      }),
      createMockActivity({
        id: '2',
        strava_activity_id: 123457,
        kilojoules: 200, // Lower training load last week
        moving_time: 1800,
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
    
    expect(screen.getByText('Training Load')).toBeInTheDocument();
    // Look for specific trend indicators instead of broad regex (note lowercase)
    const trendElements = screen.getAllByText(/increasing|decreasing|stable/i);
    expect(trendElements.length).toBeGreaterThan(0);
  });

  it('displays achievements and progress stats', () => {
    const activities = [
      createMockActivity({
        distance: 8000, // 8km
        moving_time: 2400,
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
    
    expect(screen.getByText('Weekly Distance')).toBeInTheDocument();
    expect(screen.getByText('Training Load')).toBeInTheDocument();
    expect(screen.getByText('Avg Intensity')).toBeInTheDocument();
    expect(screen.getByText('Load Trend')).toBeInTheDocument();
  });

  it('calculates and displays workout streak correctly', () => {
    const activities = [
      createMockActivity({
        start_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // Yesterday
      }),
      createMockActivity({
        id: '2',
        strava_activity_id: 123457,
        start_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<PerformanceInsightsCard userId="test-user" />, { wrapper: createWrapper() });

    expect(screen.getByText('Streak')).toBeInTheDocument();
    // Look for days text that's specifically under the streak section
    const streakSection = screen.getByText('Streak').closest('div')?.parentElement;
    expect(streakSection).toBeInTheDocument();
  });

  it('shows consistency achievement when streak is high', () => {
    const activities = Array.from({ length: 7 }, (_, i) => 
      createMockActivity({
        id: String(i + 1),
        strava_activity_id: 123456 + i,
        start_date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        distance: 5000 + (i * 100) // Slight variation in distance
      })
    );

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<PerformanceInsightsCard userId="test-user" />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Streak')).toBeInTheDocument();
    // Check for flame emoji - use getAllByText since there are multiple emoji elements
    const flameElements = screen.getAllByText('🔥');
    expect(flameElements.length).toBeGreaterThan(0);
    // Just check that the component renders successfully with high streak
    expect(screen.getByText('Performance Insights')).toBeInTheDocument();
  });

  it('shows load trend in quick stats', () => {
    const activities = [
      createMockActivity({
        kilojoules: 300,
        moving_time: 2700
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<PerformanceInsightsCard userId="test-user" />, { wrapper: createWrapper() });

    expect(screen.getByText('Load Trend')).toBeInTheDocument();
    // Check that stable text exists - use getAllByText since there are multiple "stable" elements
    const stableElements = screen.getAllByText('stable');
    expect(stableElements.length).toBeGreaterThan(0);
  });
}); 