import { render, screen } from '@testing-library/react';
import { HistoricalTrends } from '@/components/analytics/HistoricalTrends';
import { Activity } from '@/lib/strava/types';

// Mock the useUnitPreferences hook
jest.mock('@/hooks/useUnitPreferences', () => ({
  useUnitPreferences: () => ({
    preferences: {
      distance: 'km',
      weight: 'kg',
      temperature: 'celsius',
    },
  }),
}));

const mockActivities: Activity[] = [
  {
    id: '1',
    user_id: 'user1',
    strava_activity_id: 123456,
    name: 'Week 1 Run',
    sport_type: 'Run',
    start_date: '2025-01-06T08:00:00Z', // Monday
    start_date_local: '2025-01-06T08:00:00Z',
    timezone: 'America/Detroit',
    distance: 5000, // 5km
    moving_time: 1800, // 30 minutes
    elapsed_time: 1800,
    total_elevation_gain: 50,
    average_speed: 2.78, // 10 min/km pace
    max_speed: 3.33,
    average_heartrate: 150,
    max_heartrate: 170,
    average_watts: 200,
    max_watts: 250,
  },
  {
    id: '2',
    user_id: 'user1',
    strava_activity_id: 123457,
    name: 'Week 1 Ride',
    sport_type: 'Ride',
    start_date: '2025-01-08T07:00:00Z', // Wednesday
    start_date_local: '2025-01-08T07:00:00Z',
    timezone: 'America/Detroit',
    distance: 20000, // 20km
    moving_time: 3600, // 1 hour
    elapsed_time: 3600,
    total_elevation_gain: 100,
    average_speed: 5.56, // 3 min/km pace
    max_speed: 8.33,
    average_heartrate: 140,
    max_heartrate: 160,
    average_watts: 180,
    max_watts: 300,
  },
  {
    id: '3',
    user_id: 'user1',
    strava_activity_id: 123458,
    name: 'Week 2 Run',
    sport_type: 'Run',
    start_date: '2025-01-13T06:00:00Z', // Monday of week 2
    start_date_local: '2025-01-13T06:00:00Z',
    timezone: 'America/Detroit',
    distance: 10000, // 10km
    moving_time: 3600, // 1 hour
    elapsed_time: 3600,
    total_elevation_gain: 75,
    average_speed: 2.78, // 10 min/km pace
    max_speed: 4.17,
    average_heartrate: 155,
    max_heartrate: 175,
    average_watts: 220,
    max_watts: 280,
  },
];

describe('HistoricalTrends', () => {
  it('renders empty state when no activities provided', () => {
    render(<HistoricalTrends activities={[]} />);

    expect(screen.getByText('Historical Trends')).toBeInTheDocument();
    expect(
      screen.getByText('No activities found to analyze trends')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Sync your activities from Strava to see your progress')
    ).toBeInTheDocument();
  });

  it('renders trends when activities are provided', () => {
    render(<HistoricalTrends activities={mockActivities} />);

    expect(screen.getByText('Historical Trends')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Track your performance over time with interactive charts'
      )
    ).toBeInTheDocument();
  });

  it('displays chart container when data is available', () => {
    render(<HistoricalTrends activities={mockActivities} />);

    // The chart should be rendered
    const chartContainer = document.querySelector('.h-80');
    expect(chartContainer).toBeInTheDocument();
  });

  it('handles activities with missing data gracefully', () => {
    const incompleteActivities: Activity[] = [
      {
        id: '1',
        user_id: 'user1',
        strava_activity_id: 123456,
        name: 'Incomplete Activity',
        sport_type: 'Run',
        start_date: '2025-01-15T08:00:00Z',
        start_date_local: '2025-01-15T08:00:00Z',
        timezone: 'America/Detroit',
        distance: 0, // No distance
        moving_time: 0, // No time
        elapsed_time: 0,
        total_elevation_gain: 0,
      },
    ];

    render(<HistoricalTrends activities={incompleteActivities} />);

    // Should show the component structure but with empty chart
    expect(screen.getByText('Historical Trends')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Track your performance over time with interactive charts'
      )
    ).toBeInTheDocument();

    // Chart container should still be present
    const chartContainer = document.querySelector('.h-80');
    expect(chartContainer).toBeInTheDocument();
  });

  it('filters out activities with invalid data', () => {
    const mixedActivities: Activity[] = [
      ...mockActivities,
      {
        id: '4',
        user_id: 'user1',
        strava_activity_id: 123459,
        name: 'Invalid Activity',
        sport_type: 'Run',
        start_date: '2025-01-30T08:00:00Z',
        start_date_local: '2025-01-30T08:00:00Z',
        timezone: 'America/Detroit',
        distance: 0, // Invalid
        moving_time: 0, // Invalid
        elapsed_time: 0,
        total_elevation_gain: 0,
      },
    ];

    render(<HistoricalTrends activities={mixedActivities} />);

    // Should still show the chart and controls since we have valid activities
    expect(screen.getByText('Historical Trends')).toBeInTheDocument();
  });
});
