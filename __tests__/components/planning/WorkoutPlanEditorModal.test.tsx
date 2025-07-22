import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WorkoutPlanEditorModal } from '@/components/planning/WorkoutPlanEditorModal'
import type { WeeklyWorkoutPlan } from '@/lib/training/enhanced-workout-planning'

// Mock the unit preferences hook
jest.mock('@/hooks/useUnitPreferences', () => ({
  useUnitPreferences: () => ({
    preferences: { distance: 'km', pace: 'min/km' }
  })
}))

describe('WorkoutPlanEditorModal', () => {
  const mockWeeklyPlan: WeeklyWorkoutPlan = {
    id: 'week-1',
    weekStart: '2024-01-01',
    workouts: {
      0: null, // Sunday - rest
      1: {
        id: 'workout-1',
        type: 'tempo',
        sport: 'Run',
        duration: 45,
        intensity: 7,
        distance: 8,
        difficulty: 'intermediate',
        energyCost: 7,
        recoveryTime: 36,
        reasoning: 'Tempo runs improve your lactate threshold',
        alternatives: [],
        instructions: ['Warm up', 'Main workout', 'Cool down'],
        tips: ['Stay hydrated', 'Focus on form']
      }, // Monday
      2: null, // Tuesday - rest
      3: null, // Wednesday - rest
      4: {
        id: 'workout-2',
        type: 'long',
        sport: 'Run',
        duration: 90,
        intensity: 5,
        distance: 15,
        difficulty: 'intermediate',
        energyCost: 8,
        recoveryTime: 48,
        reasoning: 'Long runs build endurance',
        alternatives: [],
        instructions: ['Easy pace', 'Stay comfortable'],
        tips: ['Bring water', 'Take it easy']
      }, // Thursday
      5: null, // Friday - rest
      6: null // Saturday - rest
    },
    totalTSS: 250,
    totalDistance: 23,
    totalTime: 135,
    periodizationPhase: 'build',
    isEditable: true
  }

  const mockOnSave = jest.fn()
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the modal when open', () => {
    render(
      <WorkoutPlanEditorModal
        weeklyPlan={mockWeeklyPlan}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    )

    expect(screen.getByText('Edit Weekly Workout Plan')).toBeInTheDocument()
    expect(screen.getByText('Plan Summary')).toBeInTheDocument()
    expect(screen.getByText('Sunday')).toBeInTheDocument()
    expect(screen.getByText('Monday')).toBeInTheDocument()
  })

  it('displays plan summary correctly', () => {
    render(
      <WorkoutPlanEditorModal
        weeklyPlan={mockWeeklyPlan}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    )

    expect(screen.getByText('250')).toBeInTheDocument() // Total TSS
    expect(screen.getByText('23.0 km')).toBeInTheDocument() // Total Distance
    expect(screen.getByText('build')).toBeInTheDocument() // Periodization Phase
  })

  it('shows workout information for days with workouts', () => {
    render(
      <WorkoutPlanEditorModal
        weeklyPlan={mockWeeklyPlan}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    )

    expect(screen.getByText('tempo')).toBeInTheDocument()
    expect(screen.getByText('Run • 45min')).toBeInTheDocument()
    expect(screen.getByText('8.0 km')).toBeInTheDocument()
  })

  it('shows add workout button for empty days', () => {
    render(
      <WorkoutPlanEditorModal
        weeklyPlan={mockWeeklyPlan}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    )

    const addButtons = screen.getAllByText('Add Workout')
    expect(addButtons.length).toBeGreaterThan(0)
  })

  it('calls onClose when cancel button is clicked', () => {
    render(
      <WorkoutPlanEditorModal
        weeklyPlan={mockWeeklyPlan}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    )

    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('calls onSave when save button is clicked', () => {
    render(
      <WorkoutPlanEditorModal
        weeklyPlan={mockWeeklyPlan}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    )

    const saveButton = screen.getByText('Save Plan')
    fireEvent.click(saveButton)

    expect(mockOnSave).toHaveBeenCalledWith(mockWeeklyPlan)
  })

  it('resets plan when reset button is clicked', () => {
    render(
      <WorkoutPlanEditorModal
        weeklyPlan={mockWeeklyPlan}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    )

    const resetButton = screen.getByText('Reset Changes')
    fireEvent.click(resetButton)

    // The plan should be reset to original state
    expect(screen.getByText('250')).toBeInTheDocument() // Total TSS should still be 250
  })

  it('shows reset to recommended button when onResetToRecommended prop is provided', () => {
    const mockResetToRecommended = jest.fn()
    
    render(
      <WorkoutPlanEditorModal
        weeklyPlan={mockWeeklyPlan}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        onResetToRecommended={mockResetToRecommended}
      />
    )

    expect(screen.getByText('Reset to Recommended')).toBeInTheDocument()
  })

  it('shows confirmation dialog when reset to recommended button is clicked', () => {
    const mockResetToRecommended = jest.fn()
    
    render(
      <WorkoutPlanEditorModal
        weeklyPlan={mockWeeklyPlan}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        onResetToRecommended={mockResetToRecommended}
      />
    )

    const resetButton = screen.getByText('Reset to Recommended')
    fireEvent.click(resetButton)

    expect(screen.getByText('Reset to Recommended Plan?')).toBeInTheDocument()
    expect(screen.getByText(/This will delete your current saved plan/)).toBeInTheDocument()
  })

  it('calls onResetToRecommended when confirmed in dialog', async () => {
    const mockResetToRecommended = jest.fn().mockResolvedValue(undefined)
    
    render(
      <WorkoutPlanEditorModal
        weeklyPlan={mockWeeklyPlan}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        onResetToRecommended={mockResetToRecommended}
      />
    )

    const resetButton = screen.getByText('Reset to Recommended')
    fireEvent.click(resetButton)

    // Wait for confirmation dialog to appear and click the destructive button
    await waitFor(() => {
      expect(screen.getByText('Reset to Recommended Plan?')).toBeInTheDocument()
    })
    
    const confirmButton = screen.getByRole('button', { name: 'Reset to Recommended' })
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockResetToRecommended).toHaveBeenCalled()
    })
  })

  it('closes modal after successful reset to recommended', async () => {
    const mockResetToRecommended = jest.fn().mockResolvedValue(undefined)
    
    render(
      <WorkoutPlanEditorModal
        weeklyPlan={mockWeeklyPlan}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        onResetToRecommended={mockResetToRecommended}
      />
    )

    const resetButton = screen.getByText('Reset to Recommended')
    fireEvent.click(resetButton)

    // Wait for confirmation dialog to appear and click the destructive button
    await waitFor(() => {
      expect(screen.getByText('Reset to Recommended Plan?')).toBeInTheDocument()
    })
    
    const confirmButton = screen.getByRole('button', { name: 'Reset to Recommended' })
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('does not show reset to recommended button when prop is not provided', () => {
    render(
      <WorkoutPlanEditorModal
        weeklyPlan={mockWeeklyPlan}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    )

    expect(screen.queryByText('Reset to Recommended')).not.toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <WorkoutPlanEditorModal
        weeklyPlan={mockWeeklyPlan}
        isOpen={false}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    )

    expect(screen.queryByText('Edit Weekly Workout Plan')).not.toBeInTheDocument()
  })
}) 