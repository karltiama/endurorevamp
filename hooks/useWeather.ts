'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { WeatherService } from '@/lib/weather/service'
import type { WeatherData, WeatherImpact, RunningWeatherConditions } from '@/lib/weather/types'

interface UseWeatherOptions {
  lat?: number
  lon?: number
  enabled?: boolean
  staleTime?: number
}

interface UseWeatherReturn {
  weather: WeatherData | null
  forecast: WeatherData | null
  impact: WeatherImpact | null
  optimalTime: { time: string; reason: string } | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

const weatherService = new WeatherService(process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || '')

export function useWeather({ 
  lat, 
  lon, 
  enabled = true, 
  staleTime = 10 * 60 * 1000 // 10 minutes
}: UseWeatherOptions): UseWeatherReturn {
  
  // Get current weather
  const { 
    data: weather, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['weather', 'current', lat, lon],
    queryFn: async () => {
      if (!lat || !lon) {
        throw new Error('Latitude and longitude are required')
      }
      return weatherService.getCurrentWeather(lat, lon)
    },
    enabled: enabled && !!lat && !!lon,
    staleTime,
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: 1000
  })

  // Get weather forecast
  const { data: forecast } = useQuery({
    queryKey: ['weather', 'forecast', lat, lon],
    queryFn: async () => {
      if (!lat || !lon) {
        throw new Error('Latitude and longitude are required')
      }
      return weatherService.getForecast(lat, lon, 5)
    },
    enabled: enabled && !!lat && !!lon,
    staleTime,
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: 1000
  })

  // Calculate weather impact on running
  const impact = weather ? weatherService.analyzeRunningImpact({
    temperature: weather.current.temperature,
    humidity: weather.current.humidity,
    windSpeed: weather.current.windSpeed,
    windDirection: weather.current.windDirection,
    precipitation: weather.current.precipitation,
    uvIndex: weather.current.uvIndex,
    airQuality: weather.current.airQuality,
    feelsLike: weather.current.feelsLike,
    dewPoint: weather.current.dewPoint,
    weatherCondition: weather.current.weatherCondition
  }) : null

  // Get optimal running time
  const optimalTime = forecast ? weatherService.getOptimalRunningTime(forecast) : null

  return {
    weather: weather || null,
    forecast: forecast || null,
    impact,
    optimalTime,
    isLoading,
    error: error as Error | null,
    refetch
  }
}

/**
 * Hook for getting user's location-based weather
 */
export function useLocationWeather(): UseWeatherReturn {
  const [location, setLocation] = React.useState<{ lat: number; lon: number } | null>(null)

  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }, [])

  return useWeather({
    lat: location?.lat,
    lon: location?.lon,
    enabled: !!location
  })
}

/**
 * Hook for getting weather at a specific location
 */
export function useWeatherAtLocation(lat: number, lon: number): UseWeatherReturn {
  return useWeather({ lat, lon })
}

/**
 * Hook for getting weather impact on workout planning
 */
export function useWeatherForWorkout(lat?: number, lon?: number) {
  const { weather, impact, optimalTime, isLoading, error } = useWeather({ lat, lon })

  const weatherConditions = weather ? {
    temperature: weather.current.temperature,
    precipitation: weather.current.precipitation,
    windSpeed: weather.current.windSpeed
  } : undefined

  return {
    weatherConditions,
    impact,
    optimalTime,
    isLoading,
    error
  }
} 