import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SmartTargetRecommendations } from '@/components/goals/SmartTargetRecommendations';
import { useUnitPreferences } from '@/hooks/useUnitPreferences';

// Mock the hooks
jest.mock('@/hooks/useUnitPreferences');

const mockUseUnitPreferences = useUnitPreferences as jest.MockedFunction<typeof useUnitPreferences>;

describe('SmartTargetRecommendations Component', () => {
  const mockGoalType = {
    id: 'weekly-distance',
    name: 'Weekly Distance Goal',
    description: 'Track your weekly running distance',
    category: 'distance' as const,
    metric_type: 'total_distance',
    unit: 'km',
    target_guidance: 'Aim for 20-50km per week depending on your experience',
    display_name: 'Weekly Distance Goal',
    calculation_method: 'sum',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  const mockOnSelectTarget = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays performance data with kilometers when set to km', () => {
    mockUseUnitPreferences.mockReturnValue({
      preferences: { distance: 'km', pace: 'min/km', temperature: 'celsius', windSpeed: 'km/h' },
      isLoading: false,
      updatePreferences: jest.fn(),
      setDistanceUnit: jest.fn(),
      toggleUnits: jest.fn()
    });

    const mockUserPerformance = {
      weeklyDistance: 25, // km
      monthlyDistance: 100,
      averagePace: 300, // 5:00 per km
      runFrequency: 4,
      longestRun: 15, // km
      totalRunningExperience: 12,
      recentInjuries: false
    };

    render(
      <SmartTargetRecommendations
        goalType={mockGoalType}
        userPerformance={mockUserPerformance}
        onSelectTarget={mockOnSelectTarget}
      />
    );

    // Check that distances are displayed in kilometers
    const distanceElements = screen.getAllByText(/25.*km/);
    expect(distanceElements.length).toBeGreaterThan(0);
    const longDistanceElements = screen.getAllByText(/15.*km/);
    expect(longDistanceElements.length).toBeGreaterThan(0);
    
    // Check that pace is displayed in min/km
    expect(screen.getByText('5:00/km')).toBeInTheDocument();
  });

  it('displays performance data with miles when set to miles', () => {
    mockUseUnitPreferences.mockReturnValue({
      preferences: { distance: 'miles', pace: 'min/mile', temperature: 'fahrenheit', windSpeed: 'mph' },
      isLoading: false,
      updatePreferences: jest.fn(),
      setDistanceUnit: jest.fn(),
      toggleUnits: jest.fn()
    });

    const mockUserPerformance = {
      weeklyDistance: 25, // km, should be converted to ~15.5 miles
      monthlyDistance: 100,
      averagePace: 300, // 5:00 per km, should be converted to ~8:02 per mile
      runFrequency: 4,
      longestRun: 15, // km, should be converted to ~9.3 miles
      totalRunningExperience: 12,
      recentInjuries: false
    };

    render(
      <SmartTargetRecommendations
        goalType={mockGoalType}
        userPerformance={mockUserPerformance}
        onSelectTarget={mockOnSelectTarget}
      />
    );

    // Check that distances are displayed in miles
    expect(screen.getByText('15.5 mi')).toBeInTheDocument();
    expect(screen.getByText('9.3 mi')).toBeInTheDocument();
    
    // Check that pace is displayed in min/mile
    expect(screen.getByText('8:02/mi')).toBeInTheDocument();
  });

  it('displays recommendations with appropriate targets', () => {
    mockUseUnitPreferences.mockReturnValue({
      preferences: { distance: 'km', pace: 'min/km', temperature: 'celsius', windSpeed: 'km/h' },
      isLoading: false,
      updatePreferences: jest.fn(),
      setDistanceUnit: jest.fn(),
      toggleUnits: jest.fn()
    });

    const mockUserPerformance = {
      weeklyDistance: 25,
      monthlyDistance: 100,
      averagePace: 300,
      runFrequency: 4,
      longestRun: 15,
      totalRunningExperience: 12,
      recentInjuries: false
    };

    render(
      <SmartTargetRecommendations
        goalType={mockGoalType}
        userPerformance={mockUserPerformance}
        onSelectTarget={mockOnSelectTarget}
      />
    );

    // Check for different difficulty levels
    expect(screen.getByText('Safe Progress')).toBeInTheDocument();
    expect(screen.getByText('Balanced Challenge')).toBeInTheDocument();
    expect(screen.getByText('Push Your Limits')).toBeInTheDocument();
    
    // Check for success rates  
    expect(screen.getByText('95% Success Rate')).toBeInTheDocument();
    expect(screen.getByText('80% Success Rate')).toBeInTheDocument();
    expect(screen.getByText('60% Success Rate')).toBeInTheDocument();
  });

  it('allows selecting different difficulty levels', () => {
    mockUseUnitPreferences.mockReturnValue({
      preferences: { distance: 'km', pace: 'min/km', temperature: 'celsius', windSpeed: 'km/h' },
      isLoading: false,
      updatePreferences: jest.fn(),
      setDistanceUnit: jest.fn(),
      toggleUnits: jest.fn()
    });

    const mockUserPerformance = {
      weeklyDistance: 25,
      monthlyDistance: 100,
      averagePace: 300,
      runFrequency: 4,
      longestRun: 15,
      totalRunningExperience: 12,
      recentInjuries: false
    };

    render(
      <SmartTargetRecommendations
        goalType={mockGoalType}
        userPerformance={mockUserPerformance}
        onSelectTarget={mockOnSelectTarget}
      />
    );

    // Click on the ambitious target
    const ambitiousTarget = screen.getByText('Push Your Limits').closest('.p-4');
    fireEvent.click(ambitiousTarget!);

    // Check that it's selected (border should change to blue)
    expect(ambitiousTarget).toHaveClass('border-blue-500');
  });

  it('shows custom target input and allows setting custom values', () => {
    mockUseUnitPreferences.mockReturnValue({
      preferences: { distance: 'km', pace: 'min/km', temperature: 'celsius', windSpeed: 'km/h' },
      isLoading: false,
      updatePreferences: jest.fn(),
      setDistanceUnit: jest.fn(),
      toggleUnits: jest.fn()
    });

    render(
      <SmartTargetRecommendations
        goalType={mockGoalType}
        onSelectTarget={mockOnSelectTarget}
      />
    );

    // Find custom target input
    const customInput = screen.getByPlaceholderText('Enter target in km');
    expect(customInput).toBeInTheDocument();

    // Enter a custom value
    fireEvent.change(customInput, { target: { value: '35' } });
    
    // The Use Custom button should be enabled now
    const useCustomButton = screen.getByText('Use Custom');
    expect(useCustomButton).not.toBeDisabled();
    
    // Click the custom button
    fireEvent.click(useCustomButton);
    
    // Should call onSelectTarget with the custom value
    expect(mockOnSelectTarget).toHaveBeenCalledWith(35, 'custom');
  });

  it('displays goal tips for the selected difficulty', () => {
    mockUseUnitPreferences.mockReturnValue({
      preferences: { distance: 'km', pace: 'min/km', temperature: 'celsius', windSpeed: 'km/h' },
      isLoading: false,
      updatePreferences: jest.fn(),
      setDistanceUnit: jest.fn(),
      toggleUnits: jest.fn()
    });

    render(
      <SmartTargetRecommendations
        goalType={mockGoalType}
        onSelectTarget={mockOnSelectTarget}
      />
    );

    // Check for goal tips section
    expect(screen.getByText('Goal Achievement Tips')).toBeInTheDocument();
    
    // Check for some typical distance goal tips
    expect(screen.getByText(/Increase distance gradually/)).toBeInTheDocument();
    expect(screen.getByText(/Include one long run per week/)).toBeInTheDocument();
  });

  it('works without user performance data', () => {
    mockUseUnitPreferences.mockReturnValue({
      preferences: { distance: 'km', pace: 'min/km', temperature: 'celsius', windSpeed: 'km/h' },
      isLoading: false,
      updatePreferences: jest.fn(),
      setDistanceUnit: jest.fn(),
      toggleUnits: jest.fn()
    });

    render(
      <SmartTargetRecommendations
        goalType={mockGoalType}
        onSelectTarget={mockOnSelectTarget}
      />
    );

    // Should still show recommendations (default ones)
    expect(screen.getByText('Beginner Friendly')).toBeInTheDocument();
    expect(screen.getByText('Balanced Target')).toBeInTheDocument();
    expect(screen.getByText('Challenge Mode')).toBeInTheDocument();
    
    // Should not show performance analysis section
    expect(screen.queryByText('Your Current Performance')).not.toBeInTheDocument();
  });
}); 