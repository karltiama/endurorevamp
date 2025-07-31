import { renderHook } from '@testing-library/react'
import { useFilteredActivities } from '@/hooks/useFilteredActivities'
import { useUserActivities } from '@/hooks/use-user-activities'

// Mock the useUserActivities hook
jest.mock('@/hooks/use-user-activities')

const mockUseUserActivities = useUserActivities as jest.MockedFunction<typeof useUserActivities>

describe('useFilteredActivities', () => {
  const mockActivities = [
    {
      id: '1',
      strava_activity_id: 123,
      user_id: 'user1',
      name: 'Morning Run',
      sport_type: 'Run',
      start_date: '2025-06-15T08:00:00Z',
      start_date_local: '2025-06-15T08:00:00Z',
      distance: 5000,
      moving_time: 1800,
      elapsed_time: 1800,
      total_elevation_gain: 50,
      timezone: 'America/New_York',
    },
    {
      id: '2',
      strava_activity_id: 124,
      user_id: 'user1',
      name: 'Afternoon Ride',
      sport_type: 'Ride',
      start_date: '2025-06-16T14:00:00Z',
      start_date_local: '2025-06-16T14:00:00Z',
      distance: 20000,
      moving_time: 3600,
      elapsed_time: 3600,
      total_elevation_gain: 200,
      timezone: 'America/New_York',
    },
    {
      id: '3',
      strava_activity_id: 125,
      user_id: 'user1',
      name: 'Evening Run',
      sport_type: 'Run',
      start_date: '2025-06-17T18:00:00Z',
      start_date_local: '2025-06-17T18:00:00Z',
      distance: 3000,
      moving_time: 1200,
      elapsed_time: 1200,
      total_elevation_gain: 30,
      timezone: 'America/New_York',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return all activities when filter is "all"', () => {
    mockUseUserActivities.mockReturnValue({
      data: mockActivities,
      isLoading: false,
      error: null,
    })

    const { result } = renderHook(() => useFilteredActivities('user1', 'all', 'date-desc'))

    expect(result.current.activities).toHaveLength(3)
    expect(result.current.totalCount).toBe(3)
    expect(result.current.filteredCount).toBe(3)
  })

  it('should filter activities by type "run"', () => {
    mockUseUserActivities.mockReturnValue({
      data: mockActivities,
      isLoading: false,
      error: null,
    })

    const { result } = renderHook(() => useFilteredActivities('user1', 'run', 'date-desc'))

    expect(result.current.activities).toHaveLength(2)
    expect(result.current.activities.every(activity => activity.sport_type === 'Run')).toBe(true)
    expect(result.current.totalCount).toBe(3)
    expect(result.current.filteredCount).toBe(2)
  })

  it('should filter activities by type "ride"', () => {
    mockUseUserActivities.mockReturnValue({
      data: mockActivities,
      isLoading: false,
      error: null,
    })

    const { result } = renderHook(() => useFilteredActivities('user1', 'ride', 'date-desc'))

    expect(result.current.activities).toHaveLength(1)
    expect(result.current.activities[0].sport_type).toBe('Ride')
    expect(result.current.totalCount).toBe(3)
    expect(result.current.filteredCount).toBe(1)
  })

  it('should return empty array for favorite filter (not implemented yet)', () => {
    mockUseUserActivities.mockReturnValue({
      data: mockActivities,
      isLoading: false,
      error: null,
    })

    const { result } = renderHook(() => useFilteredActivities('user1', 'favorite', 'date-desc'))

    expect(result.current.activities).toHaveLength(0)
    expect(result.current.totalCount).toBe(3)
    expect(result.current.filteredCount).toBe(0)
  })

  it('should return empty array for flagged filter (not implemented yet)', () => {
    mockUseUserActivities.mockReturnValue({
      data: mockActivities,
      isLoading: false,
      error: null,
    })

    const { result } = renderHook(() => useFilteredActivities('user1', 'flagged', 'date-desc'))

    expect(result.current.activities).toHaveLength(0)
    expect(result.current.totalCount).toBe(3)
    expect(result.current.filteredCount).toBe(0)
  })

  it('should handle empty activities array', () => {
    mockUseUserActivities.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    })

    const { result } = renderHook(() => useFilteredActivities('user1', 'all', 'date-desc'))

    expect(result.current.activities).toHaveLength(0)
    expect(result.current.totalCount).toBe(0)
    expect(result.current.filteredCount).toBe(0)
  })

  it('should handle loading state', () => {
    mockUseUserActivities.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    })

    const { result } = renderHook(() => useFilteredActivities('user1', 'all', 'date-desc'))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.activities).toHaveLength(0)
  })

  it('should handle error state', () => {
    const mockError = new Error('Failed to fetch activities')
    mockUseUserActivities.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
    })

    const { result } = renderHook(() => useFilteredActivities('user1', 'all', 'date-desc'))

    expect(result.current.error).toBe(mockError)
    expect(result.current.activities).toHaveLength(0)
  })

  describe('sorting functionality', () => {
    it('should sort activities by date descending (newest first)', () => {
      mockUseUserActivities.mockReturnValue({
        data: mockActivities,
        isLoading: false,
        error: null,
      })

      const { result } = renderHook(() => useFilteredActivities('user1', 'all', 'date-desc'))

      expect(result.current.activities).toHaveLength(3)

      expect(result.current.activities[0].name).toBe('Evening Run') // Latest date
      expect(result.current.activities[1].name).toBe('Afternoon Ride')
      expect(result.current.activities[2].name).toBe('Morning Run') // Earliest date
    })

    it('should sort activities by date ascending (oldest first)', () => {
      mockUseUserActivities.mockReturnValue({
        data: mockActivities,
        isLoading: false,
        error: null,
      })

      const { result } = renderHook(() => useFilteredActivities('user1', 'all', 'date-asc'))

      expect(result.current.activities).toHaveLength(3)
      expect(result.current.activities[0].name).toBe('Morning Run') // Earliest date
      expect(result.current.activities[1].name).toBe('Afternoon Ride')
      expect(result.current.activities[2].name).toBe('Evening Run') // Latest date
    })

    it('should sort activities by distance descending (longest first)', () => {
      mockUseUserActivities.mockReturnValue({
        data: mockActivities,
        isLoading: false,
        error: null,
      })

      const { result } = renderHook(() => useFilteredActivities('user1', 'all', 'distance-desc'))

      expect(result.current.activities).toHaveLength(3)
      expect(result.current.activities[0].distance).toBe(20000) // Longest
      expect(result.current.activities[1].distance).toBe(5000)
      expect(result.current.activities[2].distance).toBe(3000) // Shortest
    })

    it('should sort activities by name ascending (A-Z)', () => {
      mockUseUserActivities.mockReturnValue({
        data: mockActivities,
        isLoading: false,
        error: null,
      })

      const { result } = renderHook(() => useFilteredActivities('user1', 'all', 'name-asc'))

      expect(result.current.activities).toHaveLength(3)
      expect(result.current.activities[0].name).toBe('Afternoon Ride') // A
      expect(result.current.activities[1].name).toBe('Evening Run') // E
      expect(result.current.activities[2].name).toBe('Morning Run') // M
    })
  })
}) 