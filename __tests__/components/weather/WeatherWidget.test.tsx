import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WeatherWidget } from '@/components/weather/WeatherWidget';
import { useLocationWeather } from '@/hooks/useWeather';

// Mock the weather hook
jest.mock('@/hooks/useWeather');
const mockUseLocationWeather = useLocationWeather as jest.MockedFunction<
  typeof useLocationWeather
>;

describe('WeatherWidget', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should render loading state', () => {
    mockUseLocationWeather.mockReturnValue({
      weather: null,
      forecast: null,
      impact: null,
      optimalTime: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<WeatherWidget />, { wrapper });

    expect(screen.getByText('Weather')).toBeInTheDocument();
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('should render error state', () => {
    mockUseLocationWeather.mockReturnValue({
      weather: null,
      forecast: null,
      impact: null,
      optimalTime: null,
      isLoading: false,
      error: new Error('Location permission denied'),
      refetch: jest.fn(),
    });

    render(<WeatherWidget />, { wrapper });

    expect(screen.getByText('Weather')).toBeInTheDocument();
    expect(screen.getByText(/Unable to load weather data/)).toBeInTheDocument();
  });

  it('should render weather data correctly', () => {
    const mockWeather = {
      location: {
        name: 'London',
        country: 'GB',
        lat: 51.5074,
        lon: -0.1278,
        timezone: '0',
      },
      current: {
        temperature: 15,
        feelsLike: 14,
        humidity: 60,
        windSpeed: 10,
        windDirection: 180,
        precipitation: 0,
        uvIndex: 3,
        airQuality: 30,
        dewPoint: 7,
        pressure: 1013,
        visibility: 10,
        weatherCondition: 'clear',
        weatherIcon: '01d',
        lastUpdated: '2024-01-01T12:00:00Z',
      },
      forecast: { hourly: [], daily: [] },
    };

    const mockImpact = {
      performance: 'positive' as const,
      risk: 'low' as const,
      recommendations: ['Optimal temperature for running'],
      adjustments: {
        intensity: 0,
        duration: 0,
        route: [],
        clothing: [],
        hydration: [],
      },
    };

    mockUseLocationWeather.mockReturnValue({
      weather: mockWeather,
      forecast: mockWeather,
      impact: mockImpact,
      optimalTime: {
        time: '6:00 AM',
        reason: 'Best conditions: comfortable temperature',
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<WeatherWidget />, { wrapper });

    expect(screen.getByText('Weather')).toBeInTheDocument();
    expect(screen.getByText('• London')).toBeInTheDocument();
    expect(screen.getByText('15°C')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('10 km/h')).toBeInTheDocument();
    expect(screen.getByText('Running Impact')).toBeInTheDocument();
    expect(screen.getByText('low risk')).toBeInTheDocument();
    expect(screen.getByText('positive')).toBeInTheDocument();
    expect(screen.getByText('Best Time to Run')).toBeInTheDocument();
    expect(screen.getByText('6:00 AM')).toBeInTheDocument();
  });

  it('should render weather data with precipitation', () => {
    const mockWeather = {
      location: {
        name: 'London',
        country: 'GB',
        lat: 51.5074,
        lon: -0.1278,
        timezone: '0',
      },
      current: {
        temperature: 12,
        feelsLike: 10,
        humidity: 85,
        windSpeed: 15,
        windDirection: 180,
        precipitation: 2.5,
        uvIndex: 2,
        airQuality: 25,
        dewPoint: 10,
        pressure: 1000,
        visibility: 8,
        weatherCondition: 'rain',
        weatherIcon: '10d',
        lastUpdated: '2024-01-01T12:00:00Z',
      },
      forecast: { hourly: [], daily: [] },
    };

    mockUseLocationWeather.mockReturnValue({
      weather: mockWeather,
      forecast: mockWeather,
      impact: null,
      optimalTime: null,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<WeatherWidget />, { wrapper });

    expect(screen.getByText('12°C')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('15 km/h')).toBeInTheDocument();
    expect(screen.getByText('2.5mm')).toBeInTheDocument();
  });

  it('should render with negative weather impact', () => {
    const mockWeather = {
      location: {
        name: 'London',
        country: 'GB',
        lat: 51.5074,
        lon: -0.1278,
        timezone: '0',
      },
      current: {
        temperature: 30,
        feelsLike: 35,
        humidity: 80,
        windSpeed: 5,
        windDirection: 180,
        precipitation: 0,
        uvIndex: 8,
        airQuality: 40,
        dewPoint: 25,
        pressure: 1010,
        visibility: 10,
        weatherCondition: 'clear',
        weatherIcon: '01d',
        lastUpdated: '2024-01-01T12:00:00Z',
      },
      forecast: { hourly: [], daily: [] },
    };

    const mockImpact = {
      performance: 'negative' as const,
      risk: 'high' as const,
      recommendations: [
        'High heat - reduce intensity, stay hydrated',
        'Drink 500ml before run',
        'Carry water',
      ],
      adjustments: {
        intensity: -2,
        duration: -20,
        route: [],
        clothing: [],
        hydration: ['Electrolyte replacement', 'Frequent water breaks'],
      },
    };

    mockUseLocationWeather.mockReturnValue({
      weather: mockWeather,
      forecast: mockWeather,
      impact: mockImpact,
      optimalTime: null,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<WeatherWidget />, { wrapper });

    expect(screen.getByText('30°C')).toBeInTheDocument();
    expect(screen.getByText('high risk')).toBeInTheDocument();
    expect(screen.getByText('negative')).toBeInTheDocument();
    expect(screen.getByText('-2')).toBeInTheDocument();
    expect(
      screen.getByText('High heat - reduce intensity, stay hydrated')
    ).toBeInTheDocument();
  });

  it('should hide impact when showImpact is false', () => {
    const mockWeather = {
      location: {
        name: 'London',
        country: 'GB',
        lat: 51.5074,
        lon: -0.1278,
        timezone: '0',
      },
      current: {
        temperature: 15,
        feelsLike: 14,
        humidity: 60,
        windSpeed: 10,
        windDirection: 180,
        precipitation: 0,
        uvIndex: 3,
        airQuality: 30,
        dewPoint: 7,
        pressure: 1013,
        visibility: 10,
        weatherCondition: 'clear',
        weatherIcon: '01d',
        lastUpdated: '2024-01-01T12:00:00Z',
      },
      forecast: { hourly: [], daily: [] },
    };

    const mockImpact = {
      performance: 'positive' as const,
      risk: 'low' as const,
      recommendations: ['Optimal temperature for running'],
      adjustments: {
        intensity: 0,
        duration: 0,
        route: [],
        clothing: [],
        hydration: [],
      },
    };

    mockUseLocationWeather.mockReturnValue({
      weather: mockWeather,
      forecast: mockWeather,
      impact: mockImpact,
      optimalTime: null,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<WeatherWidget showImpact={false} />, { wrapper });

    expect(screen.getByText('Weather')).toBeInTheDocument();
    expect(screen.queryByText('Running Impact')).not.toBeInTheDocument();
  });

  it('should hide optimal time when showOptimalTime is false', () => {
    const mockWeather = {
      location: {
        name: 'London',
        country: 'GB',
        lat: 51.5074,
        lon: -0.1278,
        timezone: '0',
      },
      current: {
        temperature: 15,
        feelsLike: 14,
        humidity: 60,
        windSpeed: 10,
        windDirection: 180,
        precipitation: 0,
        uvIndex: 3,
        airQuality: 30,
        dewPoint: 7,
        pressure: 1013,
        visibility: 10,
        weatherCondition: 'clear',
        weatherIcon: '01d',
        lastUpdated: '2024-01-01T12:00:00Z',
      },
      forecast: { hourly: [], daily: [] },
    };

    mockUseLocationWeather.mockReturnValue({
      weather: mockWeather,
      forecast: mockWeather,
      impact: null,
      optimalTime: { time: '6:00 AM', reason: 'Best conditions' },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<WeatherWidget showOptimalTime={false} />, { wrapper });

    expect(screen.getByText('Weather')).toBeInTheDocument();
    expect(screen.queryByText('Best Time to Run')).not.toBeInTheDocument();
  });
});
