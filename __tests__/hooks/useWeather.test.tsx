import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useWeather, useLocationWeather } from '@/hooks/useWeather'
import { WeatherService } from '@/lib/weather/service'

// Mock the weather service
jest.mock('@/lib/weather/service', () => ({
  WeatherService: jest.fn().mockImplementation(() => ({
    getCurrentWeather: jest.fn(),
    getForecast: jest.fn(),
    analyzeRunningImpact: jest.fn(),
    getOptimalRunningTime: jest.fn()
  }))
}))
const MockWeatherService = WeatherService as jest.MockedClass<typeof WeatherService>

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

describe('useWeather', () => {
  let queryClient: QueryClient

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
    MockWeatherService.prototype.getCurrentWeather = jest.fn()
    MockWeatherService.prototype.getForecast = jest.fn()
    MockWeatherService.prototype.analyzeRunningImpact = jest.fn()
    MockWeatherService.prototype.getOptimalRunningTime = jest.fn()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  describe('useWeather', () => {
    it('should return weather data when coordinates are provided', async () => {
      const mockWeatherData = {
        location: { name: 'London', country: 'GB', lat: 51.5074, lon: -0.1278, timezone: '0' },
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
        forecast: { hourly: [], daily: [] }
      }

      const mockImpact = {
        performance: 'positive' as const,
        risk: 'low' as const,
        recommendations: ['Optimal temperature for running'],
        adjustments: {
          intensity: 0,
          duration: 0,
          route: [],
          clothing: [],
          hydration: []
        }
      }

      const mockOptimalTime = {
        time: '6:00 AM',
        reason: 'Best conditions: comfortable temperature, low humidity'
      }

          MockWeatherService.prototype.getCurrentWeather.mockResolvedValue(mockWeatherData)
    MockWeatherService.prototype.getForecast.mockResolvedValue(mockWeatherData)
    MockWeatherService.prototype.analyzeRunningImpact.mockReturnValue(mockImpact)
    MockWeatherService.prototype.getOptimalRunningTime.mockReturnValue(mockOptimalTime)

      const { result } = renderHook(
        () => useWeather({ lat: 51.5074, lon: -0.1278 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.weather).toEqual(mockWeatherData)
      expect(result.current.impact).toEqual(mockImpact)
      expect(result.current.optimalTime).toEqual(mockOptimalTime)
      expect(result.current.error).toBeNull()
    })

    it('should return error when coordinates are invalid', async () => {
      const { result } = renderHook(
        () => useWeather({ lat: NaN, lon: NaN }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.weather).toBeNull()
    })

    it('should not fetch when disabled', () => {
      const { result } = renderHook(
        () => useWeather({ lat: 51.5074, lon: -0.1278, enabled: false }),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(false)
      expect(result.current.weather).toBeNull()
    })
  })

  describe('useLocationWeather', () => {
    it('should get location and fetch weather', async () => {
      const mockPosition = {
        coords: {
          latitude: 51.5074,
          longitude: -0.1278,
          accuracy: 100,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      }

      const mockWeatherData = {
        location: { name: 'London', country: 'GB', lat: 51.5074, lon: -0.1278, timezone: '0' },
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
        forecast: { hourly: [], daily: [] }
      }

      const mockImpact = {
        performance: 'positive' as const,
        risk: 'low' as const,
        recommendations: ['Optimal temperature for running'],
        adjustments: {
          intensity: 0,
          duration: 0,
          route: [],
          clothing: [],
          hydration: []
        }
      }

      MockWeatherService.prototype.getCurrentWeather.mockResolvedValue(mockWeatherData)
      MockWeatherService.prototype.getForecast.mockResolvedValue(mockWeatherData)
      MockWeatherService.prototype.analyzeRunningImpact.mockReturnValue(mockImpact)

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition)
      })

      const { result } = renderHook(() => useLocationWeather(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      }, { timeout: 3000 })

      expect(result.current.weather).toEqual(mockWeatherData)
      expect(result.current.impact).toEqual(mockImpact)
    })

    it('should handle geolocation error', async () => {
      const mockError = new Error('Geolocation permission denied')

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError)
      })

      const { result } = renderHook(() => useLocationWeather(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      }, { timeout: 3000 })

      expect(result.current.weather).toBeNull()
      expect(result.current.error).toBeNull() // Hook doesn't expose geolocation errors
    })
  })
}) 