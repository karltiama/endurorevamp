import { render, screen } from '@testing-library/react'
import { MonthlyActivityChart } from '@/components/dashboard/MonthlyActivityChart'
import { useUserActivities } from '@/hooks/use-user-activities'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Activity } from '@/lib/strava/types'

// Mock the useUserActivities hook
jest.mock('@/hooks/use-user-activities')

const mockUseUserActivities = useUserActivities as jest.MockedFunction<typeof useUserActivities>

// Create mock activities for testing
const createMockActivity = (overrides: Partial<Activity> = {}): Activity => ({
  id: '1',
  user_id: 'user-1',
  strava_activity_id: 12345,
  name: 'Morning Run',
  sport_type: 'Run',
  distance: 5000, // 5 km
  moving_time: 1800, // 30 minutes
  elapsed_time: 1800,
  total_elevation_gain: 100,
  start_date: new Date().toISOString(),
  start_date_local: new Date().toISOString(),
  timezone: 'UTC',
  created_at: new Date().toISOString(),
  ...overrides,
})

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

describe('MonthlyActivityChart', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders loading state', () => {
    mockUseUserActivities.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any)

    render(
      <TestWrapper>
        <MonthlyActivityChart userId="user-1" />
      </TestWrapper>
    )

    expect(screen.getByText('Loading activity data...')).toBeInTheDocument()
  })

  it('renders error state', () => {
    mockUseUserActivities.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch activities'),
    } as any)

    render(
      <TestWrapper>
        <MonthlyActivityChart userId="user-1" />
      </TestWrapper>
    )

    expect(screen.getByText('Failed to fetch activities')).toBeInTheDocument()
  })

  it('renders monthly activity data', () => {
    const currentYear = new Date().getFullYear()
    const mockActivities = [
      createMockActivity({
        start_date: new Date(currentYear, 0, 1).toISOString(), // January
        distance: 10000, // 10 km
      }),
      createMockActivity({
        start_date: new Date(currentYear, 0, 15).toISOString(), // January
        distance: 15000, // 15 km
      }),
      createMockActivity({
        start_date: new Date(currentYear, 1, 1).toISOString(), // February
        distance: 20000, // 20 km
      }),
    ]

    mockUseUserActivities.mockReturnValue({
      data: mockActivities,
      isLoading: false,
      error: null,
    } as any)

    render(
      <TestWrapper>
        <MonthlyActivityChart userId="user-1" />
      </TestWrapper>
    )

    // Check if the component renders the correct title and description
    expect(screen.getByText('Monthly Activity')).toBeInTheDocument()
    expect(screen.getByText('Your activity distance by month this year')).toBeInTheDocument()

    // Check if the months are rendered
    expect(screen.getByText('Jan')).toBeInTheDocument()
    expect(screen.getByText('Feb')).toBeInTheDocument()

    // Check if the distances are rendered
    expect(screen.getByText('25km')).toBeInTheDocument() // January total
    expect(screen.getByText('20km')).toBeInTheDocument() // February total
  })
}) 