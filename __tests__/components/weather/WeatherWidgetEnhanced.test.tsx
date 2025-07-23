import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WeatherWidgetEnhanced } from '@/components/weather/WeatherWidgetEnhanced'
import { useWeather } from '@/hooks/useWeather'
import { useLocation } from '@/hooks/useLocation'
import { useUnitPreferences } from '@/hooks/useUnitPreferences'
import type { WeatherData, WeatherImpact } from '@/lib/weather/types'

// Mock the hooks
jest.mock('@/hooks/useWeather')
jest.mock('@/hooks/useLocation')
jest.mock('@/hooks/useUnitPreferences')

const mockUseWeather = useWeather as jest.MockedFunction<typeof useWeather>
const mockUseLocation = useLocation as jest.MockedFunction<typeof useLocation>
const mockUseUnitPreferences = useUnitPreferences as jest.MockedFunction<typeof useUnitPreferences>

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

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, type, variant, size, className }: any) => (
    <button onClick={onClick} type={type} className={`button ${variant} ${size} ${className}`}>
      {children}
    </button>
  )
}))

jest.mock('@/components/ui/input', () => ({
  Input: ({ id, name, type, step, defaultValue, placeholder }: any) => (
    <input id={id} name={name} type={type} step={step} defaultValue={defaultValue} placeholder={placeholder} />
  )
}))

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: any) => <label htmlFor={htmlFor}>{children}</label>
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
  MapPin: () => <span data-testid="map-pin-icon">📍</span>,
  Settings: () => <span data-testid="settings-icon">⚙️</span>,
  Navigation: () => <span data-testid="navigation-icon">🧭</span>,
  Calendar: () => <span data-testid="calendar-icon">📅</span>,
  Clock: () => <span data-testid="clock-icon">🕐</span>
}))

jest.mock('@/components/weather/LocationPermissionPrompt', () => ({
  LocationPermissionPrompt: ({ className, onLocationGranted, onDismiss }: any) => (
    <div className={className} data-testid="location-permission-prompt">
      <button onClick={onLocationGranted}>Allow Location</button>
      <button onClick={onDismiss}>Dismiss</button>
    </div>
  )
}))

jest.mock('@/lib/utils', () => ({
  formatTemperature: (temp: number, unit: string) => `${temp}°${unit === 'imperial' ? 'F' : 'C'}`,
  formatWindSpeed: (speed: number, unit: string) => `${speed} ${unit === 'imperial' ? 'mph' : 'km/h'}`
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

describe('WeatherWidgetEnhanced', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mocks
    mockUseLocation.mockReturnValue({
      location: { lat: 40.7128, lon: -74.0060, name: 'Test City', source: 'geolocation' },
      isLoading: false,
      permissionStatus: 'granted',
      hasRequestedPermission: false,
      canRequestLocation: true,
      isLocationSupported: true,
      hasLocationPermission: true,
      requestLocation: jest.fn(),
      setManualLocation: jest.fn(),
      clearLocation: jest.fn()
    })

    mockUseUnitPreferences.mockReturnValue({
      preferences: { temperature: 'celsius', windSpeed: 'km/h', distance: 'km', pace: 'min/km' },
      isLoading: false,
      updatePreferences: jest.fn(),
      setDistanceUnit: jest.fn(),
      toggleUnits: jest.fn()
    })
  })

  it('renders loading state', () => {
    mockUseWeather.mockReturnValue({
      weather: null,
      forecast: null,
      impact: null,
      optimalTime: null,
      isLoading: true,
      error: null,
      refetch: jest.fn()
    })

    renderWithQueryClient(<WeatherWidgetEnhanced />)
    
    expect(screen.getByText('Weather')).toBeInTheDocument()
    expect(screen.getByText('🌡️')).toBeInTheDocument()
  })

  it('renders error state', () => {
    mockUseWeather.mockReturnValue({
      weather: null,
      forecast: null,
      impact: null,
      optimalTime: null,
      isLoading: false,
      error: new Error('API Error'),
      refetch: jest.fn()
    })

    renderWithQueryClient(<WeatherWidgetEnhanced />)
    
    expect(screen.getByText('Weather')).toBeInTheDocument()
    expect(screen.getByText('Unable to load weather data. Please check your API key.')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('renders weather data with tabs', () => {
    const mockWeather = createMockWeatherData()
    const mockImpact = createMockWeatherImpact()
    const mockOptimalTime = createMockOptimalTime()

    mockUseWeather.mockReturnValue({
      weather: mockWeather,
      forecast: mockWeather,
      impact: mockImpact,
      optimalTime: mockOptimalTime,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    })

    renderWithQueryClient(<WeatherWidgetEnhanced />)
    
    expect(screen.getByText('Weather')).toBeInTheDocument()
    expect(screen.getByText('Test City')).toBeInTheDocument()
    expect(screen.getByTestId('tabs')).toBeInTheDocument()
    expect(screen.getByTestId('tab-trigger-today')).toBeInTheDocument()
    expect(screen.getByTestId('tab-trigger-tomorrow')).toBeInTheDocument()
  })

  it('displays current weather conditions', () => {
    const mockWeather = createMockWeatherData()
    const mockImpact = createMockWeatherImpact()
    const mockOptimalTime = createMockOptimalTime()

    mockUseWeather.mockReturnValue({
      weather: mockWeather,
      forecast: mockWeather,
      impact: mockImpact,
      optimalTime: mockOptimalTime,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    })

    renderWithQueryClient(<WeatherWidgetEnhanced />)
    
    expect(screen.getByText('20°C')).toBeInTheDocument()
    expect(screen.getByText('65%')).toBeInTheDocument()
    expect(screen.getByText('10 km/h')).toBeInTheDocument()
  })

  it('displays weather impact information', () => {
    const mockWeather = createMockWeatherData()
    const mockImpact = createMockWeatherImpact()
    const mockOptimalTime = createMockOptimalTime()

    mockUseWeather.mockReturnValue({
      weather: mockWeather,
      forecast: mockWeather,
      impact: mockImpact,
      optimalTime: mockOptimalTime,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    })

    renderWithQueryClient(<WeatherWidgetEnhanced />)
    
    expect(screen.getByText('Running Impact')).toBeInTheDocument()
    expect(screen.getByText('low risk')).toBeInTheDocument()
    expect(screen.getByText('Performance')).toBeInTheDocument()
    expect(screen.getByText('positive')).toBeInTheDocument()
  })

  it('displays optimal running time', () => {
    const mockWeather = createMockWeatherData()
    const mockImpact = createMockWeatherImpact()
    const mockOptimalTime = createMockOptimalTime()

    mockUseWeather.mockReturnValue({
      weather: mockWeather,
      forecast: mockWeather,
      impact: mockImpact,
      optimalTime: mockOptimalTime,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    })

    renderWithQueryClient(<WeatherWidgetEnhanced />)
    
    expect(screen.getByText('Best Time to Run')).toBeInTheDocument()
    expect(screen.getByText('6:00 AM')).toBeInTheDocument()
  })

  it('shows location settings button', () => {
    const mockWeather = createMockWeatherData()
    const mockImpact = createMockWeatherImpact()
    const mockOptimalTime = createMockOptimalTime()

    mockUseWeather.mockReturnValue({
      weather: mockWeather,
      forecast: mockWeather,
      impact: mockImpact,
      optimalTime: mockOptimalTime,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    })

    renderWithQueryClient(<WeatherWidgetEnhanced />)
    
    expect(screen.getByText('⚙️')).toBeInTheDocument()
  })

  it('can disable forecast tabs', () => {
    const mockWeather = createMockWeatherData()
    const mockImpact = createMockWeatherImpact()
    const mockOptimalTime = createMockOptimalTime()

    mockUseWeather.mockReturnValue({
      weather: mockWeather,
      forecast: mockWeather,
      impact: mockImpact,
      optimalTime: mockOptimalTime,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    })

    renderWithQueryClient(<WeatherWidgetEnhanced showForecastTabs={false} />)
    
    expect(screen.queryByTestId('tabs')).not.toBeInTheDocument()
    expect(screen.getByText("Today's Running Forecast")).toBeInTheDocument()
  })

  it('shows location permission prompt when needed', () => {
    mockUseLocation.mockReturnValue({
      location: { lat: 0, lon: 0, name: 'Unknown', source: 'default' },
      isLoading: false,
      permissionStatus: 'prompt',
      hasRequestedPermission: false,
      canRequestLocation: true,
      isLocationSupported: true,
      hasLocationPermission: false,
      requestLocation: jest.fn(),
      setManualLocation: jest.fn(),
      clearLocation: jest.fn()
    })

    mockUseWeather.mockReturnValue({
      weather: null,
      forecast: null,
      impact: null,
      optimalTime: null,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    })

    renderWithQueryClient(<WeatherWidgetEnhanced showLocationPrompt={true} />)
    
    expect(screen.getByTestId('location-permission-prompt')).toBeInTheDocument()
  })

  it('displays hourly breakdown in tabs', () => {
    const mockWeather = createMockWeatherData()
    const mockImpact = createMockWeatherImpact()
    const mockOptimalTime = createMockOptimalTime()

    mockUseWeather.mockReturnValue({
      weather: mockWeather,
      forecast: mockWeather,
      impact: mockImpact,
      optimalTime: mockOptimalTime,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    })

    renderWithQueryClient(<WeatherWidgetEnhanced />)
    
    expect(screen.getByText('Hourly Breakdown')).toBeInTheDocument()
    expect(screen.getByText('🕐')).toBeInTheDocument()
  })

  it('displays running recommendations in tabs', () => {
    const mockWeather = createMockWeatherData()
    const mockImpact = createMockWeatherImpact()
    const mockOptimalTime = createMockOptimalTime()

    mockUseWeather.mockReturnValue({
      weather: mockWeather,
      forecast: mockWeather,
      impact: mockImpact,
      optimalTime: mockOptimalTime,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    })

    renderWithQueryClient(<WeatherWidgetEnhanced />)
    
    expect(screen.getByText('Running Recommendations')).toBeInTheDocument()
    expect(screen.getByText('Best Time')).toBeInTheDocument()
    expect(screen.getByText('6:00 AM')).toBeInTheDocument()
  })

  it('handles missing forecast data gracefully', () => {
    const mockWeather = createMockWeatherData()
    // Remove forecast data
    mockWeather.forecast.hourly = []

    mockUseWeather.mockReturnValue({
      weather: mockWeather,
      forecast: mockWeather,
      impact: null,
      optimalTime: null,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    })

    renderWithQueryClient(<WeatherWidgetEnhanced />)
    
    // Should still render the component but with empty forecast data
    expect(screen.getByText('Weather')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const mockWeather = createMockWeatherData()
    const mockImpact = createMockWeatherImpact()
    const mockOptimalTime = createMockOptimalTime()

    mockUseWeather.mockReturnValue({
      weather: mockWeather,
      forecast: mockWeather,
      impact: mockImpact,
      optimalTime: mockOptimalTime,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    })

    const { container } = renderWithQueryClient(
      <WeatherWidgetEnhanced className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('can hide impact and optimal time sections', () => {
    const mockWeather = createMockWeatherData()

    mockUseWeather.mockReturnValue({
      weather: mockWeather,
      forecast: mockWeather,
      impact: null,
      optimalTime: null,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    })

    renderWithQueryClient(
      <WeatherWidgetEnhanced showImpact={false} showOptimalTime={false} />
    )
    
    expect(screen.queryByText('Running Impact')).not.toBeInTheDocument()
    expect(screen.queryByText('Best Time to Run')).not.toBeInTheDocument()
  })

  it('displays precipitation when present', () => {
    const mockWeather = createMockWeatherData()
    // Add precipitation to the current weather
    mockWeather.current.precipitation = 2.5

    mockUseWeather.mockReturnValue({
      weather: mockWeather,
      forecast: mockWeather,
      impact: null,
      optimalTime: null,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    })

    renderWithQueryClient(<WeatherWidgetEnhanced />)
    
    expect(screen.getByText('2.5mm')).toBeInTheDocument()
  })

  it('formats dates correctly in tabs', () => {
    const mockWeather = createMockWeatherData()
    const mockImpact = createMockWeatherImpact()
    const mockOptimalTime = createMockOptimalTime()

    mockUseWeather.mockReturnValue({
      weather: mockWeather,
      forecast: mockWeather,
      impact: mockImpact,
      optimalTime: mockOptimalTime,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    })

    renderWithQueryClient(<WeatherWidgetEnhanced />)
    
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    expect(screen.getByText(today.toLocaleDateString('en-US', { weekday: 'long' }))).toBeInTheDocument()
    expect(screen.getByText(tomorrow.toLocaleDateString('en-US', { weekday: 'long' }))).toBeInTheDocument()
  })
}) 

  describe('Compact Mode', () => {
    it('should render compact forecast tabs when compact mode is enabled', () => {
      const mockWeather = {
        current: {
          temperature: 20,
          feelsLike: 22,
          humidity: 65,
          windSpeed: 15,
          precipitation: 0,
          weatherCondition: 'clear'
        },
        location: {
          name: 'Test Location',
          country: 'US',
          lat: 40.7128,
          lon: -74.0060,
          timezone: 'America/New_York'
        }
      }

      const mockForecast = {
        forecast: {
          hourly: [
            // Today's forecast
            {
              time: new Date().toISOString(),
              temperature: 18,
              humidity: 60,
              windSpeed: 10,
              precipitation: 0
            },
            // Tomorrow's forecast
            {
              time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              temperature: 22,
              humidity: 55,
              windSpeed: 8,
              precipitation: 0
            }
          ]
        }
      }

      render(
        <WeatherWidgetEnhanced 
          compact={true}
          showForecastTabs={false}
        />
      )

      // Should show compact forecast tabs
      expect(screen.getByText('Today')).toBeInTheDocument()
      expect(screen.getByText('Tomorrow')).toBeInTheDocument()
    })

    it('should switch between today and tomorrow views in compact mode', () => {
      render(
        <WeatherWidgetEnhanced 
          compact={true}
          showForecastTabs={false}
        />
      )

      // Initially shows Today tab
      expect(screen.getByText('Today')).toBeInTheDocument()
      expect(screen.getByText('Tomorrow')).toBeInTheDocument()

      // Click Tomorrow tab
      const tomorrowTab = screen.getByText('Tomorrow')
      fireEvent.click(tomorrowTab)

      // Should show tomorrow's content
      expect(screen.getByText(/Tomorrow's Running Conditions/)).toBeInTheDocument()
    })

    it('should not show full forecast tabs when compact mode is enabled', () => {
      render(
        <WeatherWidgetEnhanced 
          compact={true}
          showForecastTabs={true}
        />
      )

      // Should show compact tabs, not full forecast tabs
      expect(screen.getByText('Today')).toBeInTheDocument()
      expect(screen.getByText('Tomorrow')).toBeInTheDocument()
      
      // Should not show the full forecast tabs with icons
      expect(screen.queryByText(/Today/)).toBeInTheDocument()
      expect(screen.queryByText(/Tomorrow/)).toBeInTheDocument()
    })
  }) 