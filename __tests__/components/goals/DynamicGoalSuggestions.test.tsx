import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithQueryClient } from '@/__tests__/utils/test-utils';
import { DynamicGoalSuggestions } from '@/components/goals/DynamicGoalSuggestions';
import { useUserActivities } from '@/hooks/use-user-activities';
import { useUserGoals, useUnifiedGoalCreation } from '@/hooks/useGoals';
import { useUnitPreferences } from '@/hooks/useUnitPreferences';
import { useDynamicGoals } from '@/hooks/useDynamicGoals';
import { useAuth } from '@/providers/AuthProvider';

// Mock the hooks
jest.mock('@/hooks/use-user-activities');
jest.mock('@/hooks/useGoals', () => ({
  useUserGoals: jest.fn(),
  useUnifiedGoalCreation: jest.fn(),
}));
jest.mock('@/hooks/useUnitPreferences');
jest.mock('@/hooks/useDynamicGoals');
jest.mock('@/providers/AuthProvider');

jest.mock('@/lib/goals/dynamic-suggestions', () => ({
  DynamicGoalEngine: {
    analyzeUserPerformance: jest.fn(),
    generateDynamicSuggestions: jest.fn(),
  }
}));

const mockUseUserActivities = useUserActivities as jest.MockedFunction<typeof useUserActivities>;
const mockUseUserGoals = useUserGoals as jest.MockedFunction<typeof useUserGoals>;
const mockUseUnitPreferences = useUnitPreferences as jest.MockedFunction<typeof useUnitPreferences>;
const mockUseUnifiedGoalCreation = useUnifiedGoalCreation as jest.MockedFunction<typeof useUnifiedGoalCreation>;
const mockUseDynamicGoals = useDynamicGoals as jest.MockedFunction<typeof useDynamicGoals>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Get the mocked functions from the module
const { DynamicGoalEngine } = require('@/lib/goals/dynamic-suggestions');
const mockAnalyzeUserPerformance = DynamicGoalEngine.analyzeUserPerformance as jest.MockedFunction<any>;
const mockGenerateDynamicSuggestions = DynamicGoalEngine.generateDynamicSuggestions as jest.MockedFunction<any>;

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

    mockUseUnifiedGoalCreation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
      error: null
    } as any);

    mockUseDynamicGoals.mockReturnValue({
      suggestions: [],
      isLoading: false,
      error: null
    } as any);

    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' },
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
    mockGenerateDynamicSuggestions.mockReturnValue([
      {
        id: 'test-suggestion-1',
        title: 'Test Suggestion',
        description: 'Test description',
        priority: 'medium',
        difficulty: 'moderate',
        category: 'distance',
        targetValue: 30,
        targetUnit: 'km',
        timeframe: 'weekly',
        confidence: 0.8,
        reasoning: 'Test reasoning',
        suggestedTarget: 30,
        goalType: { id: '1', category: 'distance' },
        strategies: ['Test strategy'],
        benefits: ['Test benefit'],
        successProbability: 80,
        requiredCommitment: 'medium'
      }
    ]);

    renderWithQueryClient(<DynamicGoalSuggestions />);

    await waitFor(() => {
      expect(screen.getByText('Test Suggestion')).toBeInTheDocument();
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
    mockGenerateDynamicSuggestions.mockReturnValue([
      {
        id: 'test-suggestion-1',
        title: 'Test Suggestion',
        description: 'Test description',
        priority: 'medium',
        difficulty: 'moderate',
        category: 'distance',
        targetValue: 30,
        targetUnit: 'miles',
        timeframe: 'weekly',
        confidence: 0.8,
        reasoning: 'Test reasoning',
        suggestedTarget: 30,
        goalType: { id: '1', category: 'distance' },
        strategies: ['Test strategy'],
        benefits: ['Test benefit'],
        successProbability: 80,
        requiredCommitment: 'medium'
      }
    ]);

    renderWithQueryClient(<DynamicGoalSuggestions />);

    await waitFor(() => {
      expect(screen.getByText('Test Suggestion')).toBeInTheDocument();
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

    renderWithQueryClient(<DynamicGoalSuggestions />);

    // When activities are loading and there are no activities, show empty state
    expect(screen.getByText('Complete more activities to unlock personalized goal recommendations.')).toBeInTheDocument();
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

    renderWithQueryClient(<DynamicGoalSuggestions />);

    await waitFor(() => {
      expect(screen.getByText('Complete more activities to unlock personalized goal recommendations.')).toBeInTheDocument();
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
        goalType: { id: '1', category: 'distance' },
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

    renderWithQueryClient(<DynamicGoalSuggestions />);

    await waitFor(() => {
      expect(screen.getByText('Increase Weekly Distance')).toBeInTheDocument();
      expect(screen.getByText('Build your endurance by increasing weekly distance')).toBeInTheDocument();
    });
  });
}); 