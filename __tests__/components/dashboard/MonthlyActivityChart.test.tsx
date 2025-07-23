import { render, screen } from '@testing-library/react'
import { MonthlyActivityChart } from '@/components/dashboard/MonthlyActivityChart'
import { useUserActivities } from '@/hooks/use-user-activities'
import { useUnitPreferences } from '@/hooks/useUnitPreferences'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { convertDistance } from '@/lib/utils'
import type { Activity } from '@/lib/strava/types'

// Mock the hooks
jest.mock('@/hooks/use-user-activities')
jest.mock('@/hooks/useUnitPreferences')

const mockUseUserActivities = useUserActivities as jest.MockedFunction<typeof useUserActivities>
const mockUseUnitPreferences = useUnitPreferences as jest.MockedFunction<typeof useUnitPreferences>

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
    
    // Mock default unit preferences (km)
    mockUseUnitPreferences.mockReturnValue({
      preferences: {
        distance: 'km',
        pace: 'min/km',
        temperature: 'celsius',
        windSpeed: 'km/h'
      },
      isLoading: false,
      updatePreferences: jest.fn(),
      setDistanceUnit: jest.fn(),
      toggleUnits: jest.fn(),
    })
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

  it('renders monthly activity chart with km by default', () => {
    const mockActivities = [createMockActivity()]

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
  })

  it('uses unit preferences correctly', () => {
    mockUseUnitPreferences.mockReturnValue({
      preferences: {
        distance: 'miles',
        pace: 'min/mile',
        temperature: 'fahrenheit',
        windSpeed: 'mph'
      },
      isLoading: false,
      updatePreferences: jest.fn(),
      setDistanceUnit: jest.fn(),
      toggleUnits: jest.fn(),
    })

    const mockActivities = [createMockActivity()]

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

    // Verify that the component renders without errors when using miles
    expect(screen.getByText('Monthly Activity')).toBeInTheDocument()
  })
})

// Test the conversion logic separately
describe('Distance conversion logic', () => {
  it('converts distance correctly from meters to km', () => {
    const result = convertDistance(5000, 'km')
    expect(result).toBe(5)
  })

  it('converts distance correctly from meters to miles', () => {
    const result = convertDistance(1609.34, 'miles') // 1 mile in meters
    expect(result).toBeCloseTo(1, 1)
  })
}) 