import { render, screen, fireEvent } from '@testing-library/react';
import LiveDashboardPreview from '@/components/LiveDashboardPreview';

describe('LiveDashboardPreview', () => {
  it('renders the dashboard header correctly', () => {
    render(<LiveDashboardPreview />);

    expect(screen.getByText('Live Dashboard Preview')).toBeInTheDocument();
    expect(screen.getByText('Weekly Activity')).toBeInTheDocument();
    expect(screen.getByText('Goal Progress')).toBeInTheDocument();
    expect(screen.getByText('Recovery Status')).toBeInTheDocument();
  });

  it('renders key metrics with correct values', () => {
    render(<LiveDashboardPreview />);

    expect(screen.getByText('24.3')).toBeInTheDocument();
    expect(screen.getByText('miles')).toBeInTheDocument();
    expect(screen.getByText('TSS')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('8:18')).toBeInTheDocument();
    expect(screen.getByText('/mile')).toBeInTheDocument();
  });

  it('renders weekly activity chart', () => {
    render(<LiveDashboardPreview />);

    expect(screen.getByText('Weekly Activity')).toBeInTheDocument();
    expect(
      screen.getByText('Your running activity over the past week')
    ).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('5.2 miles • 8:30/mile')).toBeInTheDocument();
    // Check that rest days exist (there are multiple)
    expect(screen.getAllByText('Rest day')).toHaveLength(3);
  });

  it('renders goal progress section', () => {
    render(<LiveDashboardPreview />);

    expect(screen.getByText('Goal Progress')).toBeInTheDocument();
    expect(
      screen.getByText('Track your progress toward running goals')
    ).toBeInTheDocument();
    expect(screen.getByText('Long Run')).toBeInTheDocument();
    expect(screen.getByText('Consistency')).toBeInTheDocument();
    expect(screen.getByText('24.3/30 miles')).toBeInTheDocument();
    expect(screen.getByText('81% complete')).toBeInTheDocument();
  });

  it('renders training load and recovery cards', () => {
    render(<LiveDashboardPreview />);

    expect(
      screen.getByText('Weekly training stress balance')
    ).toBeInTheDocument();
    expect(screen.getByText('Training Stress Score')).toBeInTheDocument();
    expect(screen.getByText('Optimal Range')).toBeInTheDocument();

    expect(screen.getByText('Recovery Status')).toBeInTheDocument();
    expect(
      screen.getByText('How ready you are for your next run')
    ).toBeInTheDocument();
    expect(screen.getByText('Ready to Run')).toBeInTheDocument();
  });

  it('renders interactive controls', () => {
    render(<LiveDashboardPreview />);

    expect(
      screen.getByRole('button', { name: 'Play preview' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Reset preview' })
    ).toBeInTheDocument();
  });

  it('toggles play/pause button state', () => {
    render(<LiveDashboardPreview />);

    const playButton = screen.getByRole('button', { name: 'Play preview' });
    expect(playButton).toBeInTheDocument();

    fireEvent.click(playButton);
    expect(
      screen.getByRole('button', { name: 'Pause preview' })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Pause preview' }));
    expect(
      screen.getByRole('button', { name: 'Play preview' })
    ).toBeInTheDocument();
  });

  it('resets preview when reset button is clicked', () => {
    render(<LiveDashboardPreview />);

    const resetButton = screen.getByRole('button', { name: 'Reset preview' });
    expect(resetButton).toBeInTheDocument();

    // Click play first to change state
    fireEvent.click(screen.getByRole('button', { name: 'Play preview' }));
    expect(
      screen.getByRole('button', { name: 'Pause preview' })
    ).toBeInTheDocument();

    // Click reset to return to initial state
    fireEvent.click(resetButton);
    expect(
      screen.getByRole('button', { name: 'Play preview' })
    ).toBeInTheDocument();
  });
});
