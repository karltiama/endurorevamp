import React from 'react'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { KeyMetrics } from '@/components/dashboard/KeyMetrics'
import { calculateWeeklyDistance, calculateActivityStreak, getLastActivity } from '@/lib/dashboard/metrics'
import type { Activity } from '@/lib/strava/types'

// Mock the hooks
jest.mock('@/hooks/use-user-activities', () => ({
  useUserActivities: jest.fn(),
}))

jest.mock('@/hooks/useGoals', () => ({
  useUserGoals: jest.fn(),
  useUpdateGoal: jest.fn(),
  useGoalTypes: jest.fn(),
  useCreateGoal: jest.fn(),
}))

const { useUserActivities } = require('@/hooks/use-user-activities')
const { useUserGoals, useUpdateGoal, useGoalTypes, useCreateGoal } = require('@/hooks/useGoals')

// Helper to create a test QueryClient
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

// Sample activity data for testing
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

describe('KeyMetrics Component', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    jest.clearAllMocks()
    
    // Setup default mocks for goal-related hooks
    useUpdateGoal.mockReturnValue({
      mutate: jest.fn(),
      mutateAsync: jest.fn(),
      isLoading: false,
    })
    
    useGoalTypes.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    })
    
    useCreateGoal.mockReturnValue({
      mutate: jest.fn(),
      mutateAsync: jest.fn(),
      isLoading: false,
    })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  it('shows loading skeleton when data is loading', () => {
    useUserActivities.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    })

    useUserGoals.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    })

    render(<KeyMetrics userId="user-1" />, { wrapper })

    // Should show skeleton with multiple cards
    const skeletonCards = screen.getAllByText((_, element) => {
      return element?.classList.contains('animate-pulse') || false
    })
    expect(skeletonCards.length).toBeGreaterThan(0)
  })

  it('shows setup message when no dashboard goals exist', () => {
    useUserActivities.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    })

    useUserGoals.mockReturnValue({
      data: { goals: [] },
      isLoading: false,
      error: null,
    })

    render(<KeyMetrics userId="user-1" />, { wrapper })

    expect(screen.getByText('Set Up Your Dashboard Goals')).toBeInTheDocument()
    expect(screen.getByText('Choose up to 3 goals to track as key metrics on your dashboard.')).toBeInTheDocument()
  })

  it('displays goal metric cards when dashboard goals exist', () => {
    const mockActivities = [
      createMockActivity({
        name: 'Recent Run',
        distance: 10000,
        start_date: new Date().toISOString(),
      }),
    ]

    const mockGoals = [
      {
        id: 'goal-1',
        goal_type: { display_name: 'Weekly Distance Goal', category: 'distance' },
        target_value: 50,
        current_progress: 25,
        goal_data: { show_on_dashboard: true, dashboard_priority: 1 },
        is_active: true,
      },
      {
        id: 'goal-2',
        goal_type: { display_name: 'Monthly Frequency Goal', category: 'frequency' },
        target_value: 20,
        current_progress: 12,
        goal_data: { show_on_dashboard: true, dashboard_priority: 2 },
        is_active: true,
      },
    ]

    useUserActivities.mockReturnValue({
      data: mockActivities,
      isLoading: false,
      error: null,
    })

    useUserGoals.mockReturnValue({
      data: { goals: mockGoals },
      isLoading: false,
      error: null,
    })

    render(<KeyMetrics userId="user-1" />, { wrapper })

    // Should show the goal metric cards
    expect(screen.getByText('Weekly Distance Goal')).toBeInTheDocument()
    expect(screen.getByText('Monthly Frequency Goal')).toBeInTheDocument()
    expect(screen.getByText('Key Metrics')).toBeInTheDocument()
  })
})

describe('Dashboard Metrics Utilities', () => {
  describe('calculateWeeklyDistance', () => {
    it('calculates weekly distance correctly', () => {
      const now = new Date()
      const thisWeek = new Date(now)
      thisWeek.setDate(now.getDate() - now.getDay() + 1) // This week (Monday)
      
      const lastWeek = new Date(thisWeek)
      lastWeek.setDate(thisWeek.getDate() - 7)

      const activities = [
        createMockActivity({ 
          distance: 5000, 
          start_date: thisWeek.toISOString() 
        }),
        createMockActivity({ 
          distance: 10000, 
          start_date: lastWeek.toISOString() 
        }),
      ]

      const result = calculateWeeklyDistance(activities)

      expect(result.current).toBe(5000)
      expect(result.previous).toBe(10000)
      expect(result.change).toBe(-50) // 50% decrease
    })

    it('handles no previous week data', () => {
      const thisWeek = new Date()
      const activities = [
        createMockActivity({ 
          distance: 5000, 
          start_date: thisWeek.toISOString() 
        })
      ]

      const result = calculateWeeklyDistance(activities)

      expect(result.current).toBe(5000)
      expect(result.previous).toBe(0)
      expect(result.change).toBe(100)
    })

    it('handles empty activities', () => {
      const result = calculateWeeklyDistance([])

      expect(result.current).toBe(0)
      expect(result.previous).toBe(0)
      expect(result.change).toBe(0)
    })
  })

  describe('calculateActivityStreak', () => {
    it('calculates current streak correctly', () => {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)
      const twoDaysAgo = new Date(today)
      twoDaysAgo.setDate(today.getDate() - 2)

      const activities = [
        createMockActivity({ start_date: today.toISOString() }),
        createMockActivity({ start_date: yesterday.toISOString() }),
        createMockActivity({ start_date: twoDaysAgo.toISOString() }),
      ]

      const result = calculateActivityStreak(activities)

      expect(result.current).toBe(3)
      expect(result.longest).toBe(3)
    })

    it('handles broken streak', () => {
      const today = new Date()
      const threeDaysAgo = new Date(today)
      threeDaysAgo.setDate(today.getDate() - 3)

      const activities = [
        createMockActivity({ start_date: today.toISOString() }),
        createMockActivity({ start_date: threeDaysAgo.toISOString() }),
      ]

      const result = calculateActivityStreak(activities)

      expect(result.current).toBe(1) // Only today counts for current streak
    })

    it('calculates consistency percentage', () => {
      const activities = Array.from({ length: 15 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - i)
        return createMockActivity({ start_date: date.toISOString() })
      })

      const result = calculateActivityStreak(activities)

      expect(result.consistency).toBe(50) // 15 days out of 30 = 50%
    })

    it('handles empty activities', () => {
      const result = calculateActivityStreak([])

      expect(result.current).toBe(0)
      expect(result.longest).toBe(0)
      expect(result.consistency).toBe(0)
    })
  })

  describe('getLastActivity', () => {
    it('returns the most recent activity', () => {
      const older = createMockActivity({ 
        id: '1', 
        name: 'Older Activity',
        start_date: new Date('2024-01-01').toISOString()
      })
      const newer = createMockActivity({ 
        id: '2', 
        name: 'Newer Activity',
        start_date: new Date('2024-01-02').toISOString()
      })

      // Activities should be passed in descending order (newest first)
      const result = getLastActivity([newer, older])

      expect(result?.name).toBe('Newer Activity')
    })

    it('returns null for empty activities', () => {
      const result = getLastActivity([])

      expect(result).toBeNull()
    })
  })
}) 