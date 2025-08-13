import { render, screen } from '@testing-library/react';
import EnhancedFeaturesSection from '@/components/EnhancedFeaturesSection';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  },
}));

describe('EnhancedFeaturesSection', () => {
  it('renders the section header correctly', () => {
    render(<EnhancedFeaturesSection />);

    expect(screen.getByText('Real Features, Real Results')).toBeInTheDocument();
    expect(screen.getByText('Everything You Need to')).toBeInTheDocument();
    expect(screen.getByText('Level')).toBeInTheDocument();
    expect(screen.getByText('Up')).toBeInTheDocument();
    expect(screen.getByText(/These aren't mockups/)).toBeInTheDocument();
  });

  it('renders all feature cards', () => {
    render(<EnhancedFeaturesSection />);

    expect(screen.getByText('Training Load Analysis')).toBeInTheDocument();
    expect(screen.getByText('Performance Trends')).toBeInTheDocument();
    expect(screen.getByText('Activity Analytics')).toBeInTheDocument();
    expect(screen.getByText('Smart Goal Tracking')).toBeInTheDocument();
    expect(screen.getByText('Achievements & Streaks')).toBeInTheDocument();
    expect(screen.getByText('Mobile Dashboard')).toBeInTheDocument();
  });

  it('renders feature descriptions', () => {
    render(<EnhancedFeaturesSection />);

    expect(
      screen.getByText(/Track your training stress and recovery/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Visualize pace, heart rate, and cadence trends/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Dive deep into your performance/)
    ).toBeInTheDocument();
  });

  it('renders feature bullet points', () => {
    render(<EnhancedFeaturesSection />);

    expect(screen.getByText('Weekly training stress')).toBeInTheDocument();
    expect(screen.getByText('Recovery tracking')).toBeInTheDocument();
    expect(screen.getByText('Pace progression')).toBeInTheDocument();
    expect(screen.getByText('Progress tracking')).toBeInTheDocument();
  });

  it('renders feature badges correctly', () => {
    render(<EnhancedFeaturesSection />);

    // Check that live features have appropriate badges
    expect(screen.getAllByText('Live Feature').length).toBeGreaterThan(0);
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
  });

  it('renders live feature badges', () => {
    render(<EnhancedFeaturesSection />);

    const liveBadges = screen.getAllByText('Live Feature');
    expect(liveBadges.length).toBeGreaterThan(0); // At least one live feature
  });

  it('renders coming soon badge for achievements', () => {
    render(<EnhancedFeaturesSection />);

    const comingSoonBadge = screen.getByText('Coming Soon');
    expect(comingSoonBadge).toBeInTheDocument();
  });

  it('renders all screenshots and coming soon features', () => {
    render(<EnhancedFeaturesSection />);

    // Check that all expected screenshots are displayed
    expect(
      screen.getByAltText(
        'Performance trends chart showing pace and heart rate improvements over time'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByAltText(
        'Activity Analytics Dashboard showing performance metrics and route data'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByAltText(
        'Goal tracking dashboard showing progress toward running goals'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByAltText('iPhone mockup showing mobile dashboard interface')
    ).toBeInTheDocument();

    // Check that coming soon feature shows appropriate message
    expect(screen.getByText('Coming Soon!')).toBeInTheDocument();
    expect(
      screen.getByText('Launching in the next few days')
    ).toBeInTheDocument();
  });
});
