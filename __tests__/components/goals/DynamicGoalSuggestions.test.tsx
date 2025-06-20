import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { DynamicGoalSuggestions } from '@/components/goals/DynamicGoalSuggestions';
import { useUserActivities } from '@/hooks/use-user-activities';
import { useUserGoals } from '@/hooks/useGoals';
import { useUnitPreferences } from '@/hooks/useUnitPreferences';

// Mock the hooks
jest.mock('@/hooks/use-user-activities');
jest.mock('@/hooks/useGoals');
jest.mock('@/hooks/useUnitPreferences');
jest.mock('@/lib/goals/dynamic-suggestions');

const mockUseUserActivities = useUserActivities as jest.MockedFunction<typeof useUserActivities>;
const mockUseUserGoals = useUserGoals as jest.MockedFunction<typeof useUserGoals>;
const mockUseUnitPreferences = useUnitPreferences as jest.MockedFunction<typeof useUnitPreferences>;

// Mock the DynamicGoalEngine
const mockAnalyzeUserPerformance = jest.fn();
const mockGenerateDynamicSuggestions = jest.fn();

jest.mock('@/lib/goals/dynamic-suggestions', () => ({
  DynamicGoalEngine: {
    analyzeUserPerformance: mockAnalyzeUserPerformance,
    generateDynamicSuggestions: mockGenerateDynamicSuggestions,
  }
}));

describe('DynamicGoalSuggestions Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseUserActivities.mockReturnValue({
      data: [
        {
          id: 1,
          name: 'Morning Run',
          sport_type: 'Run',
          distance: 5000,
          moving_time: 1500,
          start_date_local: '2024-01-01T08:00:00Z',
          activity_type: 'Run'
        }
      ],
      isLoading: false,
      error: null
    } as any);

    mockUseUserGoals.mockReturnValue({
      data: {
        goals: [],
        onboarding: null
      },
      isLoading: false,
      error: null
    } as any);
  });

  it('displays performance profile with kilometers when set to km', async () => {
    mockUseUnitPreferences.mockReturnValue({
      preferences: { distance: 'km', pace: 'min/km' },
      isLoading: false,
      updatePreferences: jest.fn(),
      setDistanceUnit: jest.fn(),
      toggleUnits: jest.fn()
    });

    const mockProfile = {
      weeklyDistance: 25, // km
      monthlyDistance: 100,
      averagePace: 300, // 5:00 per km
      runFrequency: 4,
      longestRun: 15,
      averageHeartRate: 150,
      distanceTrend: 'improving' as const,
      paceTrend: 'stable' as const,
      frequencyTrend: 'improving' as const,
      preferredSportTypes: ['Run'],
      preferredDays: [1, 3, 5],
      averageActivityDuration: 45,
      goalCompletionRate: 80,
      consistencyScore: 75,
      totalActivities: 50,
      runningExperience: 'intermediate' as const,
      hasRecentInjuries: false
    };

    mockAnalyzeUserPerformance.mockReturnValue(mockProfile);
    mockGenerateDynamicSuggestions.mockReturnValue([]);

    render(<DynamicGoalSuggestions userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText('25.0 km')).toBeInTheDocument();
      expect(screen.getByText('5:00/km')).toBeInTheDocument();
    });
  });

  it('displays performance profile with miles when set to miles', async () => {
    mockUseUnitPreferences.mockReturnValue({
      preferences: { distance: 'miles', pace: 'min/mile' },
      isLoading: false,
      updatePreferences: jest.fn(),
      setDistanceUnit: jest.fn(),
      toggleUnits: jest.fn()
    });

    const mockProfile = {
      weeklyDistance: 25, // km, should be converted to ~15.5 miles
      monthlyDistance: 100,
      averagePace: 300, // 5:00 per km, should be converted to ~8:02 per mile
      runFrequency: 4,
      longestRun: 15,
      averageHeartRate: 150,
      distanceTrend: 'improving' as const,
      paceTrend: 'stable' as const,
      frequencyTrend: 'improving' as const,
      preferredSportTypes: ['Run'],
      preferredDays: [1, 3, 5],
      averageActivityDuration: 45,
      goalCompletionRate: 80,
      consistencyScore: 75,
      totalActivities: 50,
      runningExperience: 'intermediate' as const,
      hasRecentInjuries: false
    };

    mockAnalyzeUserPerformance.mockReturnValue(mockProfile);
    mockGenerateDynamicSuggestions.mockReturnValue([]);

    render(<DynamicGoalSuggestions userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText('15.5 mi')).toBeInTheDocument();
      expect(screen.getByText('8:02/mi')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    mockUseUserActivities.mockReturnValue({
      data: [],
      isLoading: true,
      error: null
    } as any);

    mockUseUnitPreferences.mockReturnValue({
      preferences: { distance: 'km', pace: 'min/km' },
      isLoading: false,
      updatePreferences: jest.fn(),
      setDistanceUnit: jest.fn(),
      toggleUnits: jest.fn()
    });

    render(<DynamicGoalSuggestions userId="user-1" />);

    expect(screen.getByText('Analyzing your performance patterns...')).toBeInTheDocument();
  });

  it('shows no data message when no activities available', async () => {
    mockUseUserActivities.mockReturnValue({
      data: [],
      isLoading: false,
      error: null
    } as any);

    mockUseUnitPreferences.mockReturnValue({
      preferences: { distance: 'km', pace: 'min/km' },
      isLoading: false,
      updatePreferences: jest.fn(),
      setDistanceUnit: jest.fn(),
      toggleUnits: jest.fn()
    });

    mockAnalyzeUserPerformance.mockReturnValue(null);
    mockGenerateDynamicSuggestions.mockReturnValue([]);

    render(<DynamicGoalSuggestions userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText('Keep logging activities to get personalized goal suggestions!')).toBeInTheDocument();
    });
  });

  it('displays goal suggestions when available', async () => {
    mockUseUnitPreferences.mockReturnValue({
      preferences: { distance: 'km', pace: 'min/km' },
      isLoading: false,
      updatePreferences: jest.fn(),
      setDistanceUnit: jest.fn(),
      toggleUnits: jest.fn()
    });

    const mockProfile = {
      weeklyDistance: 25,
      monthlyDistance: 100,
      averagePace: 300,
      runFrequency: 4,
      longestRun: 15,
      averageHeartRate: 150,
      distanceTrend: 'improving' as const,
      paceTrend: 'stable' as const,
      frequencyTrend: 'improving' as const,
      preferredSportTypes: ['Run'],
      preferredDays: [1, 3, 5],
      averageActivityDuration: 45,
      goalCompletionRate: 80,
      consistencyScore: 75,
      totalActivities: 50,
      runningExperience: 'intermediate' as const,
      hasRecentInjuries: false
    };

    const mockSuggestions = [
      {
        id: 'test-suggestion',
        title: 'Increase Weekly Distance',
        description: 'Build your endurance by increasing weekly distance',
        reasoning: 'Your consistency shows you are ready for more volume',
        priority: 'high' as const,
        category: 'distance' as const,
        goalType: {} as any,
        suggestedTarget: 30,
        targetUnit: 'km',
        timeframe: '4 weeks',
        difficulty: 'moderate' as const,
        benefits: ['Better endurance', 'Improved fitness'],
        strategies: ['Gradual increases', 'Long runs'],
        successProbability: 80,
        requiredCommitment: 'medium' as const
      }
    ];

    mockAnalyzeUserPerformance.mockReturnValue(mockProfile);
    mockGenerateDynamicSuggestions.mockReturnValue(mockSuggestions);

    render(<DynamicGoalSuggestions userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText('Increase Weekly Distance')).toBeInTheDocument();
      expect(screen.getByText('Build your endurance by increasing weekly distance')).toBeInTheDocument();
      expect(screen.getByText('30 km')).toBeInTheDocument();
    });
  });
}); 