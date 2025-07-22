import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EnhancedWorkoutPlanningDashboard } from '@/components/planning/EnhancedWorkoutPlanningDashboard'

// Mock the hooks
const mockUseEnhancedWorkoutPlanning = jest.fn()
const mockUseWorkoutPlanManager = jest.fn()
const mockUseWorkoutPlanAnalytics = jest.fn()

jest.mock('@/hooks/useEnhancedWorkoutPlanning', () => ({
  useEnhancedWorkoutPlanning: () => mockUseEnhancedWorkoutPlanning(),
  useWorkoutPlanManager: () => mockUseWorkoutPlanManager(),
  useWorkoutPlanAnalytics: () => mockUseWorkoutPlanAnalytics()
}))

jest.mock('@/hooks/useUnitPreferences', () => ({
  useUnitPreferences: () => ({
    preferences: { distance: 'km', pace: 'min/km' }
  })
}))

// Mock fetch for API calls
global.fetch = jest.fn()

describe('EnhancedWorkoutPlanningDashboard', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    // Mock workout plan analytics
    mockUseWorkoutPlanAnalytics.mockReturnValue({
      totalWorkouts: 2,
      totalTSS: 150,
      totalDistance: 25,
      totalTime: 75,
      workoutDistribution: { easy: 1, tempo: 1 },
      intensityDistribution: { low: 1, moderate: 1, high: 0 },
      sportDistribution: { Run: 2 },
      periodizationPhase: 'base',
      recommendations: []
    })

    // Mock fetch
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const mockWorkoutPlan = {
    id: 'test-plan',
    weekStart: '2024-01-01',
    workouts: {
      0: {
        id: 'workout-1',
        type: 'easy',
        sport: 'Run',
        duration: 30,
        intensity: 3,
        difficulty: 'beginner',
        energyCost: 3,
        recoveryTime: 12,
        reasoning: 'Easy recovery run',
        instructions: ['Warm up', 'Easy pace', 'Cool down'],
        tips: ['Stay hydrated'],
        alternatives: []
      },
      1: null, // Rest day
      2: {
        id: 'workout-2',
        type: 'tempo',
        sport: 'Run',
        duration: 45,
        intensity: 7,
        difficulty: 'intermediate',
        energyCost: 7,
        recoveryTime: 24,
        reasoning: 'Tempo workout',
        instructions: ['Warm up', 'Tempo pace', 'Cool down'],
        tips: ['Focus on form'],
        alternatives: []
      }
    },
    totalTSS: 150,
    totalDistance: 25,
    totalTime: 75,
    periodizationPhase: 'base',
    isEditable: true
  }

  it('renders edit plan button when plan exists', () => {
    mockUseEnhancedWorkoutPlanning.mockReturnValue({
      todaysWorkout: null,
      weeklyPlan: mockWorkoutPlan,
      isLoadingTodaysWorkout: false,
      isLoadingWeeklyPlan: false,
      isLoading: false,
      error: null,
      hasData: true,
      activities: [],
      trainingLoadData: undefined,
      goals: [],
      unitPreferences: { distance: 'km', pace: 'min/km' }
    })

    mockUseWorkoutPlanManager.mockReturnValue({
      weeklyPlan: mockWorkoutPlan,
      isLoading: false,
      saveWorkoutPlan: jest.fn(),
      updateWeeklyPlan: jest.fn()
    })

    render(
      <QueryClientProvider client={queryClient}>
        <EnhancedWorkoutPlanningDashboard userId="test-user" />
      </QueryClientProvider>
    )

    expect(screen.getByText('Edit Plan')).toBeInTheDocument()
  })

  it('does not show edit button when no plan exists', () => {
    mockUseEnhancedWorkoutPlanning.mockReturnValue({
      todaysWorkout: null,
      weeklyPlan: null,
      isLoadingTodaysWorkout: false,
      isLoadingWeeklyPlan: false,
      isLoading: false,
      error: null,
      hasData: true,
      activities: [],
      trainingLoadData: undefined,
      goals: [],
      unitPreferences: { distance: 'km', pace: 'min/km' }
    })

    mockUseWorkoutPlanManager.mockReturnValue({
      weeklyPlan: null,
      isLoading: false,
      saveWorkoutPlan: jest.fn(),
      updateWeeklyPlan: jest.fn()
    })

    render(
      <QueryClientProvider client={queryClient}>
        <EnhancedWorkoutPlanningDashboard userId="test-user" />
      </QueryClientProvider>
    )

    expect(screen.queryByText('Edit Plan')).not.toBeInTheDocument()
  })
}) 