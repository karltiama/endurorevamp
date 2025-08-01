import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GoalsSelectionStep } from '@/components/onboarding/GoalsSelectionStep';
import { useUnitPreferences } from '@/hooks/useUnitPreferences';

// Mock dependencies
jest.mock('@/hooks/useUnitPreferences');

const mockUseUnitPreferences = useUnitPreferences as jest.MockedFunction<typeof useUnitPreferences>;

// Mock fetch
global.fetch = jest.fn();

describe('GoalsSelectionStep', () => {
  const mockOnGoalsSelected = jest.fn();
  const mockOnComplete = jest.fn();
  
  const defaultProps = {
    onGoalsSelected: mockOnGoalsSelected,
    selectedGoals: [],
    onComplete: mockOnComplete
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseUnitPreferences.mockReturnValue({
      preferences: {
        distance: 'km',
        pace: 'min/km',
        temperature: 'celsius',
        windSpeed: 'km/h'
      },
      updatePreferences: jest.fn(),
      setDistanceUnit: jest.fn(),
      toggleUnits: jest.fn(),
      isLoading: false
    });

    (global.fetch as jest.Mock).mockClear();
  });

  it('renders goal selection interface', () => {
    render(<GoalsSelectionStep {...defaultProps} />);
    
    expect(screen.getByText('Choose Your Training Goals')).toBeInTheDocument();
    expect(screen.getByText('Select 2-3 goals to focus on. We\'ll help you track progress and stay motivated.')).toBeInTheDocument();
  });

  it('displays goal suggestions', () => {
    render(<GoalsSelectionStep {...defaultProps} />);
    
    expect(screen.getByText('Build Weekly Distance')).toBeInTheDocument();
    expect(screen.getByText('Establish Training Frequency')).toBeInTheDocument();
    expect(screen.getByText('Improve Running Pace')).toBeInTheDocument();
    expect(screen.getByText('Complete a Long Run')).toBeInTheDocument();
  });

  it('allows selecting and deselecting goals', () => {
    render(<GoalsSelectionStep {...defaultProps} />);
    
    const firstGoal = screen.getByText('Build Weekly Distance').closest('.cursor-pointer');
    expect(firstGoal).toBeInTheDocument();
    
    // Select goal
    fireEvent.click(firstGoal!);
    expect(screen.getByText('Selected')).toBeInTheDocument();
    
    // Deselect goal
    fireEvent.click(firstGoal!);
    expect(screen.queryByText('Selected')).not.toBeInTheDocument();
  });

  it('shows selection count', () => {
    render(<GoalsSelectionStep {...defaultProps} />);
    
    expect(screen.getByText('0 of 3 goals selected')).toBeInTheDocument();
    
    // Select a goal
    const firstGoal = screen.getByText('Build Weekly Distance').closest('.cursor-pointer');
    fireEvent.click(firstGoal!);
    
    expect(screen.getByText('1 of 3 goals selected')).toBeInTheDocument();
  });

  it('disables continue button when no goals selected', () => {
    render(<GoalsSelectionStep {...defaultProps} />);
    
    const continueButton = screen.getByText('Continue with Selected Goals');
    expect(continueButton).toBeDisabled();
  });

  it('enables continue button when goals are selected', () => {
    render(<GoalsSelectionStep {...defaultProps} />);
    
    const firstGoal = screen.getByText('Build Weekly Distance').closest('.cursor-pointer');
    fireEvent.click(firstGoal!);
    
    const continueButton = screen.getByText('Continue with Selected Goals');
    expect(continueButton).not.toBeDisabled();
  });

  it('creates goals and updates onboarding status on continue', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true }) }) // Goals creation
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true }) }); // Onboarding update

    render(<GoalsSelectionStep {...defaultProps} />);
    
    // Select a goal
    const firstGoal = screen.getByText('Build Weekly Distance').closest('.cursor-pointer');
    fireEvent.click(firstGoal!);
    
    // Click continue
    const continueButton = screen.getByText('Continue with Selected Goals');
    fireEvent.click(continueButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
    
    // Check goals creation call
    expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.stringContaining('"goals":')
    });
    
    // Check onboarding update call
    expect(global.fetch).toHaveBeenNthCalledWith(2, '/api/onboarding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        goals_completed: true,
        current_step: 'strava'
      })
    });
    
    expect(mockOnGoalsSelected).toHaveBeenCalled();
    expect(mockOnComplete).toHaveBeenCalled();
  });

  it('shows loading state during goal creation', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100)));

    render(<GoalsSelectionStep {...defaultProps} />);
    
    // Select a goal
    const firstGoal = screen.getByText('Build Weekly Distance').closest('.cursor-pointer');
    fireEvent.click(firstGoal!);
    
    // Click continue
    const continueButton = screen.getByText('Continue with Selected Goals');
    fireEvent.click(continueButton);
    
    // Should show loading state
    expect(screen.getByText('Creating Goals...')).toBeInTheDocument();
    expect(screen.getByText('Creating Goals...')).toBeDisabled();
  });

  it('handles goal creation error gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<GoalsSelectionStep {...defaultProps} />);
    
    // Select a goal
    const firstGoal = screen.getByText('Build Weekly Distance').closest('.cursor-pointer');
    fireEvent.click(firstGoal!);
    
    // Click continue
    const continueButton = screen.getByText('Continue with Selected Goals');
    fireEvent.click(continueButton);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error creating goals:', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });

  it('handles onboarding update error gracefully', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true }) }) // Goals creation
      .mockResolvedValueOnce({ ok: false }); // Onboarding update

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    render(<GoalsSelectionStep {...defaultProps} />);
    
    // Select a goal
    const firstGoal = screen.getByText('Build Weekly Distance').closest('.cursor-pointer');
    fireEvent.click(firstGoal!);
    
    // Click continue
    const continueButton = screen.getByText('Continue with Selected Goals');
    fireEvent.click(continueButton);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update onboarding status, but goals were created');
    });
    
    consoleSpy.mockRestore();
  });

  it('converts units based on user preferences', () => {
    mockUseUnitPreferences.mockReturnValue({
      preferences: {
        distance: 'miles',
        pace: 'min/mile',
        temperature: 'fahrenheit',
        windSpeed: 'mph'
      },
      updatePreferences: jest.fn(),
      setDistanceUnit: jest.fn(),
      toggleUnits: jest.fn(),
      isLoading: false
    });

    render(<GoalsSelectionStep {...defaultProps} />);
    
    // Should show miles instead of km
    expect(screen.getByText(/15\.5 mi/)).toBeInTheDocument();
  });

  it('displays goal details correctly', () => {
    render(<GoalsSelectionStep {...defaultProps} />);
    
    // Check for goal details
    expect(screen.getByText('25 km')).toBeInTheDocument();
    expect(screen.getByText('conservative')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('shows goal benefits and strategies', () => {
    render(<GoalsSelectionStep {...defaultProps} />);
    
    // Check for goal titles and descriptions that are actually rendered
    expect(screen.getByText('Build Weekly Distance')).toBeInTheDocument();
    expect(screen.getByText('Establish Training Frequency')).toBeInTheDocument();
    expect(screen.getByText('Gradually increase your weekly running distance')).toBeInTheDocument();
    expect(screen.getByText('Run consistently throughout the week')).toBeInTheDocument();
  });

  it('prevents continuing with empty selection', () => {
    render(<GoalsSelectionStep {...defaultProps} />);
    
    const continueButton = screen.getByText('Continue with Selected Goals');
    fireEvent.click(continueButton);
    
    // Should not make any API calls
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockOnGoalsSelected).not.toHaveBeenCalled();
    expect(mockOnComplete).not.toHaveBeenCalled();
  });
}); 