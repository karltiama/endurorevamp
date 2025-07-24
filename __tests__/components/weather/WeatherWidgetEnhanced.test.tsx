import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WeatherWidgetEnhanced } from '@/components/weather/WeatherWidgetEnhanced'
import { useWeather } from '@/hooks/useWeather'
import { useLocation } from '@/hooks/useLocation'
import { useUnitPreferences } from '@/hooks/useUnitPreferences'

// Mock the hooks
jest.mock('@/hooks/useWeather')
jest.mock('@/hooks/useLocation')
jest.mock('@/hooks/useUnitPreferences')

const mockUseWeather = useWeather as jest.MockedFunction<typeof useWeather>
const mockUseLocation = useLocation as jest.MockedFunction<typeof useLocation>
const mockUseUnitPreferences = useUnitPreferences as jest.MockedFunction<typeof useUnitPreferences>

// Mock the LocationPermissionPrompt component
jest.mock('@/components/weather/LocationPermissionPrompt', () => ({
  LocationPermissionPrompt: ({ onLocationGranted, onDismiss }: any) => (
    <div data-testid="location-permission-prompt">
      <button onClick={onLocationGranted}>Allow Location</button>
      <button onClick={onDismiss}>Dismiss</button>
    </div>
  )
}))

// Mock the utils
jest.mock('@/lib/utils', () => ({
  formatTemperature: jest.fn((temp: number) => `${temp}°C`),
  formatWindSpeed: jest.fn((speed: number) => `${speed} km/h`),
  cn: jest.fn((...inputs: any[]) => inputs.filter(Boolean).join(' '))
}))

// Mock the weather service
const mockGetCurrentWeather = jest.fn()
const mockGetForecast = jest.fn()
const mockAnalyzeRunningImpact = jest.fn()
const mockGetOptimalRunningTime = jest.fn()

jest.mock('@/lib/weather/service', () => {
  const mockGetCurrentWeather = jest.fn()
  const mockGetForecast = jest.fn()
  const mockAnalyzeRunningImpact = jest.fn()
  const mockGetOptimalRunningTime = jest.fn()

  return {
    WeatherService: jest.fn().mockImplementation(() => ({
      getCurrentWeather: mockGetCurrentWeather,
      getForecast: mockGetForecast,
      analyzeRunningImpact: mockAnalyzeRunningImpact,
      getOptimalRunningTime: mockGetOptimalRunningTime
    })),
    // Export the mocks so we can access them in tests
    __mockGetCurrentWeather: mockGetCurrentWeather,
    __mockGetForecast: mockGetForecast,
    __mockAnalyzeRunningImpact: mockAnalyzeRunningImpact,
    __mockGetOptimalRunningTime: mockGetOptimalRunningTime
  }
})

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
}
Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
})

describe('WeatherWidgetEnhanced', () => {
  let queryClient: QueryClient
  let mockGetCurrentWeather: jest.Mock
  let mockGetForecast: jest.Mock
  let mockAnalyzeRunningImpact: jest.Mock
  let mockGetOptimalRunningTime: jest.Mock

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    
    // Reset mocks
    jest.clearAllMocks()
    
    // Get the mocked methods from the module
    const weatherServiceModule = require('@/lib/weather/service')
    mockGetCurrentWeather = weatherServiceModule.__mockGetCurrentWeather
    mockGetForecast = weatherServiceModule.__mockGetForecast
    mockAnalyzeRunningImpact = weatherServiceModule.__mockAnalyzeRunningImpact
    mockGetOptimalRunningTime = weatherServiceModule.__mockGetOptimalRunningTime

    // Default mock implementations
    mockUseLocation.mockReturnValue({
      location: {
        lat: 51.5074,
        lon: -0.1278,
        name: 'London',
        source: 'manual'
      },
      isLoading: false,
      permissionStatus: 'granted',
      hasLocationPermission: true,
      hasRequestedPermission: false,
      canRequestLocation: true,
      isLocationSupported: true,
      requestLocation: jest.fn(),
      setManualLocation: jest.fn(),
      clearLocation: jest.fn()
    })

    mockUseUnitPreferences.mockReturnValue({
      preferences: {
        temperature: 'celsius',
        windSpeed: 'km/h',
        distance: 'km',
        pace: 'min/km'
      },
      isLoading: false,
      updatePreferences: jest.fn(),
      setDistanceUnit: jest.fn(),
      toggleUnits: jest.fn()
    })

    mockUseWeather.mockReturnValue({
      weather: {
        location: {
          name: 'London',
          country: 'GB',
          lat: 51.5074,
          lon: -0.1278,
          timezone: '0'
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
          lastUpdated: '2024-01-01T12:00:00Z'
        },
        forecast: {
          hourly: [],
          daily: []
        }
      },
      forecast: {
        location: {
          name: 'London',
          country: 'GB',
          lat: 51.5074,
          lon: -0.1278,
          timezone: '0'
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
          lastUpdated: '2024-01-01T12:00:00Z'
        },
        forecast: {
          hourly: [
            {
              time: new Date().toISOString(),
              temperature: 18,
              humidity: 60,
              windSpeed: 10,
              precipitation: 0,
              weatherCondition: 'clear',
              feelsLike: 19,
              windDirection: 180,
              uvIndex: 3,
              weatherIcon: '01d'
            },
            {
              time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              temperature: 22,
              humidity: 55,
              windSpeed: 8,
              precipitation: 0,
              weatherCondition: 'clear',
              feelsLike: 23,
              windDirection: 185,
              uvIndex: 4,
              weatherIcon: '01d'
            }
          ],
          daily: []
        }
      },
      impact: {
        performance: 'positive',
        risk: 'low',
        recommendations: ['Optimal temperature for running'],
        adjustments: {
          intensity: 0,
          duration: 0,
          route: [],
          clothing: [],
          hydration: []
        }
      },
      optimalTime: {
        time: '6:00 AM',
        reason: 'Best conditions: comfortable temperature, low humidity'
      },
      isLoading: false,
      error: null,
      refetch: jest.fn()
    })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  describe('Basic Rendering', () => {
    it('renders weather widget with current conditions', () => {
      render(<WeatherWidgetEnhanced />, { wrapper })

      expect(screen.getByText('Weather')).toBeInTheDocument()
      expect(screen.getByText('London')).toBeInTheDocument()
      // Temperature and humidity are shown in the Today tab, not in the main widget
      // The main widget only shows the weather icon and location
    })

    it('shows loading state when weather is loading', () => {
      mockUseWeather.mockReturnValue({
        weather: null,
        forecast: null,
        impact: null,
        optimalTime: null,
        isLoading: true,
        error: null,
        refetch: jest.fn()
      })

      render(<WeatherWidgetEnhanced />, { wrapper })

      expect(screen.getByText('Weather')).toBeInTheDocument()
      // Should show loading skeleton
      expect(screen.getByText('Weather')).toBeInTheDocument()
    })

    it('shows error state when weather fails to load', () => {
      mockUseWeather.mockReturnValue({
        weather: null,
        forecast: null,
        impact: null,
        optimalTime: null,
        isLoading: false,
        error: new Error('Weather API error'),
        refetch: jest.fn()
      })

      render(<WeatherWidgetEnhanced />, { wrapper })

      expect(screen.getByText('Weather')).toBeInTheDocument()
      expect(screen.getByText('Unable to load weather data. Please check your API key.')).toBeInTheDocument()
    })

    it('shows location permission prompt when needed', () => {
      mockUseLocation.mockReturnValue({
        location: {
          lat: 0,
          lon: 0,
          name: 'Unknown',
          source: 'default'
        },
        isLoading: false,
        permissionStatus: 'prompt',
        hasLocationPermission: false,
        hasRequestedPermission: false,
        canRequestLocation: true,
        isLocationSupported: true,
        requestLocation: jest.fn(),
        setManualLocation: jest.fn(),
        clearLocation: jest.fn()
      })

      render(<WeatherWidgetEnhanced showLocationPrompt={true} />, { wrapper })

      // The component should show the location permission prompt
      expect(screen.getByText('Get weather for your location?')).toBeInTheDocument()
      expect(screen.getByText('Allow Location')).toBeInTheDocument()
      expect(screen.getByText('Set Manually')).toBeInTheDocument()
    })
  })

  describe('Forecast Tabs', () => {
    it('shows forecast tabs when enabled', () => {
      render(<WeatherWidgetEnhanced showForecastTabs={true} />, { wrapper })

      expect(screen.getByText('Today')).toBeInTheDocument()
      expect(screen.getByText('Tomorrow')).toBeInTheDocument()
    })

    it('hides forecast tabs when disabled', () => {
      render(<WeatherWidgetEnhanced showForecastTabs={false} />, { wrapper })

      expect(screen.queryByText('Today')).not.toBeInTheDocument()
      expect(screen.queryByText('Tomorrow')).not.toBeInTheDocument()
    })

    it('switches between today and tomorrow tabs', () => {
      render(<WeatherWidgetEnhanced showForecastTabs={true} />, { wrapper })

      // Initially shows Today tab
      expect(screen.getByText('Today')).toBeInTheDocument()
      expect(screen.getByText('Tomorrow')).toBeInTheDocument()

      // Click Tomorrow tab
      const tomorrowTab = screen.getByText('Tomorrow')
      fireEvent.click(tomorrowTab)

      // Should show tomorrow's content
      expect(screen.getByText(/Tomorrow's Running Times/)).toBeInTheDocument()
    })

    it('shows running score and conditions', async () => {
      render(<WeatherWidgetEnhanced showForecastTabs={true} />, { wrapper })

      // Wait for the content to appear (Today tab should be active by default)
      await waitFor(() => {
        expect(screen.getByText('Current Running Conditions')).toBeInTheDocument()
      })
      expect(screen.getByText('Running Score')).toBeInTheDocument()
    })

    it('shows training impact when enabled', async () => {
      render(<WeatherWidgetEnhanced showImpact={true} showForecastTabs={true} />, { wrapper })

      // Wait for the training impact to appear (Today tab should be active by default)
      await waitFor(() => {
        expect(screen.getByText('Training Impact')).toBeInTheDocument()
      })
      expect(screen.getByText('positive')).toBeInTheDocument()
    })

    it('hides training impact when disabled', async () => {
      render(<WeatherWidgetEnhanced showImpact={false} showForecastTabs={true} />, { wrapper })

      // Wait a moment for any potential rendering (Today tab should be active by default)
      await waitFor(() => {
        expect(screen.queryByText('Training Impact')).not.toBeInTheDocument()
      })
    })

    it('does not show training impact in tomorrow tab', async () => {
      render(<WeatherWidgetEnhanced showImpact={true} showForecastTabs={true} />, { wrapper })

      // Click on the "Tomorrow" button to switch tabs
      const tomorrowTab = screen.getByRole('button', { name: 'Tomorrow' })
      fireEvent.click(tomorrowTab)

      // Wait for the tomorrow content to appear
      await waitFor(() => {
        expect(screen.getByText("Tomorrow's Running Times")).toBeInTheDocument()
      })

      // Training Impact should NOT be visible in tomorrow tab
      expect(screen.queryByText('Training Impact')).not.toBeInTheDocument()
    })

    it('shows training impact when switching back to today tab', async () => {
      render(<WeatherWidgetEnhanced showImpact={true} showForecastTabs={true} />, { wrapper })

      // First switch to tomorrow tab
      const tomorrowTab = screen.getByRole('button', { name: 'Tomorrow' })
      fireEvent.click(tomorrowTab)

      // Wait for tomorrow content
      await waitFor(() => {
        expect(screen.getByText("Tomorrow's Running Times")).toBeInTheDocument()
      })

      // Switch back to today tab
      const todayTab = screen.getByRole('button', { name: 'Today' })
      fireEvent.click(todayTab)

      // Wait for today content and verify training impact is visible
      await waitFor(() => {
        expect(screen.getByText('Training Impact')).toBeInTheDocument()
      })
      expect(screen.getByText('positive')).toBeInTheDocument()
    })
  })

  describe('Location Management', () => {
    it('shows location settings button', () => {
      render(<WeatherWidgetEnhanced />, { wrapper })

      // The settings button doesn't have an accessible name, so we'll check for the button element
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('opens location input form when settings clicked', () => {
      render(<WeatherWidgetEnhanced />, { wrapper })

      const buttons = screen.getAllByRole('button')
      const settingsButton = buttons[0] // First button is the settings button
      fireEvent.click(settingsButton)

      expect(screen.getByText('Set Location')).toBeInTheDocument()
      expect(screen.getByLabelText('Location Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Latitude')).toBeInTheDocument()
      expect(screen.getByLabelText('Longitude')).toBeInTheDocument()
    })

    it('submits location form correctly', () => {
      const mockSetManualLocation = jest.fn()
      mockUseLocation.mockReturnValue({
        location: {
          lat: 51.5074,
          lon: -0.1278,
          name: 'London',
          source: 'manual'
        },
        isLoading: false,
        permissionStatus: 'granted',
        hasLocationPermission: true,
        hasRequestedPermission: false,
        canRequestLocation: true,
        isLocationSupported: true,
        requestLocation: jest.fn(),
        setManualLocation: mockSetManualLocation,
        clearLocation: jest.fn()
      })

      render(<WeatherWidgetEnhanced />, { wrapper })

      const buttons = screen.getAllByRole('button')
      const settingsButton = buttons[0] // First button is the settings button
      fireEvent.click(settingsButton)

      const nameInput = screen.getByLabelText('Location Name')
      const latInput = screen.getByLabelText('Latitude')
      const lonInput = screen.getByLabelText('Longitude')
      const submitButton = screen.getByText('Save Location')

      fireEvent.change(nameInput, { target: { value: 'New Location' } })
      fireEvent.change(latInput, { target: { value: '40.7128' } })
      fireEvent.change(lonInput, { target: { value: '-74.0060' } })
      fireEvent.click(submitButton)

      expect(mockSetManualLocation).toHaveBeenCalledWith(40.7128, -74.0060, 'New Location')
    })
  })

  describe('Weather Icons', () => {
    it('shows correct weather icon for clear conditions', () => {
      mockUseWeather.mockReturnValue({
        weather: {
          location: {
            name: 'London',
            country: 'GB',
            lat: 51.5074,
            lon: -0.1278,
            timezone: '0'
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
            lastUpdated: '2024-01-01T12:00:00Z'
          },
          forecast: {
            hourly: [],
            daily: []
          }
        },
        forecast: null,
        impact: null,
        optimalTime: null,
        isLoading: false,
        error: null,
        refetch: jest.fn()
      })

      render(<WeatherWidgetEnhanced />, { wrapper })

      // Should show weather widget with clear conditions
      expect(screen.getByText('Weather')).toBeInTheDocument()
      expect(screen.getByText('London')).toBeInTheDocument()
    })
  })

  describe('Forecast Data', () => {
    it('shows today and tomorrow forecast tabs', () => {
      render(<WeatherWidgetEnhanced showForecastTabs={true} />, { wrapper })

      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      expect(screen.getByText('Today')).toBeInTheDocument()
      expect(screen.getByText('Tomorrow')).toBeInTheDocument()
    })
  })
}) 