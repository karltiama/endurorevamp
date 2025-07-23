import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WeatherForecastTabs } from '@/components/weather/WeatherForecastTabs'
import { useLocationWeather } from '@/hooks/useWeather'
import type { WeatherData, WeatherImpact } from '@/lib/weather/types'

// Mock the weather hook
jest.mock('@/hooks/useWeather')
const mockUseLocationWeather = useLocationWeather as jest.MockedFunction<typeof useLocationWeather>

// Mock the UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children, className }: any) => <h2 className={className}>{children}</h2>
}))

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span className={`badge ${variant} ${className}`}>{children}</span>
  )
}))

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children }: any) => <div role="alert">{children}</div>,
  AlertDescription: ({ children }: any) => <div>{children}</div>
}))

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, defaultValue }: any) => <div data-testid="tabs" data-default={defaultValue}>{children}</div>,
  TabsContent: ({ children, value }: any) => <div data-testid={`tab-content-${value}`}>{children}</div>,
  TabsList: ({ children, className }: any) => <div className={className}>{children}</div>,
  TabsTrigger: ({ children, value }: any) => <button data-testid={`tab-trigger-${value}`}>{children}</button>
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Thermometer: () => <span data-testid="thermometer-icon">🌡️</span>,
  Droplets: () => <span data-testid="droplets-icon">💧</span>,
  Wind: () => <span data-testid="wind-icon">💨</span>,
  CloudRain: () => <span data-testid="cloud-rain-icon">🌧️</span>,
  Sun: () => <span data-testid="sun-icon">☀️</span>,
  AlertTriangle: () => <span data-testid="alert-triangle-icon">⚠️</span>,
  Calendar: () => <span data-testid="calendar-icon">📅</span>,
  Clock: () => <span data-testid="clock-icon">🕐</span>
}))

const createMockWeatherData = (): WeatherData => ({
  location: {
    name: 'Test City',
    country: 'US',
    lat: 40.7128,
    lon: -74.0060,
    timezone: 'America/New_York'
  },
  current: {
    temperature: 20,
    feelsLike: 22,
    humidity: 65,
    windSpeed: 10,
    windDirection: 180,
    precipitation: 0,
    uvIndex: 5,
    airQuality: 50,
    dewPoint: 15,
    pressure: 1013,
    visibility: 10,
    weatherCondition: 'clear',
    weatherIcon: '01d',
    lastUpdated: new Date().toISOString()
  },
  forecast: {
    hourly: [
      {
        time: new Date().toISOString(),
        temperature: 20,
        feelsLike: 22,
        humidity: 65,
        windSpeed: 10,
        windDirection: 180,
        precipitation: 0,
        uvIndex: 5,
        weatherCondition: 'clear',
        weatherIcon: '01d'
      },
      {
        time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        temperature: 22,
        feelsLike: 24,
        humidity: 60,
        windSpeed: 12,
        windDirection: 185,
        precipitation: 0,
        uvIndex: 6,
        weatherCondition: 'clear',
        weatherIcon: '01d'
      },
      {
        time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        temperature: 25,
        feelsLike: 27,
        humidity: 55,
        windSpeed: 15,
        windDirection: 190,
        precipitation: 0,
        uvIndex: 8,
        weatherCondition: 'clear',
        weatherIcon: '01d'
      }
    ],
    daily: []
  }
})

const createMockWeatherImpact = (): WeatherImpact => ({
  performance: 'positive',
  risk: 'low',
  recommendations: [
    'Optimal temperature for running',
    'Stay hydrated, run in shade if possible'
  ],
  adjustments: {
    intensity: 0,
    duration: 0,
    route: [],
    clothing: [],
    hydration: ['Drink 500ml before run']
  }
})

const createMockOptimalTime = () => ({
  time: '6:00 AM',
  reason: 'Best conditions: comfortable temperature, low humidity, light winds, dry conditions, moderate UV, early morning (6-8 AM) - cooler temps, less traffic'
})

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('WeatherForecastTabs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders loading state', () => {
    mockUseLocationWeather.mockReturnValue({
      weather: null,
      forecast: null,
      impact: null,
      optimalTime: null,
      isLoading: true,
      error: null,
      refetch: jest.fn()
    })

    renderWithQueryClient(<WeatherForecastTabs />)
    
    expect(screen.getByText('Weather Forecast')).toBeInTheDocument()
    expect(screen.getByText('🌡️')).toBeInTheDocument()
  })

  it('renders error state', () => {
    mockUseLocationWeather.mockReturnValue({
      weather: null,
      forecast: null,
      impact: null,
      optimalTime: null,
      isLoading: false,
      error: new Error('Location permission denied'),
      refetch: jest.fn()
    })

    renderWithQueryClient(<WeatherForecastTabs />)
    
    expect(screen.getByText('Weather Forecast')).toBeInTheDocument()
    expect(screen.getByText('Unable to load weather data. Please check your location permissions.')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('renders null when no weather data', () => {
    mockUseLocationWeather.mockReturnValue({
      weather: null,
      forecast: null,
      impact: null,
      optimalTime: null,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    })

    const { container } = renderWithQueryClient(<WeatherForecastTabs />)
    expect(container.firstChild).toBeNull()
  })

  it('renders tabs with today and tomorrow', () => {
    const mockWeather = createMockWeatherData()
    const mockImpact = createMockWeatherImpact()
    const mockOptimalTime = createMockOptimalTime()

    mockUseLocationWeather.mockReturnValue({
      weather: mockWeather,
      forecast: mockWeather,
      impact: mockImpact,
      optimalTime: mockOptimalTime,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    })

    renderWithQueryClient(<WeatherForecastTabs />)
    
    expect(screen.getByText('Running Weather Forecast')).toBeInTheDocument()
    // Use a more flexible text matcher since "Test City" might be split across elements
    const cityElements = screen.getAllByText(/Test City/);
    expect(cityElements.length).toBeGreaterThan(0)
    expect(screen.getByTestId('tabs')).toBeInTheDocument()
    expect(screen.getByTestId('tab-trigger-today')).toBeInTheDocument()
    expect(screen.getByTestId('tab-trigger-tomorrow')).toBeInTheDocument()
  })

  it('displays weather information in tabs', () => {
    const mockWeather = createMockWeatherData()
    const mockImpact = createMockWeatherImpact()
    const mockOptimalTime = createMockOptimalTime()

    mockUseLocationWeather.mockReturnValue({
      weather: mockWeather,
      forecast: mockWeather,
      impact: mockImpact,
      optimalTime: mockOptimalTime,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    })

    renderWithQueryClient(<WeatherForecastTabs />)
    
    // Check that weather data is displayed
    const tempElements = screen.getAllByText('20°C')
    expect(tempElements.length).toBeGreaterThan(0)
    const humidityElements = screen.getAllByText('65%')
    expect(humidityElements.length).toBeGreaterThan(0)
    const windElements = screen.getAllByText('10 km/h')
    expect(windElements.length).toBeGreaterThan(0)
  })

  it('displays running recommendations', () => {
    const mockWeather = createMockWeatherData()
    const mockImpact = createMockWeatherImpact()
    const mockOptimalTime = createMockOptimalTime()

    mockUseLocationWeather.mockReturnValue({
      weather: mockWeather,
      forecast: mockWeather,
      impact: mockImpact,
      optimalTime: mockOptimalTime,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    })

    renderWithQueryClient(<WeatherForecastTabs />)
    
    // Use getAllByText to handle multiple elements with the same text
    const recommendationsElements = screen.getAllByText('Running Recommendations')
    expect(recommendationsElements.length).toBeGreaterThan(0)
    const bestTimeElements = screen.getAllByText('Best Time')
    expect(bestTimeElements.length).toBeGreaterThan(0)
    const timeElements = screen.getAllByText('6:00 AM')
    expect(timeElements.length).toBeGreaterThan(0)
    const impactElements = screen.getAllByText('Running Impact')
    expect(impactElements.length).toBeGreaterThan(0)
    const riskElements = screen.getAllByText('low risk')
    expect(riskElements.length).toBeGreaterThan(0)
    const performanceElements = screen.getAllByText('Performance')
    expect(performanceElements.length).toBeGreaterThan(0)
    const positiveElements = screen.getAllByText('positive')
    expect(positiveElements.length).toBeGreaterThan(0)
  })

  it('displays hourly breakdown', () => {
    const mockWeather = createMockWeatherData()
    const mockImpact = createMockWeatherImpact()
    const mockOptimalTime = createMockOptimalTime()

    mockUseLocationWeather.mockReturnValue({
      weather: mockWeather,
      forecast: mockWeather,
      impact: mockImpact,
      optimalTime: mockOptimalTime,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    })

    renderWithQueryClient(<WeatherForecastTabs />)
    
    // Use getAllByText to handle multiple elements with the same text
    const hourlyBreakdownElements = screen.getAllByText('Hourly Breakdown')
    expect(hourlyBreakdownElements.length).toBeGreaterThan(0)
    const clockElements = screen.getAllByText('🕐')
    expect(clockElements.length).toBeGreaterThan(0)
  })

  it('handles missing forecast data gracefully', () => {
    const mockWeather = createMockWeatherData()
    // Remove forecast data
    mockWeather.forecast.hourly = []

    mockUseLocationWeather.mockReturnValue({
      weather: mockWeather,
      forecast: mockWeather,
      impact: null,
      optimalTime: null,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    })

    renderWithQueryClient(<WeatherForecastTabs />)
    
    // Should still render the component but with empty forecast data
    expect(screen.getByText('Running Weather Forecast')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const mockWeather = createMockWeatherData()
    const mockImpact = createMockWeatherImpact()
    const mockOptimalTime = createMockOptimalTime()

    mockUseLocationWeather.mockReturnValue({
      weather: mockWeather,
      forecast: mockWeather,
      impact: mockImpact,
      optimalTime: mockOptimalTime,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    })

    const { container } = renderWithQueryClient(
      <WeatherForecastTabs className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('can hide impact and optimal time sections', () => {
    const mockWeather = createMockWeatherData()

    mockUseLocationWeather.mockReturnValue({
      weather: mockWeather,
      forecast: mockWeather,
      impact: null,
      optimalTime: null,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    })

    renderWithQueryClient(
      <WeatherForecastTabs showImpact={false} showOptimalTime={false} />
    )
    
    expect(screen.queryByText('Running Recommendations')).not.toBeInTheDocument()
  })

  it('displays precipitation when present', () => {
    const mockWeather = createMockWeatherData()
    // Add precipitation to the first hour
    mockWeather.forecast.hourly[0].precipitation = 2.5

    mockUseLocationWeather.mockReturnValue({
      weather: mockWeather,
      forecast: mockWeather,
      impact: null,
      optimalTime: null,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    })

    renderWithQueryClient(<WeatherForecastTabs />)
    
    // Use getAllByText to handle multiple elements with the same text
    const precipitationElements = screen.getAllByText('2.5mm')
    expect(precipitationElements.length).toBeGreaterThan(0)
  })

  it('formats dates correctly', () => {
    const mockWeather = createMockWeatherData()
    const mockImpact = createMockWeatherImpact()
    const mockOptimalTime = createMockOptimalTime()

    mockUseLocationWeather.mockReturnValue({
      weather: mockWeather,
      forecast: mockWeather,
      impact: mockImpact,
      optimalTime: mockOptimalTime,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    })

    renderWithQueryClient(<WeatherForecastTabs />)
    
    // Check that weekday names are displayed (using actual current date)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const todayWeekday = today.toLocaleDateString('en-US', { weekday: 'long' })
    const tomorrowWeekday = tomorrow.toLocaleDateString('en-US', { weekday: 'long' })
    
    // Use getAllByText since there might be multiple elements containing the weekday names
    const todayElements = screen.getAllByText((content, element) => {
      return element?.textContent?.includes(todayWeekday) || false
    })
    expect(todayElements.length).toBeGreaterThan(0)
    
    const tomorrowElements = screen.getAllByText((content, element) => {
      return element?.textContent?.includes(tomorrowWeekday) || false
    })
    expect(tomorrowElements.length).toBeGreaterThan(0)
  })
}) 