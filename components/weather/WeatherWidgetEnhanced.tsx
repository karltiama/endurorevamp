'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Thermometer, Droplets, Wind, CloudRain, Sun, AlertTriangle, MapPin, Settings, Navigation, Clock, Zap, Calendar } from 'lucide-react'
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
  const [showDetailedForecast, setShowDetailedForecast] = useState(false)

  // Handle escape key to close modal
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showDetailedForecast) {
        setShowDetailedForecast(false)
      }
    }

    if (showDetailedForecast) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [showDetailedForecast])
  const { preferences } = useUnitPreferences()
  const { 
    location, 
    isLoading: locationLoading,
    permissionStatus,
    hasLocationPermission,
    requestLocation,
    setManualLocation 
  } = useLocation()

  const { weather, impact, optimalTime, isLoading, error, forecast } = useWeather({ 
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
    
    if (!weather) return null

    const { current } = weather
    const currentRunningScore = calculateRunningScore(
      current.temperature, 
      current.humidity, 
      current.windSpeed, 
      current.precipitation
    )

    // Get today's best running time if forecast data is available
    let bestHour = null
    if (todayForecast && todayForecast.length > 0) {
      const runningHours = todayForecast.filter(hour => {
        const hourDate = new Date(hour.time)
        const hourOfDay = hourDate.getHours()
        return hourOfDay >= 5 && hourOfDay <= 21
      })

      const scoredHours = runningHours.map(hour => ({
        ...hour,
        score: calculateRunningScore(hour.temperature, hour.humidity, hour.windSpeed, hour.precipitation)
      }))

      bestHour = scoredHours.sort((a, b) => b.score - a.score)[0]
    }

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

        {/* Best Time Today - Only show if forecast data is available */}
        {bestHour && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-800">Best Time Today</span>
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                {bestHour.score}% score
              </Badge>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-green-700">
                {new Date(bestHour.time).toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                })}
              </span>
              <span className="text-sm text-green-600">
                {formatTemperature(bestHour.temperature, preferences.temperature)}
              </span>
            </div>
          </div>
        )}

        {/* Forecast Unavailable Message */}
        {(!todayForecast || todayForecast.length === 0) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm text-blue-800 mb-1">
              <Clock className="h-4 w-4 inline mr-1" />
              Forecast Update
            </div>
            <div className="text-sm text-blue-700">
              Hourly forecast data is currently updating. Current conditions are shown above.
            </div>
          </div>
        )}

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
    <>
      <Card className={`h-full flex flex-col ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {getWeatherIcon(current.weatherCondition)}
            Weather Conditions
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
        <CardContent className="flex-1 space-y-3">
          {/* Simplified Weather Display - Focus on Running Score */}
          <div className="text-center space-y-3">
            <div className="text-3xl font-bold text-green-600">
              {calculateRunningScore(
                current.temperature, 
                current.humidity, 
                current.windSpeed, 
                current.precipitation
              )}%
            </div>
            <div className="text-sm text-gray-600">
              Running Score
            </div>
            <div className="text-xs text-gray-500">
              {getScoreText(calculateRunningScore(
                current.temperature, 
                current.humidity, 
                current.windSpeed, 
                current.precipitation
              ))} conditions
            </div>
          </div>

          {/* Quick Weather Indicators */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2 bg-red-50 rounded-lg">
              <div className="text-lg font-bold text-red-600">
                {formatTemperature(current.temperature, preferences.temperature)}
              </div>
              <div className="text-xs text-red-600">Temperature</div>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">
                {current.humidity}%
              </div>
              <div className="text-xs text-blue-600">Humidity</div>
            </div>
          </div>

          {/* Weather Impact - Simplified */}
          {showImpact && impact && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-800 font-medium">Training Impact:</span>
                <span className={`text-xs font-medium ${getPerformanceColor(impact.performance)}`}>
                  {impact.performance}
                </span>
              </div>
            </div>
          )}

          {/* Forecast Tabs - Only if enabled */}
          {showForecastTabs && forecast?.forecast?.hourly && (
            <div className="pt-3 border-t">
              <Tabs defaultValue="today" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-8 bg-gray-100 rounded-md p-0.5">
                  <TabsTrigger value="today" className="text-xs data-[state=active]:bg-white rounded-sm mx-0.5">
                    Today
                  </TabsTrigger>
                  <TabsTrigger value="tomorrow" className="text-xs data-[state=active]:bg-white rounded-sm mx-0.5">
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

          {/* View Details Button */}
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs"
            onClick={() => {
              // Show detailed weather modal instead of just location input
              setShowDetailedForecast(true)
            }}
          >
            View Detailed Forecast
          </Button>
        </CardContent>
      </Card>

      {/* Detailed Forecast Modal */}
      {showDetailedForecast && weather && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={() => setShowDetailedForecast(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl max-h-[90vh] sm:max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b">
              <div className="flex items-center gap-2 sm:gap-3">
                {getWeatherIcon(current.weatherCondition)}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold">Weather Forecast</h3>
                  <p className="text-xs sm:text-sm text-gray-600">{weather.location.name}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetailedForecast(false)}
                className="h-8 w-8 sm:h-10 sm:w-10 p-0 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
              >
                <span className="text-base sm:text-lg font-bold">×</span>
              </Button>
            </div>
            
            {/* Content */}
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 h-full">
                
                {/* Left Column - Current Conditions */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 sm:p-4 border border-blue-100">
                  <h4 className="font-semibold text-sm sm:text-base mb-3 flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-blue-600" />
                    Current Conditions
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                      <Thermometer className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="text-xs text-gray-600">Temperature</p>
                        <p className="font-semibold text-sm">
                          {formatTemperature(current.temperature, preferences.temperature)}
                        </p>
                        {current.feelsLike !== current.temperature && (
                          <p className="text-xs text-gray-500">feels {formatTemperature(current.feelsLike, preferences.temperature)}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                      <Droplets className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-xs text-gray-600">Humidity</p>
                        <p className="font-semibold text-sm">{current.humidity}%</p>
                        <p className="text-xs text-gray-500">Dew: {formatTemperature(current.dewPoint, preferences.temperature)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                      <Wind className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-600">Wind</p>
                        <p className="font-semibold text-sm">{formatWindSpeed(current.windSpeed, preferences.windSpeed)}</p>
                        <p className="text-xs text-gray-500">{current.windDirection}°</p>
                      </div>
                    </div>
                    {current.precipitation > 0 ? (
                      <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                        <CloudRain className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-xs text-gray-600">Precipitation</p>
                          <p className="font-semibold text-sm">{current.precipitation}mm</p>
                          <p className="text-xs text-gray-500">Last hour</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                        <Sun className="h-4 w-4 text-yellow-500" />
                        <div>
                          <p className="text-xs text-gray-600">Conditions</p>
                          <p className="font-semibold text-sm capitalize">{current.weatherCondition}</p>
                          <p className="text-xs text-gray-500">Clear skies</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Additional Weather Metrics */}
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                      <div className="h-4 w-4 bg-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">UV</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">UV Index</p>
                        <p className="font-semibold text-sm">{current.uvIndex || 'N/A'}</p>
                        <p className="text-xs text-gray-500">
                          {current.uvIndex > 8 ? 'Very High' : 
                           current.uvIndex > 6 ? 'High' : 
                           current.uvIndex > 3 ? 'Moderate' : 'Low'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                      <div className="h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">AQ</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Air Quality</p>
                        <p className="font-semibold text-sm">{current.airQuality || 'N/A'}</p>
                        <p className="text-xs text-gray-500">
                          {current.airQuality > 150 ? 'Unhealthy' : 
                           current.airQuality > 100 ? 'Moderate' : 
                           current.airQuality > 50 ? 'Good' : 'Excellent'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                      <div className="h-4 w-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">P</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Pressure</p>
                        <p className="font-semibold text-sm">{current.pressure || 'N/A'} hPa</p>
                        <p className="text-xs text-gray-500">
                          {current.pressure > 1013 ? 'High' : 
                           current.pressure > 1000 ? 'Normal' : 'Low'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                      <div className="h-4 w-4 bg-indigo-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">V</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Visibility</p>
                        <p className="font-semibold text-sm">{current.visibility || 'N/A'} km</p>
                        <p className="text-xs text-gray-500">
                          {current.visibility > 10 ? 'Excellent' : 
                           current.visibility > 5 ? 'Good' : 
                           current.visibility > 1 ? 'Poor' : 'Very Poor'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                                      {/* Middle Column - Weather Impact & Optimal Time */}
                      <div className="space-y-3 sm:space-y-4">
                        {/* Weather Impact */}
                        {impact && (
                          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-3 sm:p-4 border border-orange-100">
                            <h4 className="font-semibold text-sm sm:text-base mb-3 flex items-center gap-2">
                              <Zap className="h-4 w-4 text-orange-600" />
                              Training Impact
                            </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                          <span className="text-sm font-medium">Risk Level</span>
                          <Badge variant="outline" className={`${getRiskColor(impact.risk)} text-xs font-medium`}>
                            {impact.risk}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                          <span className="text-sm font-medium">Performance</span>
                          <span className={`text-sm font-semibold ${getPerformanceColor(impact.performance)}`}>
                            {impact.performance}
                          </span>
                        </div>
                        {impact.recommendations.length > 0 && (
                          <div className="space-y-2">
                            <p className="font-medium text-xs">Recommendations:</p>
                            {impact.recommendations.slice(0, 2).map((rec, index) => (
                              <div key={index} className="flex items-start gap-2 p-2 bg-white rounded-lg">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                                <span className="text-xs">{rec}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                                          {/* Optimal Time */}
                        {optimalTime && (
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 sm:p-4 border border-green-100">
                            <h4 className="font-semibold text-sm sm:text-base mb-3 flex items-center gap-2">
                              <Clock className="h-4 w-4 text-green-600" />
                              Best Running Time
                            </h4>
                      <div className="space-y-2">
                        <div className="text-center p-3 bg-white rounded-lg">
                          <p className="text-lg font-bold text-green-600">{optimalTime.time}</p>
                          <p className="text-xs text-green-700">Today&apos;s Optimal Time</p>
                        </div>
                        <div className="p-2 bg-white rounded-lg">
                          <p className="text-xs text-green-700">{optimalTime.reason}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                                      {/* Right Column - Forecast */}
                      {forecast?.forecast?.hourly && (
                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-3 sm:p-4 border border-purple-100">
                          <h4 className="font-semibold text-sm sm:text-base mb-3 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-purple-600" />
                            Hourly Forecast
                          </h4>
                                              <Tabs defaultValue="today" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 bg-white h-7 sm:h-8 rounded-md p-0.5">
                              <TabsTrigger value="today" className="text-xs data-[state=active]:bg-purple-100 rounded-sm transition-colors mx-0.5">Today</TabsTrigger>
                              <TabsTrigger value="tomorrow" className="text-xs data-[state=active]:bg-purple-100 rounded-sm transition-colors mx-0.5">Tomorrow</TabsTrigger>
                            </TabsList>
                      
                      <TabsContent value="today" className="mt-3">
                        <div className="bg-white rounded-lg p-3 min-h-[300px]">
                          {renderTodayForecast()}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="tomorrow" className="mt-3">
                        <div className="bg-white rounded-lg p-3 min-h-[300px]">
                          {renderTomorrowForecast()}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 