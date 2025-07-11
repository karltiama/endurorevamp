import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TrainingReadinessCard } from '@/components/dashboard/TrainingReadinessCard';
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

describe('TrainingReadinessCard', () => {
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
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Go for a quality workout')).toBeInTheDocument();
    
    // Should show high recovery score (80+)
    const scoreElement = screen.getByText(/\d+/);
    const score = parseInt(scoreElement.textContent || '0');
    expect(score).toBeGreaterThanOrEqual(80);
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
    
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Light training recommended')).toBeInTheDocument();
    
    // Should show medium recovery score (50-79)
    const scoreElement = screen.getByText(/\d+/);
    const score = parseInt(scoreElement.textContent || '0');
    expect(score).toBeGreaterThanOrEqual(50);
    expect(score).toBeLessThan(80);
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
    
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('Focus on recovery today')).toBeInTheDocument();
    
    // Should show low recovery score (<50)
    const scoreElement = screen.getByText(/\d+/);
    const score = parseInt(scoreElement.textContent || '0');
    expect(score).toBeLessThan(50);
  });

  it('shows default high readiness for new users with no activities', () => {
    mockUseUserActivities.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<TrainingReadinessCard userId="test-user" />, { wrapper: createWrapper() });
    
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Ready to start training')).toBeInTheDocument();
    
    // Should show high score for new users
    const scoreElement = screen.getByText(/\d+/);
    const score = parseInt(scoreElement.textContent || '0');
    expect(score).toBeGreaterThanOrEqual(85);
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
    
    expect(screen.getByText('TSS Balance')).toBeInTheDocument();
    expect(screen.getByText(/\d+ TSS/)).toBeInTheDocument();
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
    
    expect(screen.getByText('Recent RPE')).toBeInTheDocument();
    expect(screen.getByText(/\d+\/10/)).toBeInTheDocument(); // RPE based on kilojoules/heartrate
  });

  it('handles error state gracefully', () => {
    mockUseUserActivities.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load activities'),
      refetch: jest.fn()
    } as any);

    render(<TrainingReadinessCard userId="test-user" />, { wrapper: createWrapper() });
    
    // Should still render the card with default values
    expect(screen.getByText('Training Readiness')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument(); // Default fallback
  });

  it('calculates readiness correctly based on recovery days', () => {
    // Test scenario: Last activity was 3 days ago (should boost readiness)
    const activities = [
      createMockActivity({
        start_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        kilojoules: 400 // High intensity, but long recovery
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
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('shows correct readiness icons and colors', () => {
    const activities = [
      createMockActivity({
        kilojoules: 180 // Low intensity = high readiness
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    const { container } = render(<TrainingReadinessCard userId="test-user" />, { wrapper: createWrapper() });
    
    // Should have green color indicators for high readiness
    expect(container.querySelector('.text-green-600')).toBeInTheDocument();
  });
});