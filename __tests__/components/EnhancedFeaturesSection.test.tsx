import { render, screen } from '@testing-library/react';
import EnhancedFeaturesSection from '@/components/EnhancedFeaturesSection';

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

    expect(screen.getByText('What the app does today')).toBeInTheDocument();
    expect(screen.getByText('Everything You Need to')).toBeInTheDocument();
    expect(screen.getByText('Level')).toBeInTheDocument();
    expect(screen.getByText('Up')).toBeInTheDocument();
    expect(
      screen.getByText(/Features marked .*Planned.* are on the roadmap/)
    ).toBeInTheDocument();
  });

  it('renders live and planned feature cards', () => {
    render(<EnhancedFeaturesSection />);

    expect(screen.getByText('Strava Activity Analytics')).toBeInTheDocument();
    expect(screen.getByText('Training Load Insights')).toBeInTheDocument();
    expect(screen.getByText('Goals & Progress Tracking')).toBeInTheDocument();
    expect(
      screen.getByText('Onboarding & Training Profile')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Weather-Aware Workout Planning')
    ).toBeInTheDocument();
    expect(screen.getByText('AI Weekly Training Debrief')).toBeInTheDocument();
    expect(screen.getByText('Mobile-Friendly Dashboard')).toBeInTheDocument();
  });

  it('renders honest feature descriptions', () => {
    render(<EnhancedFeaturesSection />);

    expect(
      screen.getByText(/Import runs and rides from Strava/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Complete a guided setup flow/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/A planned feature to summarize your week/)
    ).toBeInTheDocument();
  });

  it('renders feature bullet points', () => {
    render(<EnhancedFeaturesSection />);

    expect(screen.getByText('Automatic Strava sync')).toBeInTheDocument();
    expect(screen.getByText('Weekly training load (TSS-style)')).toBeInTheDocument();
    expect(screen.getByText('OpenWeather context for your area')).toBeInTheDocument();
    expect(screen.getByText('Planned — not live today')).toBeInTheDocument();
  });

  it('renders status badges correctly', () => {
    render(<EnhancedFeaturesSection />);

    expect(screen.getAllByText('Available today').length).toBeGreaterThan(0);
    expect(screen.getByText('Planned — not live yet')).toBeInTheDocument();
  });

  it('renders screenshots and the planned feature placeholder', () => {
    render(<EnhancedFeaturesSection />);

    expect(
      screen.getByAltText(
        'Activity analytics dashboard with performance metrics from synced Strava activities'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByAltText('Smartphone showing the responsive Enduro Stats dashboard')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/AI Weekly Training Debrief is on the roadmap/)
    ).toBeInTheDocument();
  });
});
