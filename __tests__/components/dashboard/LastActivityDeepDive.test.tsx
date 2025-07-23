import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LastActivityDeepDive } from '@/components/dashboard/LastActivityDeepDive';
import { Activity } from '@/lib/strava/types';

// Mock the hook
jest.mock('@/hooks/use-user-activities', () => ({
  useUserActivities: jest.fn(),
}));

const mockUseUserActivities = require('@/hooks/use-user-activities').useUserActivities;

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
  max_heartrate: 170,
  average_watts: 200,
  max_watts: 250,
  max_speed: 5.5,
  ...overrides,
});

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('LastActivityDeepDive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', () => {
    mockUseUserActivities.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    renderWithQueryClient(<LastActivityDeepDive userId="user-1" />);
    
    expect(screen.getByText('Loading your latest activity analysis...')).toBeInTheDocument();
  });

  it('renders empty state when no activities', () => {
    mockUseUserActivities.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<LastActivityDeepDive userId="user-1" />);
    
    expect(screen.getByText('No activities found')).toBeInTheDocument();
    expect(screen.getByText('Connect your Strava account to see detailed activity insights')).toBeInTheDocument();
  });

  it('renders error state', () => {
    mockUseUserActivities.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to fetch'),
    });

    renderWithQueryClient(<LastActivityDeepDive userId="user-1" />);
    
    expect(screen.getByText('Error loading activity data')).toBeInTheDocument();
  });

  it('renders activity deep dive with data', () => {
    const mockActivity = createMockActivity();
    
    mockUseUserActivities.mockReturnValue({
      data: [mockActivity],
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<LastActivityDeepDive userId="user-1" />);
    
    // Check main title and activity name
    expect(screen.getByText('Last Activity Deep Dive')).toBeInTheDocument();
    expect(screen.getByText('Morning Run')).toBeInTheDocument();
    
    // Check activity type badge
    expect(screen.getByText('Run')).toBeInTheDocument();
    
    // Check key stats
    expect(screen.getByText('5 km')).toBeInTheDocument(); // Distance
    expect(screen.getByText('30m')).toBeInTheDocument(); // Duration
    expect(screen.getByText('100m')).toBeInTheDocument(); // Elevation
    
    // Check heart rate
    expect(screen.getByText('150 bpm')).toBeInTheDocument();
    expect(screen.getByText('Max: 170 bpm')).toBeInTheDocument();
    
    // Check power
    expect(screen.getByText('200W')).toBeInTheDocument();
    expect(screen.getByText('Max: 250W')).toBeInTheDocument();
  });

  it('shows tabs for different views', () => {
    const mockActivity = createMockActivity();
    
    mockUseUserActivities.mockReturnValue({
      data: [mockActivity],
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<LastActivityDeepDive userId="user-1" />);
    
    // Check tabs are present
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('Insights')).toBeInTheDocument();
  });

  it('shows personal best badge when applicable', () => {
    const activities = [
      createMockActivity({ distance: 10000, start_date: new Date().toISOString() }), // Latest - 10km
      createMockActivity({ distance: 5000, start_date: new Date(Date.now() - 86400000).toISOString() }), // Previous - 5km
    ];
    
    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<LastActivityDeepDive userId="user-1" />);
    
    // Should show personal best badge since 10km > average (7.5km) * 1.1
    expect(screen.getByText('Personal Best!')).toBeInTheDocument();
  });

  it('handles activities without heart rate or power data', () => {
    const mockActivity = createMockActivity({
      average_heartrate: undefined,
      max_heartrate: undefined,
      average_watts: undefined,
      max_watts: undefined,
    });
    
    mockUseUserActivities.mockReturnValue({
      data: [mockActivity],
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<LastActivityDeepDive userId="user-1" />);
    
    // Should still render basic stats
    expect(screen.getByText('Morning Run')).toBeInTheDocument();
    expect(screen.getByText('5 km')).toBeInTheDocument();
    
    // Should not show heart rate or power sections
    expect(screen.queryByText('Heart Rate')).not.toBeInTheDocument();
    expect(screen.queryByText('Power')).not.toBeInTheDocument();
  });

  it('should link to analytics page with activity feed hash fragment', () => {
    const mockActivity = createMockActivity({
      name: 'Test Activity',
      sport_type: 'Run',
      distance: 5000,
      moving_time: 1800,
      total_elevation_gain: 50,
      average_heartrate: 150,
      max_heartrate: 170,
      average_watts: undefined,
      max_watts: undefined
    });

    // Mock the hook to return a test activity
    mockUseUserActivities.mockReturnValue({
      data: [mockActivity],
      isLoading: false,
      error: null
    });

    renderWithQueryClient(<LastActivityDeepDive userId="test-user" />);
    
    const viewAllActivitiesLink = screen.getByRole('link', { name: /view all activities/i });
    expect(viewAllActivitiesLink).toBeInTheDocument();
    expect(viewAllActivitiesLink).toHaveAttribute('href', '/dashboard/analytics#activity-feed');
  });
}); 