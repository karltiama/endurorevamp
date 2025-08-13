import React from 'react';
import { render, screen } from '@testing-library/react';
import { SmartGoalCard } from '@/components/goals/SmartGoalCard';
import { DynamicGoalSuggestion } from '@/lib/goals/dynamic-suggestions';
import { useUnitPreferences } from '@/hooks/useUnitPreferences';

// Mock the useUnitPreferences hook
jest.mock('@/hooks/useUnitPreferences');
const mockUseUnitPreferences = useUnitPreferences as jest.MockedFunction<
  typeof useUnitPreferences
>;

describe('SmartGoalCard', () => {
  const mockSuggestion: DynamicGoalSuggestion = {
    id: 'test-goal',
    title: 'Test Goal',
    description: 'Test description',
    reasoning: 'Test reasoning',
    priority: 'medium',
    category: 'distance',
    goalType: {
      name: 'weekly_distance',
      display_name: 'Weekly Distance',
      description: 'Weekly distance goal',
      category: 'distance',
      metric_type: 'total_distance',
      unit: 'km',
      target_guidance: 'Test guidance',
      calculation_method: 'Test method',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    suggestedTarget: 25,
    targetUnit: 'km',
    timeframe: '4 weeks',
    difficulty: 'moderate',
    benefits: ['Benefit 1', 'Benefit 2'],
    strategies: ['Strategy 1', 'Strategy 2'],
    successProbability: 75,
    requiredCommitment: 'medium',
  };

  beforeEach(() => {
    mockUseUnitPreferences.mockReturnValue({
      preferences: {
        distance: 'km',
        pace: 'min/km',
        temperature: 'celsius',
        windSpeed: 'km/h',
      },
      isLoading: false,
      updatePreferences: jest.fn(),
      setDistanceUnit: jest.fn(),
      toggleUnits: jest.fn(),
    });
  });

  it('should format target with proper spacing', () => {
    render(
      <SmartGoalCard
        suggestion={mockSuggestion}
        onSelect={jest.fn()}
        isSelected={false}
      />
    );

    // Check that the target is displayed with proper spacing
    expect(screen.getByText('25 km')).toBeInTheDocument();
  });

  it('should format pace targets correctly', () => {
    const paceSuggestion: DynamicGoalSuggestion = {
      ...mockSuggestion,
      category: 'pace',
      suggestedTarget: 300, // 5:00 min/km in seconds
      targetUnit: 'seconds/km',
      goalType: {
        ...mockSuggestion.goalType,
        category: 'pace',
        metric_type: 'average_pace',
        name: 'general_pace_improvement',
      },
    };

    render(
      <SmartGoalCard
        suggestion={paceSuggestion}
        onSelect={jest.fn()}
        isSelected={false}
      />
    );

    // Check that the pace is formatted as 5:00/km
    expect(screen.getByText('5:00/km')).toBeInTheDocument();
  });

  it('should format frequency targets correctly', () => {
    const frequencySuggestion: DynamicGoalSuggestion = {
      ...mockSuggestion,
      category: 'frequency',
      suggestedTarget: 3,
      targetUnit: 'runs/week',
      goalType: {
        ...mockSuggestion.goalType,
        category: 'frequency',
        metric_type: 'run_count',
        name: 'weekly_run_frequency',
      },
    };

    render(
      <SmartGoalCard
        suggestion={frequencySuggestion}
        onSelect={jest.fn()}
        isSelected={false}
      />
    );

    // Check that the frequency is displayed with proper spacing
    expect(screen.getByText('3 runs/week')).toBeInTheDocument();
  });
});
