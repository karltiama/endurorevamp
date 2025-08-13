import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PerformanceInsightsCard } from '@/components/dashboard/PerformanceInsightsCard';
import { Activity } from '@/lib/strava/types';

// Mock the hooks
jest.mock('@/hooks/use-user-activities', () => ({
  useUserActivities: jest.fn(),
}));

jest.mock('@/hooks/useUnitPreferences', () => ({
  useUnitPreferences: jest.fn(),
}));

import { useUserActivities } from '@/hooks/use-user-activities';
import { useUnitPreferences } from '@/hooks/useUnitPreferences';

const mockUseUserActivities = useUserActivities as jest.MockedFunction<
  typeof useUserActivities
>;
const mockUseUnitPreferences = useUnitPreferences as jest.MockedFunction<
  typeof useUnitPreferences
>;

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

    // Mock useUnitPreferences to return default preferences
    mockUseUnitPreferences.mockReturnValue({
      preferences: {
        distance: 'km',
        pace: 'min/km',
        temperature: 'celsius',
        windSpeed: 'km/h',
      },
      isLoading: false,
      updatePreferences: jest.fn(),
      setDistanceUnit: jest.fn(),
      toggleUnits: jest.fn(),
    });
  });

  it('renders loading skeleton when data is loading', () => {
    mockUseUserActivities.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    } as any);

    const { container } = render(
      <PerformanceInsightsCard userId="test-user" />,
      { wrapper: createWrapper() }
    );

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('displays performance insights correctly', () => {
    const activities = [
      createMockActivity({
        start_date: new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString(), // 1 week ago
        average_speed: 2.5, // Slower pace
        distance: 5000,
      }),
      createMockActivity({
        id: '2',
        strava_activity_id: 123457,
        start_date: new Date().toISOString(), // Today
        average_speed: 3.0, // Faster pace - improvement
        distance: 5000,
      }),
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<PerformanceInsightsCard userId="test-user" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Performance Status')).toBeInTheDocument();
    expect(screen.getByText('Pace')).toBeInTheDocument();
    // Look for the specific section heading from the actual component
    expect(screen.getByText('This Week')).toBeInTheDocument();
  });

  it('shows pace improvement trends', () => {
    const activities = [
      createMockActivity({
        start_date: new Date(
          Date.now() - 14 * 24 * 60 * 60 * 1000
        ).toISOString(), // 2 weeks ago
        average_speed: 2.5, // 5:00 min/km pace
        distance: 5000,
        sport_type: 'Run',
      }),
      createMockActivity({
        id: '2',
        strava_activity_id: 123457,
        start_date: new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString(), // 1 week ago
        average_speed: 2.8, // 4:46 min/km pace - improvement
        distance: 5000,
        sport_type: 'Run',
      }),
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<PerformanceInsightsCard userId="test-user" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Pace')).toBeInTheDocument();
    // Check for percentage text more specifically
    expect(screen.getByText(/\d+\.\d+%/)).toBeInTheDocument();
  });

  it('shows recent achievements and PRs', () => {
    const activities = [
      createMockActivity({
        distance: 10000, // 10km - potential distance PR
        moving_time: 2400, // 40 minutes
        start_date: new Date().toISOString(),
      }),
      createMockActivity({
        id: '2',
        strava_activity_id: 123457,
        distance: 8000, // 8km
        moving_time: 2000,
        start_date: new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
      }),
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<PerformanceInsightsCard userId="test-user" />, {
      wrapper: createWrapper(),
    });

    // Look for specific achievement text that actually exists in the component
    expect(screen.getByText(/New Distance PR!/)).toBeInTheDocument();
  });

  it('shows training load trend', () => {
    const activities = [
      createMockActivity({
        kilojoules: 400, // Higher training load
        moving_time: 3600,
        start_date: new Date().toISOString(),
      }),
      createMockActivity({
        id: '2',
        strava_activity_id: 123457,
        kilojoules: 200, // Lower training load last week
        moving_time: 1800,
        start_date: new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
      }),
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<PerformanceInsightsCard userId="test-user" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Load')).toBeInTheDocument();
    // Look for specific trend indicators instead of broad regex (note lowercase)
    const trendElements = screen.getAllByText(
      /increasing|decreasing|stable|building|recovery/i
    );
    expect(trendElements.length).toBeGreaterThan(0);
  });

  it('displays achievements and progress stats', () => {
    const activities = [
      createMockActivity({
        distance: 8000, // 8km
        moving_time: 2400,
        start_date: new Date().toISOString(),
      }),
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<PerformanceInsightsCard userId="test-user" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('This Week')).toBeInTheDocument();
    expect(screen.getByText('Load')).toBeInTheDocument();
    expect(screen.getByText('Intensity')).toBeInTheDocument();
  });

  it('shows load trend in quick stats', () => {
    const activities = [
      createMockActivity({
        kilojoules: 300,
        moving_time: 2700,
      }),
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<PerformanceInsightsCard userId="test-user" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Load')).toBeInTheDocument();
    // Check that stable text exists - use getAllByText since there are multiple "stable" elements
    const stableElements = screen.getAllByText(/stable/i);
    expect(stableElements.length).toBeGreaterThan(0);
  });
});
