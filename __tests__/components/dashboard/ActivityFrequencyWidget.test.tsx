import { render, screen } from '@testing-library/react'
import { ActivityFrequencyWidget } from '@/components/dashboard/ActivityFrequencyWidget'
import { Activity } from '@/lib/strava/types'

// Mock the useUnitPreferences hook
jest.mock('@/hooks/useUnitPreferences', () => ({
  useUnitPreferences: () => ({
    preferences: {
      distance: 'km',
      pace: 'min/km',
      temperature: 'celsius'
    }
  })
}))

// Mock the ActivityContributionCalendar component
jest.mock('@/components/dashboard/ActivityContributionCalendar', () => ({
  ActivityContributionCalendar: ({ activities }: { activities: Activity[] }) => (
    <div data-testid="activity-calendar">
      Activity Calendar ({activities.length} activities)
    </div>
  )
}))

const mockActivities: Activity[] = [
  {
    id: '1',
    strava_activity_id: 123456789,
    user_id: 'user-1',
    name: 'Morning Run',
    sport_type: 'Run',
    start_date: '2024-01-15T06:00:00Z',
    start_date_local: '2024-01-15T06:00:00Z',
    distance: 5000, // 5km
    moving_time: 1800, // 30 minutes
    elapsed_time: 1800,
    total_elevation_gain: 50,
    average_speed: 2.78, // m/s
    max_speed: 3.33,
    average_heartrate: 150,
    max_heartrate: 170,
    average_watts: 200,
    max_watts: 250,
    timezone: 'UTC'
  },
  {
    id: '2',
    strava_activity_id: 123456790,
    user_id: 'user-1',
    name: 'Evening Run',
    sport_type: 'Run',
    start_date: '2024-01-17T18:00:00Z',
    start_date_local: '2024-01-17T18:00:00Z',
    distance: 8000, // 8km
    moving_time: 2880, // 48 minutes
    elapsed_time: 2880,
    total_elevation_gain: 80,
    average_speed: 2.78, // m/s
    max_speed: 3.33,
    average_heartrate: 155,
    max_heartrate: 175,
    average_watts: 220,
    max_watts: 280,
    timezone: 'UTC'
  },
  {
    id: '3',
    strava_activity_id: 123456791,
    user_id: 'user-1',
    name: 'Long Run',
    sport_type: 'Run',
    start_date: '2024-01-20T07:00:00Z',
    start_date_local: '2024-01-20T07:00:00Z',
    distance: 15000, // 15km
    moving_time: 5400, // 90 minutes
    elapsed_time: 5400,
    total_elevation_gain: 150,
    average_speed: 2.78, // m/s
    max_speed: 3.33,
    average_heartrate: 145,
    max_heartrate: 165,
    average_watts: 180,
    max_watts: 240,
    timezone: 'UTC'
  }
]

describe('ActivityFrequencyWidget', () => {
  beforeEach(() => {
    // Mock the current date to be consistent in tests
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-01-22T12:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders empty state when no activities provided', () => {
    render(<ActivityFrequencyWidget activities={[]} />)
    
    expect(screen.getByText('Activity Frequency')).toBeInTheDocument()
    expect(screen.getByText('Track your training consistency')).toBeInTheDocument()
    expect(screen.getByText('No activities found')).toBeInTheDocument()
    expect(screen.getByText('Sync your activities to see your frequency')).toBeInTheDocument()
  })

  it('renders frequency data when activities are provided', () => {
    render(<ActivityFrequencyWidget activities={mockActivities} />)
    
    expect(screen.getByText('Activity Frequency')).toBeInTheDocument()
    expect(screen.getByText('Your training consistency over the last 4 weeks')).toBeInTheDocument()
  })

  it('displays total activities count', () => {
    render(<ActivityFrequencyWidget activities={mockActivities} />)
    
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Total Activities')).toBeInTheDocument()
  })

  it('displays average activities per week', () => {
    render(<ActivityFrequencyWidget activities={mockActivities} />)
    
    expect(screen.getByText('0.8')).toBeInTheDocument() // 3 activities / 4 weeks = 0.75, rounded to 0.8
    expect(screen.getByText('Avg/Week')).toBeInTheDocument()
  })

  it('displays consistency score', () => {
    render(<ActivityFrequencyWidget activities={mockActivities} />)
    
    expect(screen.getByText('Consistency Score')).toBeInTheDocument()
    // With 0.75 avg/week, consistency score should be (0.75/3)*100 = 25%
    expect(screen.getByText('25%')).toBeInTheDocument()
  })

  it('displays weekly breakdown', () => {
    render(<ActivityFrequencyWidget activities={mockActivities} />)
    
    expect(screen.getByText('Weekly Breakdown')).toBeInTheDocument()
    expect(screen.getByText('Week 1')).toBeInTheDocument()
    expect(screen.getByText('Week 2')).toBeInTheDocument()
    expect(screen.getByText('Week 3')).toBeInTheDocument()
    expect(screen.getByText('Week 4')).toBeInTheDocument()
  })

  it('displays activity calendar', () => {
    render(<ActivityFrequencyWidget activities={mockActivities} />)
    
    expect(screen.getByText('Activity Calendar')).toBeInTheDocument()
    expect(screen.getByTestId('activity-calendar')).toBeInTheDocument()
    expect(screen.getByText('Activity Calendar (3 activities)')).toBeInTheDocument()
  })

  it('displays streak information', () => {
    render(<ActivityFrequencyWidget activities={mockActivities} />)
    
    expect(screen.getByText('Current Streak')).toBeInTheDocument()
    expect(screen.getByText('Longest Streak')).toBeInTheDocument()
  })

  it('handles activities with different dates correctly', () => {
    const activitiesWithDifferentDates = [
      {
        ...mockActivities[0],
        start_date: '2024-01-15T06:00:00Z'
      },
      {
        ...mockActivities[1],
        start_date: '2024-01-16T18:00:00Z' // Next day
      },
      {
        ...mockActivities[2],
        start_date: '2024-01-17T07:00:00Z' // Next day
      }
    ]

    render(<ActivityFrequencyWidget activities={activitiesWithDifferentDates} />)
    
    expect(screen.getByText('Total Activities')).toBeInTheDocument()
    expect(screen.getByText('Current Streak')).toBeInTheDocument()
    expect(screen.getByText('Longest Streak')).toBeInTheDocument()
  })

  it('calculates distance correctly with unit preferences', () => {
    render(<ActivityFrequencyWidget activities={mockActivities} />)
    
    // Total distance: 5km + 8km + 15km = 28km
    expect(screen.getByText(/28\.0 km/)).toBeInTheDocument()
  })
}) 