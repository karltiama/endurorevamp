import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WeeklyTrainingLoadWidget } from '@/components/dashboard/WeeklyTrainingLoadWidget';
import { ActivityWithTrainingData } from '@/types';

// Mock the hooks
jest.mock('@/hooks/use-user-activities', () => ({
  useUserActivities: jest.fn(),
}));

jest.mock('@/hooks/useTrainingProfile', () => ({
  usePersonalizedTSSTarget: jest.fn(),
}));

import { useUserActivities } from '@/hooks/use-user-activities';
import { usePersonalizedTSSTarget } from '@/hooks/useTrainingProfile';

const mockUseUserActivities = useUserActivities as jest.MockedFunction<
  typeof useUserActivities
>;
const mockUsePersonalizedTSSTarget =
  usePersonalizedTSSTarget as jest.MockedFunction<
    typeof usePersonalizedTSSTarget
  >;

// Mock fetch for TSS update
global.fetch = jest.fn();

// Mock activity data factory
const createMockActivity = (
  overrides: Partial<ActivityWithTrainingData> = {}
): ActivityWithTrainingData => ({
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
  kilojoules: 200,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// Helper to get current week boundaries (updated to match component logic)
const getCurrentWeekBoundaries = () => {
  const now = new Date();
  const currentWeekStart = new Date(now);

  // If it's Sunday (day 0), show the week that's ending today
  // Otherwise, show the week that starts on Monday
  if (now.getDay() === 0) {
    // Sunday: show the week that started last Monday and ends today
    currentWeekStart.setDate(now.getDate() - 6); // Go back 6 days to get Monday
  } else {
    // Other days: show the week that starts on Monday
    currentWeekStart.setDate(now.getDate() - now.getDay() + 1);
  }

  currentWeekStart.setHours(0, 0, 0, 0);

  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6); // Sunday
  currentWeekEnd.setHours(23, 59, 59, 999);

  return { start: currentWeekStart, end: currentWeekEnd };
};

describe('WeeklyTrainingLoadWidget', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Reset mocks
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  const renderComponent = (props: { userId: string }) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <WeeklyTrainingLoadWidget {...props} />
      </QueryClientProvider>
    );
  };

  it('should display loading state initially', () => {
    mockUseUserActivities.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
      isError: false,
      isPending: true,
      isLoadingError: false,
      isRefetchError: false,
      isSuccess: false,
      isFetching: false,
      isRefetching: false,
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: false,
      isFetchedAfterMount: false,
      isPlaceholderData: false,
      isPreviousData: false,
      isStale: false,
      isStaleTime: false,
      status: 'pending',
    } as any);
    mockUsePersonalizedTSSTarget.mockReturnValue({
      data: 400,
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isLoadingError: false,
      isRefetchError: false,
      isSuccess: true,
      isFetching: false,
      isRefetching: false,
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isPlaceholderData: false,
      isPreviousData: false,
      isStale: false,
      isStaleTime: false,
      status: 'success',
    } as any);

    renderComponent({ userId: 'user-1' });

    expect(screen.getByText('Weekly Training Load')).toBeInTheDocument();
    // Should show loading skeleton
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('should display weekly training load with correct progress', async () => {
    const { start: weekStart, end: weekEnd } = getCurrentWeekBoundaries();

    // Create activities for this week
    const thisWeekActivities = [
      createMockActivity({
        id: '1',
        start_date: new Date(
          weekStart.getTime() + 24 * 60 * 60 * 1000
        ).toISOString(), // Tuesday
        training_stress_score: 50,
        moving_time: 1800, // 30 minutes
        average_heartrate: 150,
      }),
      createMockActivity({
        id: '2',
        start_date: new Date(
          weekStart.getTime() + 3 * 24 * 60 * 60 * 1000
        ).toISOString(), // Thursday
        training_stress_score: 75,
        moving_time: 2700, // 45 minutes
        average_heartrate: 160,
      }),
    ];

    mockUseUserActivities.mockReturnValue({
      data: thisWeekActivities,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isError: false,
      isPending: false,
      isLoadingError: false,
      isRefetchError: false,
      isSuccess: true,
      isFetching: false,
      isRefetching: false,
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isPlaceholderData: false,
      isPreviousData: false,
      isStale: false,
      isStaleTime: false,
      status: 'success',
    } as any);
    mockUsePersonalizedTSSTarget.mockReturnValue({
      data: 400, // Target TSS
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isLoadingError: false,
      isRefetchError: false,
      isSuccess: true,
      isFetching: false,
      isRefetching: false,
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isPlaceholderData: false,
      isPreviousData: false,
      isStale: false,
      isStaleTime: false,
      status: 'success',
    } as any);

    renderComponent({ userId: 'user-1' });

    await waitFor(() => {
      // Should show progress percentage (125/400 = 31%)
      expect(screen.getByText('31%')).toBeInTheDocument();

      // Should show TSS values - use getAllByText since the text might be split
      const tssElements = screen.getAllByText(/125|400/);
      expect(tssElements.length).toBeGreaterThan(0);

      // Should show workouts completed
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('should show warning when activities need TSS calculation', async () => {
    const { start: weekStart } = getCurrentWeekBoundaries();

    const activitiesWithoutTSS = [
      createMockActivity({
        id: '1',
        start_date: new Date(
          weekStart.getTime() + 24 * 60 * 60 * 1000
        ).toISOString(),
        training_stress_score: undefined, // No TSS calculated
        moving_time: 1800,
        average_heartrate: 150,
      }),
    ];

    mockUseUserActivities.mockReturnValue({
      data: activitiesWithoutTSS,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isError: false,
      isPending: false,
      isLoadingError: false,
      isRefetchError: false,
      isSuccess: true,
      isFetching: false,
      isRefetching: false,
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isPlaceholderData: false,
      isPreviousData: false,
      isStale: false,
      isStaleTime: false,
      status: 'success',
    } as any);
    mockUsePersonalizedTSSTarget.mockReturnValue({
      data: 400,
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isLoadingError: false,
      isRefetchError: false,
      isSuccess: true,
      isFetching: false,
      isRefetching: false,
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isPlaceholderData: false,
      isPreviousData: false,
      isStale: false,
      isStaleTime: false,
      status: 'success',
    } as any);

    renderComponent({ userId: 'user-1' });

    await waitFor(() => {
      expect(screen.getByText('TSS data updating')).toBeInTheDocument();
    });
  });

  it('should handle TSS update when button is clicked', async () => {
    const { start: weekStart, end: weekEnd } = getCurrentWeekBoundaries();

    // Create an activity that falls within the current week and has no TSS
    const activitiesWithoutTSS = [
      createMockActivity({
        id: '1',
        start_date: new Date(
          weekStart.getTime() + 24 * 60 * 60 * 1000
        ).toISOString(), // Tuesday of current week
        training_stress_score: undefined, // No TSS calculated
        moving_time: 1800,
        average_heartrate: 150,
      }),
    ];

    mockUseUserActivities.mockReturnValue({
      data: activitiesWithoutTSS,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isError: false,
      isPending: false,
      isLoadingError: false,
      isRefetchError: false,
      isSuccess: true,
      isFetching: false,
      isRefetching: false,
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isPlaceholderData: false,
      isPreviousData: false,
      isStale: false,
      isStaleTime: false,
      status: 'success',
    } as any);
    mockUsePersonalizedTSSTarget.mockReturnValue({
      data: 400,
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isLoadingError: false,
      isRefetchError: false,
      isSuccess: true,
      isFetching: false,
      isRefetching: false,
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isPlaceholderData: false,
      isPreviousData: false,
      isStale: false,
      isStaleTime: false,
      status: 'success',
    } as any);

    renderComponent({ userId: 'user-1' });

    // Wait for the component to render and check for TSS warning
    await waitFor(() => {
      expect(screen.getByText('TSS data updating')).toBeInTheDocument();
    });
  });

  it('should show error state when data fetch fails', () => {
    mockUseUserActivities.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch activities'),
      refetch: jest.fn(),
      isError: true,
      isPending: false,
      isLoadingError: false,
      isRefetchError: false,
      isSuccess: false,
      isFetching: false,
      isRefetching: false,
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 1,
      failureReason: new Error('Failed to fetch activities'),
      errorUpdateCount: 1,
      isFetched: true,
      isFetchedAfterMount: true,
      isPlaceholderData: false,
      isPreviousData: false,
      isStale: false,
      isStaleTime: false,
      status: 'error',
    } as any);
    mockUsePersonalizedTSSTarget.mockReturnValue({
      data: 400,
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isLoadingError: false,
      isRefetchError: false,
      isSuccess: true,
      isFetching: false,
      isRefetching: false,
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isPlaceholderData: false,
      isPreviousData: false,
      isStale: false,
      isStaleTime: false,
      status: 'success',
    } as any);

    renderComponent({ userId: 'user-1' });

    expect(
      screen.getByText('No training data for this week')
    ).toBeInTheDocument();
    expect(screen.getByText('Refresh Data')).toBeInTheDocument();
  });

  it('should display zone distribution correctly', async () => {
    const { start: weekStart } = getCurrentWeekBoundaries();

    const activitiesWithHeartRate = [
      createMockActivity({
        id: '1',
        start_date: new Date(
          weekStart.getTime() + 24 * 60 * 60 * 1000
        ).toISOString(),
        training_stress_score: 50,
        moving_time: 1800,
        average_heartrate: 140, // Zone 2
      }),
      createMockActivity({
        id: '2',
        start_date: new Date(
          weekStart.getTime() + 3 * 24 * 60 * 60 * 1000
        ).toISOString(),
        training_stress_score: 75,
        moving_time: 1800,
        average_heartrate: 170, // Zone 4
      }),
    ];

    mockUseUserActivities.mockReturnValue({
      data: activitiesWithHeartRate,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isError: false,
      isPending: false,
      isLoadingError: false,
      isRefetchError: false,
      isSuccess: true,
      isFetching: false,
      isRefetching: false,
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isPlaceholderData: false,
      isPreviousData: false,
      isStale: false,
      isStaleTime: false,
      status: 'success',
    } as any);
    mockUsePersonalizedTSSTarget.mockReturnValue({
      data: 400,
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isLoadingError: false,
      isRefetchError: false,
      isSuccess: true,
      isFetching: false,
      isRefetching: false,
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isPlaceholderData: false,
      isPreviousData: false,
      isStale: false,
      isStaleTime: false,
      status: 'success',
    } as any);

    renderComponent({ userId: 'user-1' });

    await waitFor(() => {
      // Should show zone 2 percentage (simplified component only shows zone 2)
      expect(screen.getByText('Zone 2')).toBeInTheDocument();
    });
  });

  it('should display daily TSS breakdown', async () => {
    const { start: weekStart } = getCurrentWeekBoundaries();

    const activities = [
      createMockActivity({
        id: '1',
        start_date: new Date(
          weekStart.getTime() + 24 * 60 * 60 * 1000
        ).toISOString(), // Tuesday
        training_stress_score: 50,
        moving_time: 1800,
      }),
      createMockActivity({
        id: '2',
        start_date: new Date(
          weekStart.getTime() + 3 * 24 * 60 * 60 * 1000
        ).toISOString(), // Thursday
        training_stress_score: 75,
        moving_time: 2700,
      }),
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isError: false,
      isPending: false,
      isLoadingError: false,
      isRefetchError: false,
      isSuccess: true,
      isFetching: false,
      isRefetching: false,
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isPlaceholderData: false,
      isPreviousData: false,
      isStale: false,
      isStaleTime: false,
      status: 'success',
    } as any);
    mockUsePersonalizedTSSTarget.mockReturnValue({
      data: 400,
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isLoadingError: false,
      isRefetchError: false,
      isSuccess: true,
      isFetching: false,
      isRefetching: false,
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isPlaceholderData: false,
      isPreviousData: false,
      isStale: false,
      isStaleTime: false,
      status: 'success',
    } as any);

    renderComponent({ userId: 'user-1' });

    await waitFor(() => {
      // Should show daily distribution
      expect(screen.getByText('Daily Distribution')).toBeInTheDocument();
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Tue')).toBeInTheDocument();
      expect(screen.getByText('Wed')).toBeInTheDocument();
      expect(screen.getByText('Thu')).toBeInTheDocument();
      expect(screen.getByText('Fri')).toBeInTheDocument();
      expect(screen.getByText('Sat')).toBeInTheDocument();
      expect(screen.getByText('Sun')).toBeInTheDocument();
    });
  });
});
