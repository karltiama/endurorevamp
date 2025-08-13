import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';

// Mock dependencies
jest.mock('@/hooks/useGoals', () => ({
  useOnboardingStatus: jest.fn(),
}));

jest.mock('@/providers/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

// Import mocked functions
import { useOnboardingStatus } from '@/hooks/useGoals';
import { useAuth } from '@/providers/AuthProvider';

const mockUseOnboardingStatus = useOnboardingStatus as jest.MockedFunction<
  typeof useOnboardingStatus
>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock child components
jest.mock('@/components/onboarding/GoalsSelectionStep', () => ({
  GoalsSelectionStep: ({ onComplete }: { onComplete: () => void }) => (
    <div data-testid="goals-selection-step">
      <button onClick={onComplete}>Complete Goals</button>
    </div>
  ),
}));

jest.mock('@/components/onboarding/OnboardingProgress', () => ({
  OnboardingProgress: ({ steps }: { steps: any[] }) => (
    <div data-testid="onboarding-progress">
      {steps.map(step => (
        <div key={step.id} data-testid={`step-${step.id}`}>
          {step.title}
        </div>
      ))}
    </div>
  ),
}));

describe('OnboardingModal', () => {
  const mockOnOpenChange = jest.fn();
  const mockOnComplete = jest.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    onComplete: mockOnComplete,
  };

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00Z',
  };

  const mockOnboarding = {
    id: 'onboarding-id',
    user_id: 'test-user-id',
    goals_completed: false,
    strava_connected: false,
    current_step: 'goals' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      signOut: jest.fn(),
      refreshUser: jest.fn(),
      isAuthenticated: true,
    });

    mockUseOnboardingStatus.mockReturnValue({
      onboarding: mockOnboarding,
      hasCompletedOnboarding: false,
      currentStep: 'goals',
      isLoading: false,
      error: null,
    });
  });

  it('renders modal when open is true', () => {
    render(<OnboardingModal {...defaultProps} />);

    expect(
      screen.getByText('Welcome to Your Running Journey! 🏃‍♂️')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Let's set up your account to help you achieve your running goals"
      )
    ).toBeInTheDocument();
  });

  it('does not render when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      signOut: jest.fn(),
      refreshUser: jest.fn(),
      isAuthenticated: false,
    });

    render(<OnboardingModal {...defaultProps} />);

    expect(
      screen.queryByText('Welcome to Your Running Journey! 🏃‍♂️')
    ).not.toBeInTheDocument();
  });

  it('shows goals step by default', () => {
    render(<OnboardingModal {...defaultProps} />);

    expect(screen.getByTestId('goals-selection-step')).toBeInTheDocument();
    expect(screen.getByText('Set Your Goals')).toBeInTheDocument();
  });

  it('shows Strava connection step when goals are completed', () => {
    mockUseOnboardingStatus.mockReturnValue({
      onboarding: {
        ...mockOnboarding,
        goals_completed: true,
        current_step: 'strava' as const,
      },
      hasCompletedOnboarding: false,
      currentStep: 'strava',
      isLoading: false,
      error: null,
    });

    render(<OnboardingModal {...defaultProps} />);

    expect(screen.getByText('Connect Your Strava Account')).toBeInTheDocument();
    expect(screen.getByText('Connect with Strava')).toBeInTheDocument();
  });

  it('shows completion step when all steps are done', () => {
    mockUseOnboardingStatus.mockReturnValue({
      onboarding: {
        ...mockOnboarding,
        goals_completed: true,
        strava_connected: true,
        current_step: 'complete' as const,
      },
      hasCompletedOnboarding: false,
      currentStep: 'complete',
      isLoading: false,
      error: null,
    });

    render(<OnboardingModal {...defaultProps} />);

    expect(screen.getByText("You're All Set! 🎉")).toBeInTheDocument();
    expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
  });

  it('closes modal and calls onComplete when onboarding is completed', async () => {
    mockUseOnboardingStatus.mockReturnValue({
      onboarding: mockOnboarding,
      hasCompletedOnboarding: true,
      currentStep: 'complete',
      isLoading: false,
      error: null,
    });

    render(<OnboardingModal {...defaultProps} />);

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  it('handles Strava connection button click', () => {
    mockUseOnboardingStatus.mockReturnValue({
      onboarding: {
        ...mockOnboarding,
        goals_completed: true,
        current_step: 'strava' as const,
      },
      hasCompletedOnboarding: false,
      currentStep: 'strava',
      isLoading: false,
      error: null,
    });

    render(<OnboardingModal {...defaultProps} />);

    const stravaButton = screen.getByText('Connect with Strava');
    expect(stravaButton).toBeInTheDocument();

    // Test that clicking the button doesn't throw an error
    expect(() => {
      fireEvent.click(stravaButton);
    }).not.toThrow();
  });

  it('handles skip Strava connection', () => {
    mockUseOnboardingStatus.mockReturnValue({
      onboarding: {
        ...mockOnboarding,
        goals_completed: true,
        current_step: 'strava' as const,
      },
      hasCompletedOnboarding: false,
      currentStep: 'strava',
      isLoading: false,
      error: null,
    });

    render(<OnboardingModal {...defaultProps} />);

    fireEvent.click(screen.getByText('Skip for now'));

    // Should progress to completion step
    expect(screen.getByText("You're All Set! 🎉")).toBeInTheDocument();
  });

  it('handles completion button click', () => {
    mockUseOnboardingStatus.mockReturnValue({
      onboarding: {
        ...mockOnboarding,
        goals_completed: true,
        strava_connected: true,
        current_step: 'complete' as const,
      },
      hasCompletedOnboarding: false,
      currentStep: 'complete',
      isLoading: false,
      error: null,
    });

    render(<OnboardingModal {...defaultProps} />);

    fireEvent.click(screen.getByText('Go to Dashboard'));

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    expect(mockOnComplete).toHaveBeenCalled();
  });

  it('shows loading state when onboarding status is loading', () => {
    mockUseOnboardingStatus.mockReturnValue({
      onboarding: null,
      hasCompletedOnboarding: false,
      currentStep: 'goals',
      isLoading: true,
      error: null,
    });

    render(<OnboardingModal {...defaultProps} />);

    // Modal should still render but content might be in loading state
    expect(
      screen.getByText('Welcome to Your Running Journey! 🏃‍♂️')
    ).toBeInTheDocument();
  });

  it('handles onboarding status error gracefully', () => {
    mockUseOnboardingStatus.mockReturnValue({
      onboarding: null,
      hasCompletedOnboarding: false,
      currentStep: 'goals',
      isLoading: false,
      error: new Error('Failed to load onboarding status'),
    });

    render(<OnboardingModal {...defaultProps} />);

    // Modal should still render but might show error state
    expect(
      screen.getByText('Welcome to Your Running Journey! 🏃‍♂️')
    ).toBeInTheDocument();
  });
});
