import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ActivitiesDashboard } from '@/components/strava/ActivitiesDashboard'
import { useUserActivities } from '@/hooks/use-user-activities'
import { Activity } from '@/lib/strava/types'

// Mock the hook
jest.mock('@/hooks/use-user-activities')
const mockUseUserActivities = useUserActivities as jest.MockedFunction<typeof useUserActivities>

// Mock activities data (database format)
const mockActivities: Activity[] = [
  {
    id: '1',
    user_id: 'test-user-id',
    strava_activity_id: 123456789,
    name: 'Morning Run',
    distance: 5000, // 5km
    moving_time: 1800, // 30 minutes
    elapsed_time: 1900,
    total_elevation_gain: 50,
    activity_type: 'Run',
    sport_type: 'Run',
    start_date: '2024-01-15T08:00:00Z',
    start_date_local: '2024-01-15T08:00:00Z',
    timezone: 'UTC',
    average_speed: 2.78, // 10 km/h
    max_speed: 3.5,
    average_heartrate: 150,
    kudos_count: 5,
    comment_count: 1,
    athlete_count: 1,
    photo_count: 0,
    trainer: false,
    commute: false,
    manual: false,
    private: false,
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z'
  },
  {
    id: '2',
    user_id: 'test-user-id',
    strava_activity_id: 123456790,
    name: 'Evening Bike Ride',
    distance: 25000, // 25km
    moving_time: 3600, // 1 hour
    elapsed_time: 3720,
    total_elevation_gain: 200,
    activity_type: 'Ride',
    sport_type: 'Ride',
    start_date: '2024-01-14T18:00:00Z',
    start_date_local: '2024-01-14T18:00:00Z',
    timezone: 'UTC',
    average_speed: 6.94, // 25 km/h
    max_speed: 8.33,
    average_heartrate: 140,
    average_watts: 180,
    kudos_count: 8,
    comment_count: 2,
    athlete_count: 1,
    photo_count: 1,
    trainer: false,
    commute: false,
    manual: false,
    private: false,
    created_at: '2024-01-14T18:00:00Z',
    updated_at: '2024-01-14T18:00:00Z'
  }
]

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('ActivitiesDashboard', () => {
  const defaultProps = {
    userId: 'test-user-id'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Loading State', () => {
    it('shows loading state when data is being fetched', () => {
      mockUseUserActivities.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
        isRefetching: false,
        isError: false,
        isSuccess: false,
        isFetching: true
      } as any)

      render(
        <TestWrapper>
          <ActivitiesDashboard {...defaultProps} />
        </TestWrapper>
      )

      expect(screen.getByText('Recent Activities')).toBeInTheDocument()
      expect(screen.getByText('Loading your latest activities from database...')).toBeInTheDocument()
      
      // Should show skeleton loaders
      const skeletons = screen.getAllByRole('generic')
      const animatedSkeletons = skeletons.filter(el => 
        el.className.includes('animate-pulse')
      )
      expect(animatedSkeletons.length).toBeGreaterThan(0)
    })
  })

  describe('Error State', () => {
    const mockRefetch = jest.fn()

    it('shows error state when there is an error', () => {
      const error = new Error('Failed to fetch activities')
      mockUseUserActivities.mockReturnValue({
        data: undefined,
        isLoading: false,
        error,
        refetch: mockRefetch,
        isRefetching: false,
        isError: true,
        isSuccess: false,
        isFetching: false
      } as any)

      render(
        <TestWrapper>
          <ActivitiesDashboard {...defaultProps} />
        </TestWrapper>
      )

      expect(screen.getByText('Recent Activities')).toBeInTheDocument()
      expect(screen.getByText('Unable to load your activities from database')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch activities')).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
      expect(screen.getByText('💡 Try syncing your Strava data to populate the database.')).toBeInTheDocument()
    })

    it('calls refetch when try again button is clicked', () => {
      const error = new Error('Failed to fetch activities')
      mockUseUserActivities.mockReturnValue({
        data: undefined,
        isLoading: false,
        error,
        refetch: mockRefetch,
        isRefetching: false,
        isError: true,
        isSuccess: false,
        isFetching: false
      } as any)

      render(
        <TestWrapper>
          <ActivitiesDashboard {...defaultProps} />
        </TestWrapper>
      )

      const tryAgainButton = screen.getByText('Try Again')
      fireEvent.click(tryAgainButton)

      expect(mockRefetch).toHaveBeenCalledTimes(1)
    })

    it('shows loading state on try again button when refetching', () => {
      const error = new Error('Failed to fetch activities')
      mockUseUserActivities.mockReturnValue({
        data: undefined,
        isLoading: false,
        error,
        refetch: mockRefetch,
        isRefetching: true,
        isError: true,
        isSuccess: false,
        isFetching: true
      } as any)

      render(
        <TestWrapper>
          <ActivitiesDashboard {...defaultProps} />
        </TestWrapper>
      )

      const tryAgainButton = screen.getByRole('button', { name: /try again/i })
      expect(tryAgainButton).toBeDisabled()
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no activities are returned', () => {
      mockUseUserActivities.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
        isRefetching: false,
        isError: false,
        isSuccess: true,
        isFetching: false
      } as any)

      render(
        <TestWrapper>
          <ActivitiesDashboard {...defaultProps} />
        </TestWrapper>
      )

      expect(screen.getByText('Recent Activities')).toBeInTheDocument()
      expect(screen.getByText('No activities found')).toBeInTheDocument()
      expect(screen.getByText('No activities found in your database.')).toBeInTheDocument()
      expect(screen.getByText('💡 Click "Sync Strava Data" to load your activities from Strava.')).toBeInTheDocument()
    })

    it('shows empty state when activities data is undefined', () => {
      mockUseUserActivities.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
        isRefetching: false,
        isError: false,
        isSuccess: true,
        isFetching: false
      } as any)

      render(
        <TestWrapper>
          <ActivitiesDashboard {...defaultProps} />
        </TestWrapper>
      )

      expect(screen.getByText('No activities found')).toBeInTheDocument()
      expect(screen.getByText('No activities found in your database.')).toBeInTheDocument()
      expect(screen.getByText('💡 Click "Sync Strava Data" to load your activities from Strava.')).toBeInTheDocument()
    })
  })

  describe('Success State with Activities', () => {
    const mockRefetch = jest.fn()

    beforeEach(() => {
      mockUseUserActivities.mockReturnValue({
        data: mockActivities,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        isRefetching: false,
        isError: false,
        isSuccess: true,
        isFetching: false
      } as any)
    })

    it('displays activities when data is loaded', () => {
      render(
        <TestWrapper>
          <ActivitiesDashboard {...defaultProps} />
        </TestWrapper>
      )

      expect(screen.getByText('Recent Activities')).toBeInTheDocument()
      expect(screen.getByText('Your latest 2 activities from database')).toBeInTheDocument()
      
      // Check that activities are displayed
      expect(screen.getByText('Morning Run')).toBeInTheDocument()
      expect(screen.getByText('Evening Bike Ride')).toBeInTheDocument()
    })

    it('displays correct activity badges', () => {
      render(
        <TestWrapper>
          <ActivitiesDashboard {...defaultProps} />
        </TestWrapper>
      )

      expect(screen.getByText('Run')).toBeInTheDocument()
      expect(screen.getByText('Ride')).toBeInTheDocument()
    })

    it('formats distance correctly', () => {
      render(
        <TestWrapper>
          <ActivitiesDashboard {...defaultProps} />
        </TestWrapper>
      )

      expect(screen.getByText('5 km')).toBeInTheDocument() // 5000m = 5 km
      expect(screen.getByText('25 km')).toBeInTheDocument() // 25000m = 25 km
    })

    it('formats duration correctly', () => {
      render(
        <TestWrapper>
          <ActivitiesDashboard {...defaultProps} />
        </TestWrapper>
      )

      expect(screen.getByText('30m')).toBeInTheDocument() // 1800s = 30m
      expect(screen.getByText('1h 0m')).toBeInTheDocument() // 3600s = 1h 0m
    })

    it('formats speed correctly', () => {
      render(
        <TestWrapper>
          <ActivitiesDashboard {...defaultProps} />
        </TestWrapper>
      )

      expect(screen.getByText('10.0 km/h')).toBeInTheDocument() // 2.78 m/s = 10.0 km/h
      expect(screen.getByText('25.0 km/h')).toBeInTheDocument() // 6.94 m/s = 25.0 km/h
    })

    it('displays heart rate when available', () => {
      render(
        <TestWrapper>
          <ActivitiesDashboard {...defaultProps} />
        </TestWrapper>
      )

      expect(screen.getByText('150 bpm')).toBeInTheDocument() // Morning Run heart rate
      expect(screen.getByText('140 bpm')).toBeInTheDocument() // Evening Bike Ride heart rate
    })

    it('displays power when available', () => {
      render(
        <TestWrapper>
          <ActivitiesDashboard {...defaultProps} />
        </TestWrapper>
      )

      expect(screen.getByText('180w')).toBeInTheDocument() // Evening Bike Ride power
    })

    it('has refresh functionality', () => {
      render(
        <TestWrapper>
          <ActivitiesDashboard {...defaultProps} />
        </TestWrapper>
      )

      const refreshButton = screen.getByRole('button')
      fireEvent.click(refreshButton)

      expect(mockRefetch).toHaveBeenCalledTimes(1)
    })

    it('shows loading state on refresh button when refetching', () => {
      mockUseUserActivities.mockReturnValue({
        data: mockActivities,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        isRefetching: true,
        isError: false,
        isSuccess: true,
        isFetching: true
      } as any)

      render(
        <TestWrapper>
          <ActivitiesDashboard {...defaultProps} />
        </TestWrapper>
      )

      const refreshButton = screen.getByRole('button')
      expect(refreshButton).toBeDisabled()
    })

    it('formats dates correctly', () => {
      render(
        <TestWrapper>
          <ActivitiesDashboard {...defaultProps} />
        </TestWrapper>
      )

      // Check that dates are formatted (exact format may vary by locale)
      expect(screen.getByText(/Jan 15/)).toBeInTheDocument()
      expect(screen.getByText(/Jan 14/)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      mockUseUserActivities.mockReturnValue({
        data: mockActivities,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
        isRefetching: false,
        isError: false,
        isSuccess: true,
        isFetching: false
      } as any)

      render(
        <TestWrapper>
          <ActivitiesDashboard {...defaultProps} />
        </TestWrapper>
      )

      // Check that buttons are properly labeled
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })
}) 