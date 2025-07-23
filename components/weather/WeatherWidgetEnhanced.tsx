'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Thermometer, Droplets, Wind, CloudRain, Sun, AlertTriangle, MapPin, Settings, Navigation, Clock, Zap } from 'lucide-react'
import { useWeather } from '@/hooks/useWeather'
import { useLocation } from '@/hooks/useLocation'
import { useUnitPreferences } from '@/hooks/useUnitPreferences'
import { formatTemperature, formatWindSpeed } from '@/lib/utils'
import { LocationPermissionPrompt } from './LocationPermissionPrompt'

interface WeatherWidgetEnhancedProps {
  className?: string
  showImpact?: boolean
  showLocationPrompt?: boolean
  showForecastTabs?: boolean
}

export function WeatherWidgetEnhanced({ 
  className = '', 
  showImpact = true,
  showLocationPrompt = true,
  showForecastTabs = true
}: WeatherWidgetEnhancedProps) {
  const [showLocationInput, setShowLocationInput] = useState(false)
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false)
  const { preferences } = useUnitPreferences()
  const { 
    location, 
    isLoading: locationLoading,
    permissionStatus,
    hasLocationPermission,
    requestLocation,
    setManualLocation 
  } = useLocation()

  const { weather, impact, isLoading, error, forecast } = useWeather({ 
    lat: location.lat, 
    lon: location.lon,
    enabled: !locationLoading
  })

  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const lat = parseFloat(formData.get('latitude') as string)
    const lon = parseFloat(formData.get('longitude') as string)
    const name = formData.get('locationName') as string

    if (!isNaN(lat) && !isNaN(lon)) {
      setManualLocation(lat, lon, name)
      setShowLocationInput(false)
    }
  }

  const handleRequestLocation = async () => {
    try {
      await requestLocation()
      setShowPermissionPrompt(false)
    } catch (error) {
      console.error('Failed to get location:', error)
    }
  }

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'clear':
        return <Sun className="h-5 w-5 text-yellow-500" />
      case 'rain':
      case 'drizzle':
        return <CloudRain className="h-5 w-5 text-blue-500" />
      case 'snow':
        return <CloudRain className="h-5 w-5 text-blue-300" />
      case 'clouds':
        return <CloudRain className="h-5 w-5 text-gray-500" />
      default:
        return <Thermometer className="h-5 w-5" />
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'positive':
        return 'text-green-600'
      case 'negative':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getLocationSourceIcon = () => {
    switch (location.source) {
      case 'geolocation':
        return <Navigation className="h-3 w-3" />
      case 'manual':
        return <MapPin className="h-3 w-3" />
      case 'saved':
        return <MapPin className="h-3 w-3" />
      default:
        return <MapPin className="h-3 w-3" />
    }
  }

  const getLocationSourceText = () => {
    switch (location.source) {
      case 'geolocation':
        return 'Your Location'
      case 'manual':
        return 'Manual'
      case 'saved':
        return 'Saved'
      default:
        return 'Default'
    }
  }

  const getTodayAndTomorrowForecast = () => {
    if (!forecast?.forecast?.hourly) return { today: [], tomorrow: [] }

    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayForecast = forecast.forecast.hourly.filter(hour => {
      const hourDate = new Date(hour.time)
      return hourDate.toDateString() === today.toDateString()
    })

    const tomorrowForecast = forecast.forecast.hourly.filter(hour => {
      const hourDate = new Date(hour.time)
      return hourDate.toDateString() === tomorrow.toDateString()
    })

    return { today: todayForecast, tomorrow: tomorrowForecast }
  }

  // Consolidated running score calculation
  const calculateRunningScore = (temp: number, humidity: number, wind: number, precip: number) => {
    let score = 100
    
    // Temperature scoring (optimal: 10-20°C)
    if (temp < 5 || temp > 30) score -= 40
    else if (temp < 10 || temp > 25) score -= 20
    else if (temp >= 10 && temp <= 20) score += 10
    
    // Humidity scoring (optimal: 40-70%)
    if (humidity > 85) score -= 25
    else if (humidity > 75) score -= 15
    else if (humidity >= 40 && humidity <= 70) score += 5
    
    // Wind scoring (optimal: < 20 km/h)
    if (wind > 30) score -= 30
    else if (wind > 20) score -= 15
    else if (wind <= 15) score += 5
    
    // Precipitation scoring
    if (precip > 5) score -= 40
    else if (precip > 2) score -= 25
    else if (precip > 0.5) score -= 10
    
    return Math.max(0, score)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreText = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Poor'
  }

  const renderTodayForecast = () => {
    const { today: todayForecast } = getTodayAndTomorrowForecast()
    if (!todayForecast || todayForecast.length === 0) return null

    // Get today's best running time
    const runningHours = todayForecast.filter(hour => {
      const hourDate = new Date(hour.time)
      const hourOfDay = hourDate.getHours()
      return hourOfDay >= 5 && hourOfDay <= 21
    })

    const scoredHours = runningHours.map(hour => ({
      ...hour,
      score: calculateRunningScore(hour.temperature, hour.humidity, hour.windSpeed, hour.precipitation)
    }))

    const bestHour = scoredHours.sort((a, b) => b.score - a.score)[0]
    
    if (!bestHour || !weather) return null

    const { current } = weather
    const currentRunningScore = calculateRunningScore(
      current.temperature, 
      current.humidity, 
      current.windSpeed, 
      current.precipitation
    )

    return (
      <div className="space-y-3">
        {/* Current Conditions Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-red-500" />
            <span className="text-sm">
              {formatTemperature(current.temperature, preferences.temperature)}
              {current.feelsLike !== current.temperature && (
                <span className="text-gray-500 ml-1">
                  (feels {formatTemperature(current.feelsLike, preferences.temperature)})
                </span>
              )}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-500" />
            <span className="text-sm">{current.humidity}%</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-gray-500" />
            <span className="text-sm">{formatWindSpeed(current.windSpeed, preferences.windSpeed)}</span>
          </div>
          
          {current.precipitation > 0 && (
            <div className="flex items-center gap-2">
              <CloudRain className="h-4 w-4 text-blue-500" />
              <span className="text-sm">{current.precipitation}mm</span>
            </div>
          )}
        </div>

        {/* Current Running Conditions */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Current Running Conditions</span>
            <Badge 
              variant="outline" 
              className={getRiskColor(impact?.risk || 'medium')}
            >
              {impact?.risk || 'medium'} risk
            </Badge>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-gray-600">Running Score</span>
            <div className="text-right">
              <span className={`text-lg font-semibold ${getScoreColor(currentRunningScore)}`}>
                {currentRunningScore}%
              </span>
              <div className="text-xs text-gray-500">{getScoreText(currentRunningScore)}</div>
            </div>
          </div>
        </div>

        {/* Training Impact */}
        {showImpact && impact && (
          <div className="pt-3 border-t">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Training Impact</span>
                <span className={`text-sm font-medium ${getPerformanceColor(impact.performance)}`}>
                  {impact.performance}
                </span>
              </div>
              
              {impact.adjustments.intensity !== 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Intensity Adjustment</span>
                  <span className={`text-sm font-medium ${
                    impact.adjustments.intensity > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {impact.adjustments.intensity > 0 ? '+' : ''}{impact.adjustments.intensity}
                  </span>
                </div>
              )}

              {/* Single consolidated recommendation */}
              {impact.recommendations.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-blue-800 mb-1">Key Recommendation:</div>
                  <div className="text-sm text-blue-700">
                    {impact.recommendations[0]}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderTomorrowForecast = () => {
    const { tomorrow: tomorrowForecast } = getTodayAndTomorrowForecast()
    if (!tomorrowForecast || tomorrowForecast.length === 0) return null

    // Get tomorrow's forecast for specific times: 6am, 12pm, 6pm
    const getClosestHourForecast = (targetHour: number) => {
      // First try to find exact hour match
      const exactMatch = tomorrowForecast.find(hour => {
        const hourDate = new Date(hour.time)
        return hourDate.getHours() === targetHour
      })
      
      if (exactMatch) return exactMatch

      // If no exact match, find the closest hour
      let closestHour = null
      let minDifference = Infinity

      tomorrowForecast.forEach(hour => {
        const hourDate = new Date(hour.time)
        const hourOfDay = hourDate.getHours()
        const difference = Math.abs(hourOfDay - targetHour)
        
        if (difference < minDifference) {
          minDifference = difference
          closestHour = hour
        }
      })

      return closestHour
    }

    const sixAM = getClosestHourForecast(6)
    const twelvePM = getClosestHourForecast(12)
    const sixPM = getClosestHourForecast(18)

    const renderTimeSlot = (time: string, forecast: {
      time: string;
      temperature: number;
      humidity: number;
      windSpeed: number;
      precipitation: number;
      weatherCondition: string;
    } | null, label: string) => {
      if (!forecast) {
        return (
          <div key={time} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg opacity-50">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">{label}</span>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold text-gray-400">{time}</div>
              <div className="text-xs text-gray-400">No data</div>
            </div>
          </div>
        )
      }

      const score = calculateRunningScore(forecast.temperature, forecast.humidity, forecast.windSpeed, forecast.precipitation)
      const actualTime = new Date(forecast.time).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
      
      return (
        <div key={time} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">{label}</span>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold text-blue-800">{actualTime}</div>
            <div className="text-xs text-gray-500">
              {formatTemperature(forecast.temperature, preferences.temperature)} • {forecast.humidity}%
            </div>
            <div className={`text-xs font-medium ${getScoreColor(score)}`}>
              {score}% • {getScoreText(score)}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {/* Tomorrow's Conditions Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-red-500" />
            <span className="text-sm">
              {formatTemperature(Math.max(...tomorrowForecast.map(h => h.temperature)), preferences.temperature)} / 
              {formatTemperature(Math.min(...tomorrowForecast.map(h => h.temperature)), preferences.temperature)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-500" />
            <span className="text-sm">
              {Math.round(tomorrowForecast.reduce((sum, h) => sum + h.humidity, 0) / tomorrowForecast.length)}%
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-gray-500" />
            <span className="text-sm">
              {formatWindSpeed(tomorrowForecast.reduce((sum, h) => sum + h.windSpeed, 0) / tomorrowForecast.length, preferences.windSpeed)}
            </span>
          </div>
          
          {tomorrowForecast.some(h => h.precipitation > 0) && (
            <div className="flex items-center gap-2">
              <CloudRain className="h-4 w-4 text-blue-500" />
              <span className="text-sm">
                {Math.max(...tomorrowForecast.map(h => h.precipitation))}mm
              </span>
            </div>
          )}
        </div>

        {/* Tomorrow's Running Times */}
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-blue-700">Tomorrow&apos;s Running Times</span>
            <Zap className="h-4 w-4 text-yellow-500" />
          </div>
          
          <div className="space-y-2">
            {renderTimeSlot('6:00 AM', sixAM, 'Early Morning')}
            {renderTimeSlot('12:00 PM', twelvePM, 'Midday')}
            {renderTimeSlot('6:00 PM', sixPM, 'Evening')}
          </div>
        </div>
      </div>
    )
  }

  // Show location permission prompt if enabled and needed
  if (showLocationPrompt && showPermissionPrompt && !hasLocationPermission && permissionStatus === 'prompt') {
    return (
      <LocationPermissionPrompt
        className={className}
        onLocationGranted={() => setShowPermissionPrompt(false)}
        onDismiss={() => setShowPermissionPrompt(false)}
      />
    )
  }

  // Show location input form
  if (showLocationInput) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Set Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLocationSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="locationName">Location Name</Label>
              <Input
                id="locationName"
                name="locationName"
                defaultValue={location.name}
                placeholder="e.g., Home, Work, Gym"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  name="latitude"
                  type="number"
                  step="any"
                  defaultValue={location.lat}
                  placeholder="51.5074"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  name="longitude"
                  type="number"
                  step="any"
                  defaultValue={location.lon}
                  placeholder="-0.1278"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button type="submit" size="sm">
                Save Location
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setShowLocationInput(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  if (locationLoading || isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5" />
            Weather
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5" />
            Weather
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Unable to load weather data. Please check your API key.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!weather) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5" />
            Weather
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            <p>Weather data unavailable</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { current } = weather

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {getWeatherIcon(current.weatherCondition)}
          Weather
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1 text-sm font-normal text-gray-500">
              {getLocationSourceIcon()}
              <span>{location.name}</span>
              <Badge variant="outline" className="text-xs">
                {getLocationSourceText()}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLocationInput(true)}
              className="h-6 w-6 p-0"
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Forecast Tabs */}
        {showForecastTabs && forecast?.forecast?.hourly && (
          <div className="pt-3 border-t">
            <Tabs defaultValue="today" className="w-full">
              <TabsList className="flex w-full h-8 bg-gray-100 rounded-md p-1">
                <TabsTrigger value="today" className="text-xs flex-1">
                  Today
                </TabsTrigger>
                <TabsTrigger value="tomorrow" className="text-xs flex-1">
                  Tomorrow
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="today" className="mt-3">
                {renderTodayForecast()}
              </TabsContent>
              
              <TabsContent value="tomorrow" className="mt-3">
                {renderTomorrowForecast()}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Location Permission Prompt */}
        {showLocationPrompt && !hasLocationPermission && permissionStatus === 'prompt' && (
          <div className="pt-2 border-t">
            <div className="text-sm text-gray-600 mb-2">
              Get weather for your location?
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleRequestLocation}
                className="flex-1"
              >
                Allow Location
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowLocationInput(true)}
              >
                Set Manually
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 