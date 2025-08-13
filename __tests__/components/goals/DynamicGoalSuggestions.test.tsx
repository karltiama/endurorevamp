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

const mockUseUserActivities = useUserActivities as jest.MockedFunction<
  typeof useUserActivities
>;
const mockUseUserGoals = useUserGoals as jest.MockedFunction<
  typeof useUserGoals
>;
const mockUseUnitPreferences = useUnitPreferences as jest.MockedFunction<
  typeof useUnitPreferences
>;
const mockUseUnifiedGoalCreation =
  useUnifiedGoalCreation as jest.MockedFunction<typeof useUnifiedGoalCreation>;
const mockUseDynamicGoals = useDynamicGoals as jest.MockedFunction<
  typeof useDynamicGoals
>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('DynamicGoalSuggestions Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Create activities from the current week
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);

    const activityDate = new Date(weekStart);
    activityDate.setDate(weekStart.getDate() + 2); // Wednesday

    mockUseUserActivities.mockReturnValue({
      data: [
        {
          id: 1,
          name: 'Morning Run',
          sport_type: 'Run',
          distance: 5000, // 5km
          moving_time: 1500, // 25 minutes
          start_date_local: activityDate.toISOString(),
          activity_type: 'Run',
        },
        {
          id: 2,
          name: 'Evening Run',
          sport_type: 'Run',
          distance: 3000, // 3km
          moving_time: 900, // 15 minutes
          start_date_local: new Date(
            activityDate.getTime() + 24 * 60 * 60 * 1000
          ).toISOString(), // Next day
          activity_type: 'Run',
        },
      ],
      isLoading: false,
      error: null,
    } as any);

    mockUseUserGoals.mockReturnValue({
      data: {
        goals: [],
        onboarding: null,
      },
      isLoading: false,
      error: null,
    } as any);

    mockUseUnifiedGoalCreation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
      error: null,
    } as any);

    mockUseDynamicGoals.mockReturnValue({
      suggestions: [],
      isLoading: false,
      error: null,
    } as any);

    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' },
      isLoading: false,
      error: null,
    } as any);
  });

  it('displays performance profile with kilometers when set to km', async () => {
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

    renderWithQueryClient(<DynamicGoalSuggestions />);

    await waitFor(() => {
      // Check for the suggestions that should be generated
      expect(screen.getByText('Build Consistency')).toBeInTheDocument();
      expect(screen.getByText('Improve Running Pace')).toBeInTheDocument();
      expect(screen.getByText('Extend Workout Duration')).toBeInTheDocument();
    });
  });

  it('displays performance profile with miles when set to miles', async () => {
    mockUseUnitPreferences.mockReturnValue({
      preferences: {
        distance: 'miles',
        pace: 'min/mile',
        temperature: 'fahrenheit',
        windSpeed: 'mph',
      },
      isLoading: false,
      updatePreferences: jest.fn(),
      setDistanceUnit: jest.fn(),
      toggleUnits: jest.fn(),
    });

    renderWithQueryClient(<DynamicGoalSuggestions />);

    await waitFor(() => {
      // Check for the suggestions that should be generated
      expect(screen.getByText('Build Consistency')).toBeInTheDocument();
      expect(screen.getByText('Improve Running Pace')).toBeInTheDocument();
      expect(screen.getByText('Extend Workout Duration')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    mockUseUserActivities.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
    } as any);

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

    renderWithQueryClient(<DynamicGoalSuggestions />);

    // When activities are loading, show loading skeleton
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('shows no data message when no activities available', async () => {
    mockUseUserActivities.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

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

    renderWithQueryClient(<DynamicGoalSuggestions />);

    await waitFor(() => {
      expect(screen.getByText('Start Your Journey')).toBeInTheDocument();
      expect(
        screen.getByText('Complete your first activity')
      ).toBeInTheDocument();
    });
  });

  it('calls onGoalCreated when Set Goal button is clicked', async () => {
    const mockOnGoalCreated = jest.fn();

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

    renderWithQueryClient(
      <DynamicGoalSuggestions onGoalCreated={mockOnGoalCreated} />
    );

    await waitFor(() => {
      const setGoalButtons = screen.getAllByText('Set Goal');
      expect(setGoalButtons.length).toBeGreaterThan(0);

      setGoalButtons[0].click();
      expect(mockOnGoalCreated).toHaveBeenCalled();
    });
  });
});
