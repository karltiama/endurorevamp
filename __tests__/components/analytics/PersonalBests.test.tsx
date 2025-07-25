import { render, screen } from '@testing-library/react'
import { PersonalBests } from '@/components/analytics/PersonalBests'
import { Activity } from '@/lib/strava/types'

// Mock the useUnitPreferences hook
jest.mock('@/hooks/useUnitPreferences', () => ({
  useUnitPreferences: () => ({
    preferences: {
      distance: 'km',
      weight: 'kg',
      temperature: 'celsius'
    }
  })
}))

const mockActivities: Activity[] = [
  {
    id: '1',
    user_id: 'user1',
    strava_activity_id: 123456,
    name: 'Morning Run',
    sport_type: 'Run',
    start_date: '2025-01-15T08:00:00Z',
    start_date_local: '2025-01-15T08:00:00Z',
    timezone: 'America/Detroit',
    distance: 5000, // 5km
    moving_time: 1800, // 30 minutes
    elapsed_time: 1800,
    total_elevation_gain: 50,
    average_speed: 2.78, // 10 min/km pace
    max_speed: 3.33, // 5 min/km pace
    average_heartrate: 150,
    max_heartrate: 170,
    average_watts: 200,
    max_watts: 250
  },
  {
    id: '2',
    user_id: 'user1',
    strava_activity_id: 123457,
    name: 'Long Distance Run',
    sport_type: 'Run',
    start_date: '2025-01-20T07:00:00Z',
    start_date_local: '2025-01-20T07:00:00Z',
    timezone: 'America/Detroit',
    distance: 10000, // 10km
    moving_time: 3600, // 1 hour
    elapsed_time: 3600,
    total_elevation_gain: 100,
    average_speed: 2.78, // 10 min/km pace
    max_speed: 4.17, // 4 min/km pace
    average_heartrate: 160,
    max_heartrate: 180,
    average_watts: 220,
    max_watts: 300
  },
  {
    id: '3',
    user_id: 'user1',
    strava_activity_id: 123458,
    name: 'Fast 5K',
    sport_type: 'Run',
    start_date: '2025-01-25T06:00:00Z',
    start_date_local: '2025-01-25T06:00:00Z',
    timezone: 'America/Detroit',
    distance: 5000, // 5km
    moving_time: 1200, // 20 minutes
    elapsed_time: 1200,
    total_elevation_gain: 25,
    average_speed: 4.17, // 4 min/km pace
    max_speed: 5.56, // 3 min/km pace
    average_heartrate: 175,
    max_heartrate: 190,
    average_watts: 250,
    max_watts: 350
  }
]

describe('PersonalBests', () => {
  it('renders empty state when no activities provided', () => {
    render(<PersonalBests activities={[]} />)
    
    expect(screen.getByText('Personal Bests')).toBeInTheDocument()
    expect(screen.getByText('No activities found to calculate personal bests')).toBeInTheDocument()
    expect(screen.getByText('Sync your activities from Strava to see your records')).toBeInTheDocument()
  })

  it('renders personal bests when activities are provided', () => {
    render(<PersonalBests activities={mockActivities} />)
    
    expect(screen.getByText('Personal Bests')).toBeInTheDocument()
    expect(screen.getByText('Your best performances across different metrics and activities')).toBeInTheDocument()
  })

  it('displays tabs for different categories', () => {
    render(<PersonalBests activities={mockActivities} />)
    
    expect(screen.getByText('All Records')).toBeInTheDocument()
    expect(screen.getByText('Distance')).toBeInTheDocument()
    expect(screen.getByText('Pace')).toBeInTheDocument()
    expect(screen.getByText('Other')).toBeInTheDocument()
  })

  it('shows longest distance record', () => {
    render(<PersonalBests activities={mockActivities} />)
    
    // Should show the 10km run as longest distance
    expect(screen.getByText('Longest Distance')).toBeInTheDocument()
    expect(screen.getByText('10.0 km')).toBeInTheDocument()
  })

  it('shows fastest pace record', () => {
    render(<PersonalBests activities={mockActivities} />)
    
    // Should show the 4 min/km pace from the Fast 5K
    expect(screen.getByText('Fastest Average Pace')).toBeInTheDocument()
  })

  it('shows max heart rate record', () => {
    render(<PersonalBests activities={mockActivities} />)
    
    // Should show the 190 BPM from the Fast 5K
    expect(screen.getByText('Max Heart Rate')).toBeInTheDocument()
    expect(screen.getByText('190 BPM')).toBeInTheDocument()
  })

  it('shows max power record', () => {
    render(<PersonalBests activities={mockActivities} />)
    
    // Should show the 350W from the Fast 5K
    expect(screen.getByText('Max Power')).toBeInTheDocument()
    expect(screen.getByText('350 W')).toBeInTheDocument()
  })

  it('shows most elevation gain record', () => {
    render(<PersonalBests activities={mockActivities} />)
    
    // Should show the 100m from the Long Distance Run
    expect(screen.getByText('Most Elevation Gain')).toBeInTheDocument()
    expect(screen.getByText('100 m')).toBeInTheDocument()
  })

  it('shows longest duration record', () => {
    render(<PersonalBests activities={mockActivities} />)
    
    // Should show the 1 hour from the Long Distance Run
    expect(screen.getByText('Longest Duration')).toBeInTheDocument()
    expect(screen.getByText('1:00:00')).toBeInTheDocument()
  })

  it('shows sport type badges', () => {
    render(<PersonalBests activities={mockActivities} />)
    
    // Should show Run badges for all activities
    const runBadges = screen.getAllByText('Run')
    expect(runBadges.length).toBeGreaterThan(0)
  })

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
        total_elevation_gain: 0
      }
    ]

    render(<PersonalBests activities={incompleteActivities} />)
    
    // Should show the component structure but with empty content
    expect(screen.getByText('Personal Bests')).toBeInTheDocument()
    expect(screen.getByText('All Records')).toBeInTheDocument()
    expect(screen.getByText('Distance')).toBeInTheDocument()
    expect(screen.getByText('Pace')).toBeInTheDocument()
    expect(screen.getByText('Other')).toBeInTheDocument()
  })

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
        total_elevation_gain: 0
      }
    ]

    render(<PersonalBests activities={mixedActivities} />)
    
    // Should still show the valid records from mockActivities
    expect(screen.getByText('Longest Distance')).toBeInTheDocument()
    expect(screen.getByText('10.0 km')).toBeInTheDocument()
  })
}) 