import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KeyMetrics } from '@/components/dashboard/KeyMetrics';
import { Activity } from '@/lib/strava/types';

// Mock the hook
jest.mock('@/hooks/use-user-activities', () => ({
  useUserActivities: jest.fn(),
}));

const mockUseUserActivities = require('@/hooks/use-user-activities').useUserActivities;

const createMockActivity = (overrides: Partial<Activity> = {}): Activity => ({
  id: '1',
  user_id: 'user-1',
  strava_activity_id: 123456,
  name: 'Morning Run',
  sport_type: 'Run',
  start_date: new Date().toISOString(),
  start_date_local: new Date().toISOString(),
  timezone: 'America/New_York',
  distance: 5000, // 5km
  moving_time: 1800, // 30 minutes
  elapsed_time: 1900,
  total_elevation_gain: 100,
  ...overrides,
});

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('KeyMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', () => {
    mockUseUserActivities.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    renderWithQueryClient(<KeyMetrics userId="user-1" />);
    
    // Should show skeleton loading
    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(3);
  });

  it('renders error state', () => {
    mockUseUserActivities.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to fetch'),
    });

    renderWithQueryClient(<KeyMetrics userId="user-1" />);
    
    expect(screen.getByText('Unable to load metrics')).toBeInTheDocument();
  });

  it('renders key metrics with data', () => {
    const thisWeekActivity = createMockActivity({
      start_date: new Date().toISOString(), // This week
      distance: 10000, // 10km
    });
    
    const lastWeekActivity = createMockActivity({
      start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last week
      distance: 8000, // 8km
    });

    mockUseUserActivities.mockReturnValue({
      data: [thisWeekActivity, lastWeekActivity],
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<KeyMetrics userId="user-1" />);
    
    // Check weekly distance card
    expect(screen.getByText('This Week')).toBeInTheDocument();
    expect(screen.getByText('10.0 km')).toBeInTheDocument(); // Current week
    expect(screen.getByText('8.0 km')).toBeInTheDocument(); // Last week
    
    // Check streak card
    expect(screen.getByText('Current Streak')).toBeInTheDocument();
    expect(screen.getByText('1 days', { selector: 'p' })).toBeInTheDocument();
    
    // Check monthly goal card
    expect(screen.getByText('Monthly Goal')).toBeInTheDocument();
    expect(screen.getByText(/days left/)).toBeInTheDocument();
  });

  it('shows weekly distance comparison correctly', () => {
    const thisWeekActivity = createMockActivity({
      start_date: new Date().toISOString(),
      distance: 12000, // 12km this week
    });
    
    const lastWeekActivity = createMockActivity({
      start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      distance: 10000, // 10km last week
    });

    mockUseUserActivities.mockReturnValue({
      data: [thisWeekActivity, lastWeekActivity],
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<KeyMetrics userId="user-1" />);
    
    // Should show improvement
    expect(screen.getByText('12.0 km')).toBeInTheDocument(); // This week
    expect(screen.getByText('10.0 km')).toBeInTheDocument(); // Last week
    expect(screen.getByText((content, element) => {
      return element?.textContent === '↗️ 20% change'
    })).toBeInTheDocument(); // 20% increase
  });

  it('shows monthly goal progress', () => {
    // Create activities for current month
    const activities = Array.from({ length: 5 }, (_, i) => 
      createMockActivity({
        start_date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        distance: 5000, // 5km each
      })
    );

    mockUseUserActivities.mockReturnValue({
      data: activities,
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<KeyMetrics userId="user-1" />);
    
    // Should show monthly goal card
    expect(screen.getByText('Monthly Goal')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
    expect(screen.getByText('Target')).toBeInTheDocument();
    
    // Should show progress percentage (more specific)
    expect(screen.getByText(/\d+\.\d+%/)).toBeInTheDocument();
  });

  it('handles empty activities array', () => {
    mockUseUserActivities.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<KeyMetrics userId="user-1" />);
    
    // Should still render all cards with zero values
    expect(screen.getByText('This Week')).toBeInTheDocument();
    expect(screen.getByText('Current Streak')).toBeInTheDocument();
    expect(screen.getByText('Monthly Goal')).toBeInTheDocument();
    
    // Should show 0 values (more specific selectors)
    expect(screen.getByText('0 days', { selector: 'p' })).toBeInTheDocument(); // Streak main value
    expect(screen.getAllByText('0 m')).toHaveLength(3); // Distance appears in multiple places
  });
}); 