import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ActivityCard } from '@/components/analytics/ActivityCard';
import type { Activity } from '@/lib/strava/types';

// Mock the unit preferences hook
jest.mock('@/hooks/useUnitPreferences', () => ({
  useUnitPreferences: jest.fn(() => ({
    preferences: {
      distance: 'km',
      pace: 'min/km',
      temperature: 'celsius',
    },
  })),
}));

// Mock the Badge component
jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className, variant, ...props }: any) => (
    <div className={`badge ${variant} ${className}`} {...props}>
      {children}
    </div>
  ),
}));

// Mock the utils module
jest.mock('@/lib/utils', () => ({
  formatDistance: jest.fn((meters, unit) => {
    if (unit === 'miles') {
      const miles = (meters / 1000) * 0.621371;
      return `${miles % 1 === 0 ? miles.toFixed(0) : miles.toFixed(1)} mi`;
    }
    const km = meters / 1000;
    return `${km % 1 === 0 ? km.toFixed(0) : km.toFixed(1)} km`;
  }),
  getActivityIcon: jest.fn(() => '🏃‍♂️'),
  formatStravaDate: jest.fn(() => 'Jan 15, 2025'),
  formatStravaTime: jest.fn(() => '8:00 AM'),
  formatPace: jest.fn((secondsPerKm, unit) => {
    const minutes = Math.floor(secondsPerKm / 60);
    const seconds = Math.floor(secondsPerKm % 60);
    const unitSuffix = unit === 'min/mile' ? '/mi' : '/km';
    return `${minutes}:${seconds.toString().padStart(2, '0')}${unitSuffix}`;
  }),
}));

// Extended Activity type for testing with RPE
type ActivityWithRPE = Activity & {
  perceived_exertion?: number;
};

describe('ActivityCard', () => {
  const mockOnViewDetails = jest.fn();
  const queryClient = new QueryClient();

  const createMockActivity = (
    overrides: Partial<ActivityWithRPE> = {}
  ): ActivityWithRPE => ({
    id: '1',
    user_id: 'user1',
    strava_activity_id: 123456,
    name: 'Test Activity',
    sport_type: 'Run',
    start_date: '2025-01-15T08:00:00Z',
    start_date_local: '2025-01-15T08:00:00Z',
    timezone: 'America/Detroit',
    distance: 5000, // 5km
    moving_time: 1800, // 30 minutes
    elapsed_time: 1800,
    total_elevation_gain: 50,
    average_speed: 2.78, // 10 km/h
    max_speed: 3.5,
    average_heartrate: 150,
    max_heartrate: 170,
    average_watts: 200,
    max_watts: 250,
    kudos_count: 5,
    comment_count: 1,
    athlete_count: 1,
    photo_count: 0,
    trainer: false,
    commute: false,
    manual: false,
    private: false,
    is_favorite: false,
    created_at: '2025-01-15T08:00:00Z',
    updated_at: '2025-01-15T08:00:00Z',
    ...overrides,
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders basic activity information', () => {
    const activity = createMockActivity();
    renderWithQueryClient(
      <ActivityCard activity={activity} onViewDetails={mockOnViewDetails} />
    );

    expect(screen.getByText('Test Activity')).toBeInTheDocument();
    expect(screen.getByText('Run')).toBeInTheDocument();
    expect(screen.getByText('Distance')).toBeInTheDocument();
    expect(screen.getByText('Pace')).toBeInTheDocument();
  });

  it('displays correct distance and duration', () => {
    const activity = createMockActivity({
      distance: 10000, // 10km
      moving_time: 3600, // 1 hour
      sport_type: 'Ride', // Not a run, so should show duration
    });

    renderWithQueryClient(
      <ActivityCard activity={activity} onViewDetails={mockOnViewDetails} />
    );

    expect(screen.getByText('10 km')).toBeInTheDocument();
    expect(screen.getByText('1h 0m')).toBeInTheDocument();
  });

  it('shows speed for cycling activities', () => {
    const activity = createMockActivity({
      average_speed: 2.78, // 10 km/h
      sport_type: 'Ride',
    });

    renderWithQueryClient(
      <ActivityCard activity={activity} onViewDetails={mockOnViewDetails} />
    );

    expect(screen.getByText('Avg Speed')).toBeInTheDocument();
    expect(screen.getByText('10.0 km/h')).toBeInTheDocument();
  });

  it('shows pace for running activities', () => {
    const activity = createMockActivity({
      distance: 5000, // 5km
      moving_time: 1500, // 25 minutes
      sport_type: 'Run',
    });

    renderWithQueryClient(
      <ActivityCard activity={activity} onViewDetails={mockOnViewDetails} />
    );

    expect(screen.getByText('Pace')).toBeInTheDocument();
    expect(screen.getByText('5:00/km')).toBeInTheDocument();
  });

  it('shows elevation for hiking activities', () => {
    const activity = createMockActivity({
      total_elevation_gain: 100,
      sport_type: 'Hike',
    });

    renderWithQueryClient(
      <ActivityCard activity={activity} onViewDetails={mockOnViewDetails} />
    );

    expect(screen.getByText('Elevation')).toBeInTheDocument();
    expect(screen.getByText('↗ 100m')).toBeInTheDocument();
  });

  it('shows heart rate for cycling activities', () => {
    const activity = createMockActivity({
      average_heartrate: 155,
      sport_type: 'Ride',
    });

    renderWithQueryClient(
      <ActivityCard activity={activity} onViewDetails={mockOnViewDetails} />
    );

    expect(screen.getByText('155 bpm')).toBeInTheDocument();
    expect(screen.getByText('Avg HR')).toBeInTheDocument();
  });

  it('does not show power for running activities', () => {
    const activity = createMockActivity({
      sport_type: 'Run',
      average_watts: 200,
    });
    renderWithQueryClient(
      <ActivityCard activity={activity} onViewDetails={mockOnViewDetails} />
    );

    expect(screen.queryByText('200w')).not.toBeInTheDocument();
    expect(screen.queryByText('Avg Power')).not.toBeInTheDocument();
  });

  it('shows kudos count', () => {
    const activity = createMockActivity({
      kudos_count: 12,
    });
    renderWithQueryClient(
      <ActivityCard activity={activity} onViewDetails={mockOnViewDetails} />
    );

    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Kudos')).toBeInTheDocument();
  });

  it('shows private badge for private activities', () => {
    const activity = createMockActivity({
      private: true,
    });
    renderWithQueryClient(
      <ActivityCard activity={activity} onViewDetails={mockOnViewDetails} />
    );

    expect(screen.getByText('Private')).toBeInTheDocument();
  });

  it('shows RPE badge when available', () => {
    const activity = createMockActivity({
      perceived_exertion: 7,
    });
    renderWithQueryClient(
      <ActivityCard activity={activity} onViewDetails={mockOnViewDetails} />
    );

    expect(screen.getByText('Very Hard+')).toBeInTheDocument();
  });

  it('shows "Log RPE" badge when no RPE data', () => {
    const activity = createMockActivity();
    renderWithQueryClient(
      <ActivityCard activity={activity} onViewDetails={mockOnViewDetails} />
    );

    expect(screen.getByText('Log RPE')).toBeInTheDocument();
  });

  it('calls onViewDetails when view details button is clicked', () => {
    const activity = createMockActivity();
    renderWithQueryClient(
      <ActivityCard activity={activity} onViewDetails={mockOnViewDetails} />
    );

    const viewDetailsButton = screen.getByText('View Details →');
    fireEvent.click(viewDetailsButton);

    expect(mockOnViewDetails).toHaveBeenCalledWith(activity);
  });

  it('handles weight training activities correctly', () => {
    const activity = createMockActivity({
      sport_type: 'WeightTraining',
      distance: 0,
      total_elevation_gain: 0,
      average_speed: undefined,
      average_heartrate: undefined,
      average_watts: undefined,
    });
    renderWithQueryClient(
      <ActivityCard activity={activity} onViewDetails={mockOnViewDetails} />
    );

    // Should show duration but not distance, speed, or pace
    expect(screen.getByText('Duration')).toBeInTheDocument();
    expect(screen.queryByText('Distance')).not.toBeInTheDocument();
    expect(screen.queryByText('Avg Speed')).not.toBeInTheDocument();
    expect(screen.queryByText('Avg Pace')).not.toBeInTheDocument();
    expect(screen.queryByText('Avg HR')).not.toBeInTheDocument();
    expect(screen.queryByText('Avg Power')).not.toBeInTheDocument();
  });

  it('handles regular workout activities correctly', () => {
    const activity = createMockActivity({
      sport_type: 'Workout',
      distance: 0,
      total_elevation_gain: 0,
      average_speed: undefined,
      average_heartrate: undefined,
      average_watts: undefined,
    });
    renderWithQueryClient(
      <ActivityCard activity={activity} onViewDetails={mockOnViewDetails} />
    );

    // Should show duration but not distance, speed, or pace
    expect(screen.getByText('Duration')).toBeInTheDocument();
    expect(screen.queryByText('Distance')).not.toBeInTheDocument();
    expect(screen.queryByText('Avg Speed')).not.toBeInTheDocument();
    expect(screen.queryByText('Avg Pace')).not.toBeInTheDocument();
    expect(screen.queryByText('Avg HR')).not.toBeInTheDocument();
    expect(screen.queryByText('Avg Power')).not.toBeInTheDocument();
  });

  it('handles swimming activities correctly', () => {
    const activity = createMockActivity({
      sport_type: 'Swim',
      average_speed: 1.39, // 5 km/h
      total_elevation_gain: 0,
    });
    renderWithQueryClient(
      <ActivityCard activity={activity} onViewDetails={mockOnViewDetails} />
    );

    expect(screen.getByText('Avg Speed')).toBeInTheDocument();
    expect(screen.getByText('5.0 km/h')).toBeInTheDocument();
    expect(screen.queryByText('Elevation')).not.toBeInTheDocument();
  });

  it('handles cycling activities with elevation', () => {
    const activity = createMockActivity({
      sport_type: 'Ride',
      average_speed: 8.33, // 30 km/h
      total_elevation_gain: 200,
      average_watts: 220,
    });
    renderWithQueryClient(
      <ActivityCard activity={activity} onViewDetails={mockOnViewDetails} />
    );

    expect(screen.getByText('Avg Speed')).toBeInTheDocument();
    expect(screen.getByText('30.0 km/h')).toBeInTheDocument();
    expect(screen.getByText('Elevation')).toBeInTheDocument();
    expect(screen.getByText('↗ 200m')).toBeInTheDocument();
    expect(screen.getByText('220w')).toBeInTheDocument();
    expect(screen.getByText('Avg Power')).toBeInTheDocument();
  });

  it('adapts grid layout based on number of metrics', () => {
    // Activity with only distance and duration (2 metrics)
    const simpleActivity = createMockActivity({
      sport_type: 'WeightTraining',
      distance: 0,
      total_elevation_gain: 0,
      average_speed: undefined,
    });

    const { rerender } = renderWithQueryClient(
      <ActivityCard
        activity={simpleActivity}
        onViewDetails={mockOnViewDetails}
      />
    );

    // Activity with distance, duration, speed, and elevation (4 metrics)
    const complexActivity = createMockActivity({
      sport_type: 'Run',
      total_elevation_gain: 100,
      average_speed: 2.78,
    });

    rerender(
      <QueryClientProvider client={queryClient}>
        <ActivityCard
          activity={complexActivity}
          onViewDetails={mockOnViewDetails}
        />
      </QueryClientProvider>
    );

    // Both should render without errors
    expect(screen.getByText('Test Activity')).toBeInTheDocument();
  });

  it('shows favorite button with correct state', () => {
    const activity = createMockActivity({
      is_favorite: true,
    });
    renderWithQueryClient(
      <ActivityCard activity={activity} onViewDetails={mockOnViewDetails} />
    );

    // Should show filled heart for favorited activity
    expect(screen.getByTitle('Remove from favorites')).toBeInTheDocument();
  });

  it('shows unfavorited button with correct state', () => {
    const activity = createMockActivity({
      is_favorite: false,
    });
    renderWithQueryClient(
      <ActivityCard activity={activity} onViewDetails={mockOnViewDetails} />
    );

    // Should show outline heart for unfavorited activity
    expect(screen.getByTitle('Add to favorites')).toBeInTheDocument();
  });
});
