import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EnhancedWorkoutPlanningDashboard } from '@/components/planning/EnhancedWorkoutPlanningDashboard';
import { useSynchronizedTodaysWorkout } from '@/hooks/useEnhancedWorkoutPlanning';

// Mock the hooks
jest.mock('@/hooks/useEnhancedWorkoutPlanning');
jest.mock('@/hooks/useUnitPreferences');
jest.mock('@/hooks/useWeather');
jest.mock('@/hooks/useLocation');

const mockUseSynchronizedTodaysWorkout =
  useSynchronizedTodaysWorkout as jest.MockedFunction<
    typeof useSynchronizedTodaysWorkout
  >;
const mockUseWorkoutPlanManager = jest.requireMock(
  '@/hooks/useEnhancedWorkoutPlanning'
).useWorkoutPlanManager as jest.MockedFunction<any>;
const mockUseWorkoutPlanAnalytics = jest.requireMock(
  '@/hooks/useEnhancedWorkoutPlanning'
).useWorkoutPlanAnalytics as jest.MockedFunction<any>;

describe('EnhancedWorkoutPlanningDashboard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Mock unit preferences
    jest
      .requireMock('@/hooks/useUnitPreferences')
      .useUnitPreferences.mockReturnValue({
        preferences: {
          distance: 'km',
          temperature: 'celsius',
          windSpeed: 'kmh',
        },
      });

    // Mock weather
    jest.requireMock('@/hooks/useWeather').useWeather.mockReturnValue({
      weather: null,
      impact: null,
      optimalTime: null,
      isLoading: false,
    });

    // Mock location
    jest.requireMock('@/hooks/useLocation').useLocation.mockReturnValue({
      location: { lat: 0, lon: 0 },
      isLoading: false,
    });

    // Mock workout plan manager
    mockUseWorkoutPlanManager.mockReturnValue({
      saveWorkoutPlan: jest.fn(),
      resetToRecommended: jest.fn(),
      weeklyPlan: null,
      isLoading: false,
    });

    // Mock workout plan analytics
    mockUseWorkoutPlanAnalytics.mockReturnValue({
      totalWorkouts: 0,
      totalTSS: 0,
      totalDistance: 0,
      totalTime: 0,
      workoutDistribution: {},
      intensityDistribution: {},
      sportDistribution: {},
      periodizationPhase: 'base',
      recommendations: [],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should display today's workout that matches the weekly plan", async () => {
    const mockWeeklyPlan = {
      id: 'test-plan-1',
      weekStart: '2024-01-01',
      workouts: {
        0: null, // Sunday
        1: {
          // Monday
          id: 'monday-workout',
          type: 'tempo' as const,
          sport: 'Run' as const,
          duration: 45,
          intensity: 7,
          distance: 8,
          difficulty: 'intermediate' as const,
          energyCost: 6,
          recoveryTime: 24,
          reasoning: 'Tempo run to build endurance',
          alternatives: [],
          instructions: [
            'Warm up for 10 minutes',
            'Run at tempo pace for 25 minutes',
            'Cool down for 10 minutes',
          ],
          tips: ['Keep a steady pace', 'Focus on breathing'],
        },
        2: null, // Tuesday
        3: null, // Wednesday
        4: null, // Thursday
        5: null, // Friday
        6: null, // Saturday
      },
      totalTSS: 300,
      totalDistance: 8,
      totalTime: 45,
      periodizationPhase: 'build' as const,
      isEditable: true,
    };

    // Mock today as Monday (day 1)
    const originalGetDay = Date.prototype.getDay;
    Date.prototype.getDay = jest.fn(() => 1);

    mockUseSynchronizedTodaysWorkout.mockReturnValue({
      todaysWorkout: mockWeeklyPlan.workouts[1],
      weeklyPlan: mockWeeklyPlan,
      isLoading: false,
      hasData: true,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <EnhancedWorkoutPlanningDashboard userId="test-user" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Today's Workout")).toBeInTheDocument();
      expect(screen.getByText('tempo Run')).toBeInTheDocument();
      expect(screen.getByText('45 min')).toBeInTheDocument();
    });

    // Verify that today's workout matches the weekly plan
    const today = new Date().getDay();
    const expectedWorkout =
      mockWeeklyPlan.workouts[today as keyof typeof mockWeeklyPlan.workouts];
    expect(expectedWorkout).toBe(mockWeeklyPlan.workouts[1]);
    expect(expectedWorkout?.type).toBe('tempo');
    expect(expectedWorkout?.sport).toBe('Run');

    // Restore original Date.getDay
    Date.prototype.getDay = originalGetDay;
  });

  it("should show plan mismatch indicator when workout doesn't match plan", async () => {
    const mockWeeklyPlan = {
      id: 'test-plan-1',
      weekStart: '2024-01-01',
      workouts: {
        0: null, // Sunday
        1: {
          // Monday - different workout
          id: 'monday-workout',
          type: 'easy' as const,
          sport: 'Run' as const,
          duration: 30,
          intensity: 4,
          distance: 5,
          difficulty: 'beginner' as const,
          energyCost: 3,
          recoveryTime: 12,
          reasoning: 'Easy recovery run',
          alternatives: [],
          instructions: ['Easy pace run'],
          tips: ['Keep it comfortable'],
        },
        2: null, // Tuesday
        3: null, // Wednesday
        4: null, // Thursday
        5: null, // Friday
        6: null, // Saturday
      },
      totalTSS: 200,
      totalDistance: 5,
      totalTime: 30,
      periodizationPhase: 'base' as const,
      isEditable: true,
    };

    // Mock today as Monday (day 1)
    const originalGetDay = Date.prototype.getDay;
    Date.prototype.getDay = jest.fn(() => 1);

    // Mock a different today's workout than what's in the plan
    const differentTodaysWorkout = {
      id: 'different-workout',
      type: 'tempo' as const,
      sport: 'Run' as const,
      duration: 45,
      intensity: 7,
      distance: 8,
      difficulty: 'intermediate' as const,
      energyCost: 6,
      recoveryTime: 24,
      reasoning: 'Different workout',
      alternatives: [],
      instructions: ['Different instructions'],
      tips: ['Different tips'],
    };

    mockUseSynchronizedTodaysWorkout.mockReturnValue({
      todaysWorkout: differentTodaysWorkout,
      weeklyPlan: mockWeeklyPlan,
      isLoading: false,
      hasData: true,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <EnhancedWorkoutPlanningDashboard userId="test-user" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Plan Mismatch')).toBeInTheDocument();
    });

    // Restore original Date.getDay
    Date.prototype.getDay = originalGetDay;
  });

  it('should not show plan mismatch when workout matches plan', async () => {
    const mockWeeklyPlan = {
      id: 'test-plan-1',
      weekStart: '2024-01-01',
      workouts: {
        0: null, // Sunday
        1: {
          // Monday
          id: 'monday-workout',
          type: 'tempo' as const,
          sport: 'Run' as const,
          duration: 45,
          intensity: 7,
          distance: 8,
          difficulty: 'intermediate' as const,
          energyCost: 6,
          recoveryTime: 24,
          reasoning: 'Tempo run to build endurance',
          alternatives: [],
          instructions: [
            'Warm up for 10 minutes',
            'Run at tempo pace for 25 minutes',
            'Cool down for 10 minutes',
          ],
          tips: ['Keep a steady pace', 'Focus on breathing'],
        },
        2: null, // Tuesday
        3: null, // Wednesday
        4: null, // Thursday
        5: null, // Friday
        6: null, // Saturday
      },
      totalTSS: 300,
      totalDistance: 8,
      totalTime: 45,
      periodizationPhase: 'build' as const,
      isEditable: true,
    };

    // Mock today as Monday (day 1)
    const originalGetDay = Date.prototype.getDay;
    Date.prototype.getDay = jest.fn(() => 1);

    // Mock the same workout as in the plan
    mockUseSynchronizedTodaysWorkout.mockReturnValue({
      todaysWorkout: mockWeeklyPlan.workouts[1],
      weeklyPlan: mockWeeklyPlan,
      isLoading: false,
      hasData: true,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <EnhancedWorkoutPlanningDashboard userId="test-user" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Plan Mismatch')).not.toBeInTheDocument();
    });

    // Restore original Date.getDay
    Date.prototype.getDay = originalGetDay;
  });
});
