import { NextRequest, NextResponse } from 'next/server'
import { WeatherService } from '@/lib/weather/service'
import { requireAuth } from '@/lib/auth/server'

const weatherService = new WeatherService(process.env.OPENWEATHER_API_KEY || '')

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth()
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')
    const type = searchParams.get('type') || 'current' // 'current' or 'forecast'

    // Validate parameters
    if (!lat || !lon) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    const latitude = parseFloat(lat)
    const longitude = parseFloat(lon)

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: 'Invalid latitude or longitude' },
        { status: 400 }
      )
    }

    // Get weather data
    let weatherData
    if (type === 'forecast') {
      weatherData = await weatherService.getForecast(latitude, longitude, 5)
    } else {
      weatherData = await weatherService.getCurrentWeather(latitude, longitude)
    }

    // Analyze impact on running
    const impact = weatherService.analyzeRunningImpact({
      temperature: weatherData.current.temperature,
      humidity: weatherData.current.humidity,
      windSpeed: weatherData.current.windSpeed,
      windDirection: weatherData.current.windDirection,
      precipitation: weatherData.current.precipitation,
      uvIndex: weatherData.current.uvIndex,
      airQuality: weatherData.current.airQuality,
      feelsLike: weatherData.current.feelsLike,
      dewPoint: weatherData.current.dewPoint,
      weatherCondition: weatherData.current.weatherCondition
    })

    // Get optimal running time if forecast is available
    let optimalTime = null
    if (type === 'forecast') {
      optimalTime = weatherService.getOptimalRunningTime(weatherData)
    }

    return NextResponse.json({
      weather: weatherData,
      impact,
      optimalTime,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Weather API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    )
  }
} 