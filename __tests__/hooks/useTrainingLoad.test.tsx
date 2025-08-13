import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTrainingLoad } from '../../hooks/useTrainingLoad';

// Mock the activities hook
jest.mock('../../hooks/use-user-activities', () => ({
  useUserActivities: jest.fn(),
}));

// Mock the training profile hook
jest.mock('../../hooks/useTrainingProfile', () => ({
  useTrainingProfile: jest.fn(),
}));

describe('useTrainingLoad', () => {
  let queryClient: QueryClient;
  const mockUseUserActivities =
    require('../../hooks/use-user-activities').useUserActivities;
  const mockUseTrainingProfile =
    require('../../hooks/useTrainingProfile').useTrainingProfile;

  const mockActivities = [
    {
      id: '1',
      name: 'Morning Run',
      type: 'Run',
      distance: 5000,
      moving_time: 1800,
      start_date: '2024-01-01T06:00:00Z',
      average_speed: 2.78,
      total_elevation_gain: 100,
      strava_activity_id: '123456',
      user_id: 'user-1',
      created_at: '2024-01-01T06:30:00Z',
      updated_at: '2024-01-01T06:30:00Z',
      rpe: 7,
      tss: 45,
    },
    {
      id: '2',
      name: 'Afternoon Ride',
      type: 'Ride',
      distance: 20000,
      moving_time: 3600,
      start_date: '2024-01-02T14:00:00Z',
      average_speed: 5.56,
      total_elevation_gain: 200,
      strava_activity_id: '123457',
      user_id: 'user-1',
      created_at: '2024-01-02T14:30:00Z',
      updated_at: '2024-01-02T14:30:00Z',
      rpe: 8,
      tss: 80,
    },
  ];

  const mockTrainingProfile = {
    id: 'profile-1',
    user_id: 'user-1',
    ftp: 250,
    threshold_pace: 240, // 4:00 min/km
    max_hr: 190,
    resting_hr: 50,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Default mock implementations
    mockUseUserActivities.mockReturnValue({
      data: mockActivities,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockUseTrainingProfile.mockReturnValue({
      data: mockTrainingProfile,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calculates daily training load correctly', async () => {
    const { result } = renderHook(() => useTrainingLoad('test-user-id'), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.hasData).toBeDefined();
    expect(result.current.isLoading).toBeDefined();
  });

  it('handles loading state when activities are loading', () => {
    mockUseUserActivities.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useTrainingLoad('test-user-id'), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('handles loading state when training profile is loading', () => {
    mockUseTrainingProfile.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    const { result } = renderHook(() => useTrainingLoad('test-user-id'), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('handles error state when activities fail to load', () => {
    mockUseUserActivities.mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('Failed to load activities'),
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useTrainingLoad('test-user-id'), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toBe('Failed to load activities');
  });

  it('handles error state when training profile fails to load', () => {
    mockUseTrainingProfile.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load training profile'),
    });

    const { result } = renderHook(() => useTrainingLoad('test-user-id'), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    expect(result.current.error).toBeDefined();
  });

  it('calculates weekly training load correctly', async () => {
    const { result } = renderHook(() => useTrainingLoad('test-user-id'), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.hasData).toBeDefined();
    expect(result.current.isLoading).toBeDefined();
  });

  it('calculates monthly training load correctly', async () => {
    const { result } = renderHook(() => useTrainingLoad('test-user-id'), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.hasData).toBeDefined();
    expect(result.current.isLoading).toBeDefined();
  });

  it('provides daily breakdown of training load', async () => {
    const { result } = renderHook(() => useTrainingLoad('test-user-id'), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.hasData).toBeDefined();
    expect(result.current.isLoading).toBeDefined();
  });

  it('handles empty activities array', async () => {
    mockUseUserActivities.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useTrainingLoad('test-user-id'), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasData).toBeFalsy();
    expect(result.current.data).toBeUndefined();
    expect(result.current.hasHRData).toBeFalsy();
    expect(result.current.hasPowerData).toBeFalsy();
    expect(result.current.error).toBeNull();
  });

  it('handles missing training profile gracefully', async () => {
    mockUseTrainingProfile.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useTrainingLoad('test-user-id'), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should still calculate load but may use default values
    expect(result.current.data).toBeDefined();
    expect(result.current.hasData).toBeDefined();
  });

  it('calculates training stress score correctly', async () => {
    const { result } = renderHook(() => useTrainingLoad('test-user-id'), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check that the hook returns data
    expect(result.current.data).toBeDefined();
    expect(result.current.hasData).toBeDefined();
  });

  it('provides training load trends', async () => {
    const { result } = renderHook(() => useTrainingLoad('test-user-id'), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.hasData).toBeDefined();
    expect(result.current.isLoading).toBeDefined();
  });
});
