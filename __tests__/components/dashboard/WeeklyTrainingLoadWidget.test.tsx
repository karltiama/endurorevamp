import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WeeklyTrainingLoadWidget } from '@/components/dashboard/WeeklyTrainingLoadWidget';
import { Activity } from '@/lib/strava/types';

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

    const { container } = render(<WeeklyTrainingLoadWidget userId="test-user" />, { wrapper: createWrapper() });
    
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('displays weekly TSS progress correctly', () => {
    // Mock current week activities
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Monday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const activities = [
      createMockActivity({
        start_date: new Date(startOfWeek.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Tuesday
        moving_time: 3600, // 60 minutes
        kilojoules: 400,
        average_heartrate: 160
      }),
      createMockActivity({
        id: '2',
        strava_activity_id: 123457,
        start_date: new Date(startOfWeek.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // Thursday
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
    
    // Check for TSS Progress section specifically
    expect(screen.getByText('TSS Progress')).toBeInTheDocument();
    
    // Check for progress percentage
    expect(screen.getByText(/complete/)).toBeInTheDocument();
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
    
    expect(screen.getByText('Weekly Training Load')).toBeInTheDocument();
    
    // Check for Training Zones section
    expect(screen.getByText('Training Zones')).toBeInTheDocument();
    
    // Check for zone labels
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
    
    expect(screen.getByText('Weekly Training Load')).toBeInTheDocument();
    
    // Check for Daily Distribution section
    expect(screen.getByText('Daily Distribution')).toBeInTheDocument();
    
    // Check for day labels
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Thu')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
  });

  it('shows weekly overview statistics', () => {
    const activities = [
      createMockActivity({
        kilojoules: 400,
        moving_time: 3600,
        average_heartrate: 140
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
    
    // Check for overview statistics
    expect(screen.getByText('Workouts')).toBeInTheDocument();
    expect(screen.getByText('Zone 2')).toBeInTheDocument();
    expect(screen.getByText('This week')).toBeInTheDocument();
    expect(screen.getByText('Aerobic base')).toBeInTheDocument();
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
    
    // Check for empty state message
    expect(screen.getByText('No training data for this week')).toBeInTheDocument();
  });

  it('displays training load metrics', () => {
    const activities = [
      createMockActivity({
        kilojoules: 350,
        moving_time: 3000,
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
    
    // Check that the component renders with training data
    expect(screen.getByText('TSS Progress')).toBeInTheDocument();
    expect(screen.getByText('Training Zones')).toBeInTheDocument();
    expect(screen.getByText('Daily Distribution')).toBeInTheDocument();
  });
}); 