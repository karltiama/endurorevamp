import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WorkoutPlanningDashboard } from '@/components/planning/WorkoutPlanningDashboard'

// Mock the useWorkoutPlanning hook
const mockUseWorkoutPlanning = jest.fn()

jest.mock('@/hooks/useWorkoutPlanning', () => ({
  useWorkoutPlanning: () => mockUseWorkoutPlanning()
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

const mockWorkoutRecommendation = {
  id: 'test-workout-1',
  type: 'tempo' as const,
  sport: 'Run' as const,
  duration: 45,
  intensity: 7,
  distance: 8,
  reasoning: 'Your fitness level supports intensity work. This tempo run will improve your lactate threshold.',
  alternatives: [
    {
      id: 'alt-1',
      type: 'threshold' as const,
      sport: 'Run' as const,
      duration: 30,
      intensity: 8,
      distance: 5,
      reasoning: 'Threshold intervals will improve your aerobic capacity.',
      alternatives: []
    }
  ]
}

describe('WorkoutPlanningDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows loading state when data is loading', () => {
    mockUseWorkoutPlanning.mockReturnValue({
      todaysWorkout: null,
      weeklyPlan: [],
      isLoadingTodaysWorkout: true,
      isLoadingWeeklyPlan: false,
      hasData: true
    })

    render(<WorkoutPlanningDashboard userId="test-user" />, { wrapper: createWrapper() })
    
    expect(screen.getByText("Today's Workout")).toBeInTheDocument()
    // The loading state shows skeleton elements with animate-pulse class
    expect(screen.getByText("Today's Workout")).toBeInTheDocument()
    // Check for skeleton elements
    const skeletonElements = document.querySelectorAll('.animate-pulse')
    expect(skeletonElements.length).toBeGreaterThan(0)
  })

  it('shows no data message when no training data available', () => {
    mockUseWorkoutPlanning.mockReturnValue({
      todaysWorkout: null,
      weeklyPlan: [],
      isLoadingTodaysWorkout: false,
      isLoadingWeeklyPlan: false,
      hasData: false
    })

    render(<WorkoutPlanningDashboard userId="test-user" />, { wrapper: createWrapper() })
    
    expect(screen.getByText('Workout Planning')).toBeInTheDocument()
    expect(screen.getByText('No training data available')).toBeInTheDocument()
    expect(screen.getByText('Sync some activities to get personalized workout recommendations')).toBeInTheDocument()
  })

  it('displays today\'s workout recommendation', async () => {
    mockUseWorkoutPlanning.mockReturnValue({
      todaysWorkout: mockWorkoutRecommendation,
      weeklyPlan: [],
      isLoadingTodaysWorkout: false,
      isLoadingWeeklyPlan: false,
      hasData: true
    })

    render(<WorkoutPlanningDashboard userId="test-user" />, { wrapper: createWrapper() })
    
    await waitFor(() => {
      expect(screen.getByText("Today's Workout")).toBeInTheDocument()
      expect(screen.getByText('tempo Run')).toBeInTheDocument()
      expect(screen.getByText('45 min')).toBeInTheDocument()
      expect(screen.getByText('7/10')).toBeInTheDocument()
      expect(screen.getByText('8.0 km')).toBeInTheDocument()
      expect(screen.getByText('Why this workout?')).toBeInTheDocument()
      expect(screen.getByText(/Your fitness level supports intensity work/)).toBeInTheDocument()
    })
  })

  it('displays alternative workouts', async () => {
    mockUseWorkoutPlanning.mockReturnValue({
      todaysWorkout: mockWorkoutRecommendation,
      weeklyPlan: [],
      isLoadingTodaysWorkout: false,
      isLoadingWeeklyPlan: false,
      hasData: true
    })

    render(<WorkoutPlanningDashboard userId="test-user" />, { wrapper: createWrapper() })
    
    await waitFor(() => {
      expect(screen.getByText('Alternative Workouts')).toBeInTheDocument()
      
      // Check for Run elements - there are multiple, so use getAllByText
      const runElements = screen.getAllByText('Run')
      expect(runElements.length).toBeGreaterThan(0)
      
      expect(screen.getByText('threshold')).toBeInTheDocument()
      expect(screen.getByText('30 min')).toBeInTheDocument()
    })
  })

  it('displays weekly plan when available', async () => {
    const mockWeeklyPlan = [
      mockWorkoutRecommendation,
      { ...mockWorkoutRecommendation, id: 'day-2', type: 'easy' as const },
      { ...mockWorkoutRecommendation, id: 'day-3', type: 'recovery' as const },
      null, // Rest day
      { ...mockWorkoutRecommendation, id: 'day-5', type: 'long' as const },
      { ...mockWorkoutRecommendation, id: 'day-6', type: 'strength' as const },
      null // Rest day
    ]

    mockUseWorkoutPlanning.mockReturnValue({
      todaysWorkout: mockWorkoutRecommendation,
      weeklyPlan: mockWeeklyPlan,
      isLoadingTodaysWorkout: false,
      isLoadingWeeklyPlan: false,
      hasData: true
    })

    render(<WorkoutPlanningDashboard userId="test-user" />, { wrapper: createWrapper() })
    
    await waitFor(() => {
      expect(screen.getByText('Weekly Plan')).toBeInTheDocument()
      expect(screen.getByText('Mon')).toBeInTheDocument()
      expect(screen.getByText('Sun')).toBeInTheDocument()
      
      // Check for workout types in the weekly plan grid
      const tempoElements = screen.getAllByText('tempo')
      expect(tempoElements.length).toBeGreaterThan(0)
      
      expect(screen.getByText('easy')).toBeInTheDocument()
      expect(screen.getByText('recovery')).toBeInTheDocument()
      expect(screen.getByText('long')).toBeInTheDocument()
      expect(screen.getByText('strength')).toBeInTheDocument()
      expect(screen.getAllByText('Rest')).toHaveLength(2)
    })
  })

  it('shows error state when workout generation fails', async () => {
    mockUseWorkoutPlanning.mockReturnValue({
      todaysWorkout: null,
      weeklyPlan: [],
      isLoadingTodaysWorkout: false,
      isLoadingWeeklyPlan: false,
      hasData: true
    })

    render(<WorkoutPlanningDashboard userId="test-user" />, { wrapper: createWrapper() })
    
    await waitFor(() => {
      expect(screen.getByText('Unable to generate workout recommendation')).toBeInTheDocument()
      expect(screen.getByText('Check your training data and try again')).toBeInTheDocument()
    })
  })
}) 