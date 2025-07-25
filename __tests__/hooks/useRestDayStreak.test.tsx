import { renderHook, act } from '@testing-library/react'
import { useRestDayStreak } from '@/hooks/useRestDayStreak'

// Mock the useUserActivities hook
jest.mock('@/hooks/use-user-activities', () => ({
  useUserActivities: jest.fn()
}))

const mockUseUserActivities = require('@/hooks/use-user-activities').useUserActivities

describe('useRestDayStreak', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    jest.clearAllMocks()
  })

  it('should initialize with default preferences', () => {
    mockUseUserActivities.mockReturnValue({
      data: [],
      isLoading: false,
      error: null
    })

    const { result } = renderHook(() => useRestDayStreak('test-user'))

    expect(result.current.preferences.restDayCredits).toBe(2)
    expect(result.current.preferences.restDaysUsed).toBe(0)
    expect(result.current.preferences.autoUseRestDays).toBe(false)
    expect(result.current.preferences.showRestDayPrompts).toBe(true)
  })

  it('should calculate streak with rest days', () => {
    const mockActivities = [
      {
        id: '1',
        start_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      },
      {
        id: '2', 
        start_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
      }
    ]

    mockUseUserActivities.mockReturnValue({
      data: mockActivities,
      isLoading: false,
      error: null
    })

    const { result } = renderHook(() => useRestDayStreak('test-user'))

    // Should have a 2-day streak (with 1 rest day used)
    expect(result.current.streakData.current).toBe(2)
    expect(result.current.streakData.streakType).toBe('rest_day')
    expect(result.current.streakData.restDaysRemaining).toBe(1) // 2 credits - 1 used
  })

  it('should allow using rest days', () => {
    mockUseUserActivities.mockReturnValue({
      data: [],
      isLoading: false,
      error: null
    })

    const { result } = renderHook(() => useRestDayStreak('test-user'))

    act(() => {
      result.current.useRestDay()
    })

    expect(result.current.preferences.restDaysUsed).toBe(1)
    expect(result.current.streakData.restDaysRemaining).toBe(1) // 2 - 1 = 1
  })

  it('should update preferences', () => {
    mockUseUserActivities.mockReturnValue({
      data: [],
      isLoading: false,
      error: null
    })

    const { result } = renderHook(() => useRestDayStreak('test-user'))

    act(() => {
      result.current.updatePreferences({ restDayCredits: 3 })
    })

    expect(result.current.preferences.restDayCredits).toBe(3)
    expect(result.current.streakData.restDaysRemaining).toBe(3) // 3 - 0 = 3
  })

  it('should reset rest days used', () => {
    mockUseUserActivities.mockReturnValue({
      data: [],
      isLoading: false,
      error: null
    })

    const { result } = renderHook(() => useRestDayStreak('test-user'))

    // First use a rest day
    act(() => {
      result.current.useRestDay()
    })

    expect(result.current.preferences.restDaysUsed).toBe(1)

    // Then reset
    act(() => {
      result.current.resetRestDaysUsed()
    })

    expect(result.current.preferences.restDaysUsed).toBe(0)
    expect(result.current.streakData.restDaysRemaining).toBe(2) // 2 - 0 = 2
  })

  it('should show rest day prompt when appropriate', () => {
    const mockActivities = [
      {
        id: '1',
        start_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      }
    ]

    mockUseUserActivities.mockReturnValue({
      data: mockActivities,
      isLoading: false,
      error: null
    })

    const { result } = renderHook(() => useRestDayStreak('test-user'))

    // Should show prompt when streak is broken but rest days are available
    expect(result.current.streakData.shouldShowRestDayPrompt).toBe(true)
  })
}) 