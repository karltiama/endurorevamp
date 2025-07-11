import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QuickActionsSection } from '@/components/dashboard/QuickActionsSection';
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

describe('QuickActionsSection', () => {
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

    const { container } = render(<QuickActionsSection userId="test-user" />, { wrapper: createWrapper() });
    
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('displays quick actions section correctly', () => {
    const activities = [
      createMockActivity({
        start_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        kilojoules: 300
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<QuickActionsSection userId="test-user" />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Log RPE')).toBeInTheDocument();
    expect(screen.getByText('Plan Workout')).toBeInTheDocument();
  });

  it('shows default actions for new users', () => {
    mockUseUserActivities.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<QuickActionsSection userId="test-user" />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Plan First Workout')).toBeInTheDocument();
    expect(screen.getByText('Set Training Goals')).toBeInTheDocument();
    expect(screen.getByText('Connect Devices')).toBeInTheDocument();
  });

  it('adapts actions based on training readiness', () => {
    // High fatigue scenario - should suggest recovery
    const activities = [
      createMockActivity({
        start_date: new Date().toISOString(), // Today
        kilojoules: 500, // High intensity
        moving_time: 5400, // 90 minutes
        average_heartrate: 175
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<QuickActionsSection userId="test-user" />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Recovery Session')).toBeInTheDocument();
    expect(screen.getByText('Log RPE')).toBeInTheDocument();
  });

  it('shows quality workout actions for high readiness', () => {
    // Well-recovered scenario
    const activities = [
      createMockActivity({
        start_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        kilojoules: 200, // Low intensity
        moving_time: 1800, // 30 minutes
        average_heartrate: 140
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<QuickActionsSection userId="test-user" />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Quality Workout')).toBeInTheDocument();
    expect(screen.getByText('Speed Session')).toBeInTheDocument();
  });

  it('displays action priorities correctly', () => {
    const activities = [
      createMockActivity({
        kilojoules: 350,
        moving_time: 3600
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    const { container } = render(<QuickActionsSection userId="test-user" />, { wrapper: createWrapper() });
    
    // Should have priority indicators (badges)
    expect(container.querySelector('.bg-red-100, .bg-yellow-100, .bg-green-100')).toBeInTheDocument();
  });

  it('handles action button clicks', () => {
    const activities = [
      createMockActivity({
        kilojoules: 300
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<QuickActionsSection userId="test-user" />, { wrapper: createWrapper() });
    
    // Test clicking on an action button
    const logRpeButton = screen.getByText('Log RPE');
    fireEvent.click(logRpeButton);
    
    // Button should be clickable (no errors thrown)
    expect(logRpeButton).toBeInTheDocument();
  });

  it('shows contextual actions based on last activity type', () => {
    const activities = [
      createMockActivity({
        sport_type: 'Run',
        start_date: new Date().toISOString()
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<QuickActionsSection userId="test-user" />, { wrapper: createWrapper() });
    
    // Should show running-specific actions
    expect(screen.getByText('Plan Run')).toBeInTheDocument();
  });

  it('adapts to cycling activities', () => {
    const activities = [
      createMockActivity({
        sport_type: 'Ride',
        start_date: new Date().toISOString()
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<QuickActionsSection userId="test-user" />, { wrapper: createWrapper() });
    
    // Should show cycling-specific actions
    expect(screen.getByText('Plan Ride')).toBeInTheDocument();
  });

  it('shows recovery actions after intense training', () => {
    const activities = [
      createMockActivity({
        start_date: new Date().toISOString(),
        kilojoules: 600, // Very high intensity
        moving_time: 7200, // 2 hours
        average_heartrate: 180
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<QuickActionsSection userId="test-user" />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Recovery Session')).toBeInTheDocument();
    expect(screen.getByText('Stretching')).toBeInTheDocument();
    expect(screen.getByText('Rest Day')).toBeInTheDocument();
  });

  it('displays correct badge colors for priorities', () => {
    const activities = [
      createMockActivity({
        kilojoules: 400
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    const { container } = render(<QuickActionsSection userId="test-user" />, { wrapper: createWrapper() });
    
    // Should have different colored badges for different priorities
    expect(container.querySelector('.bg-red-100')).toBeInTheDocument(); // High priority
    expect(container.querySelector('.bg-yellow-100')).toBeInTheDocument(); // Medium priority
    expect(container.querySelector('.bg-green-100')).toBeInTheDocument(); // Low priority
  });

  it('handles error state gracefully', () => {
    mockUseUserActivities.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load activities'),
      refetch: jest.fn()
    } as any);

    render(<QuickActionsSection userId="test-user" />, { wrapper: createWrapper() });
    
    // Should still render with default actions
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Plan Workout')).toBeInTheDocument();
  });

  it('calculates training state correctly', () => {
    // Medium readiness scenario
    const activities = [
      createMockActivity({
        start_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        kilojoules: 350, // Moderate intensity
        moving_time: 3600, // 60 minutes
        average_heartrate: 160
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<QuickActionsSection userId="test-user" />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Easy Run')).toBeInTheDocument();
    expect(screen.getByText('Cross Training')).toBeInTheDocument();
  });

  it('shows time-sensitive recommendations', () => {
    // Morning scenario - show morning-specific actions
    const activities = [
      createMockActivity({
        start_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<QuickActionsSection userId="test-user" />, { wrapper: createWrapper() });
    
    // Actions should be contextual to current time/situation
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });

  it('limits number of displayed actions', () => {
    const activities = [
      createMockActivity({
        kilojoules: 300
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<QuickActionsSection userId="test-user" />, { wrapper: createWrapper() });
    
    // Should show a reasonable number of actions (not overwhelming)
    const actionButtons = screen.getAllByRole('button');
    expect(actionButtons.length).toBeLessThanOrEqual(6); // Max 6 actions displayed
  });

  it('shows appropriate icons for each action type', () => {
    const activities = [
      createMockActivity({
        kilojoules: 300
      })
    ];

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    const { container } = render(<QuickActionsSection userId="test-user" />, { wrapper: createWrapper() });
    
    // Should have icons for different action types
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
}); 