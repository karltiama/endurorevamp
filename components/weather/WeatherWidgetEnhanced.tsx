'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Thermometer, Droplets, Wind, CloudRain, Sun, AlertTriangle, MapPin, Settings, Navigation, Calendar, Clock } from 'lucide-react'
import { useWeather } from '@/hooks/useWeather'
import { useLocation } from '@/hooks/useLocation'
import { useUnitPreferences } from '@/hooks/useUnitPreferences'
import { formatTemperature, formatWindSpeed } from '@/lib/utils'
import { LocationPermissionPrompt } from './LocationPermissionPrompt'

interface WeatherWidgetEnhancedProps {
  className?: string
  showImpact?: boolean
  showOptimalTime?: boolean
  showLocationPrompt?: boolean
  showForecastTabs?: boolean
}

export function WeatherWidgetEnhanced({ 
  className = '', 
  showImpact = true, 
  showOptimalTime = true,
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

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' })
  }

  const getDateString = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
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

  const renderHourlyForecast = (forecast: any[], dayName: string) => {
    if (forecast.length === 0) {
      return (
        <div className="text-sm text-gray-500 text-center py-4">
          No forecast data available for {dayName.toLowerCase()}
        </div>
      )
    }

    // Create 3 main time intervals for running
    const createTimeIntervals = (forecast: any[]) => {
      const intervals = []
      
      // Early Morning: 6 AM - 10 AM (morning runners)
      const earlyMorning = forecast.filter(hour => {
        const hourDate = new Date(hour.time)
        const hourOfDay = hourDate.getHours()
        return hourOfDay >= 6 && hourOfDay < 10
      })
      
      // Midday: 10 AM - 3 PM (avoid if possible due to heat)
      const midday = forecast.filter(hour => {
        const hourDate = new Date(hour.time)
        const hourOfDay = hourDate.getHours()
        return hourOfDay >= 10 && hourOfDay < 15
      })
      
      // Afternoon: 3 PM - 8 PM (good running time)
      const afternoon = forecast.filter(hour => {
        const hourDate = new Date(hour.time)
        const hourOfDay = hourDate.getHours()
        return hourOfDay >= 15 && hourOfDay < 20
      })

      if (earlyMorning.length > 0) intervals.push({ name: 'Early Morning', data: earlyMorning, icon: '🌅', description: 'Best running time (6-10 AM)' })
      if (midday.length > 0) intervals.push({ name: 'Midday', data: midday, icon: '☀️', description: 'Avoid due to heat (10 AM-3 PM)' })
      if (afternoon.length > 0) intervals.push({ name: 'Afternoon', data: afternoon, icon: '🌆', description: 'Good running time (3-8 PM)' })

      return intervals
    }

    const timeIntervals = createTimeIntervals(forecast)

    return (
      <div className="space-y-4">
        {/* Best Running Times */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Best Running Times Today
          </h4>
          
          {/* Daily High/Low Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Today's Temperature Range</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-red-600 font-medium">High:</span>
                  <span className="font-semibold">
                    {formatTemperature(Math.max(...forecast.map(h => h.temperature)), preferences.temperature)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-blue-600 font-medium">Low:</span>
                  <span className="font-semibold">
                    {formatTemperature(Math.min(...forecast.map(h => h.temperature)), preferences.temperature)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {forecast.map((hour, index) => {
                const hourDate = new Date(hour.time)
                const hourOfDay = hourDate.getHours()
                
                // Calculate running score
                const getRunningScore = (temp: number, humidity: number, wind: number, precip: number) => {
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
                
                const runningScore = getRunningScore(hour.temperature, hour.humidity, hour.windSpeed, hour.precipitation)
                
                // Determine if this is a good time to run
                const isGoodTime = runningScore >= 70 && hourOfDay >= 5 && hourOfDay <= 21
                const isAcceptable = runningScore >= 50 && runningScore < 70 && hourOfDay >= 5 && hourOfDay <= 21
                const isAvoidTime = runningScore < 50 || hourOfDay < 5 || hourOfDay > 21
                const isHeatRisk = hour.temperature > 25
                const isRainRisk = hour.precipitation > 2
                const isHighHumidity = hour.humidity > 80
                
                // Skip if not a reasonable running hour (5 AM - 10 PM)
                if (hourOfDay < 5 || hourOfDay > 22) return null
                
                return (
                  <div 
                    key={index} 
                    className={`text-center p-3 rounded-lg border ${
                      isGoodTime 
                        ? 'bg-green-50 border-green-200' 
                        : isAcceptable
                        ? 'bg-yellow-50 border-yellow-200'
                        : isAvoidTime 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="text-xs font-medium text-gray-600 mb-1">
                      {formatTime(hour.time)}
                    </div>
                    
                    <div className="flex justify-center mb-2">
                      {getWeatherIcon(hour.weatherCondition)}
                    </div>
                    
                    <div className="text-sm font-semibold mb-1">
                      {formatTemperature(hour.temperature, preferences.temperature)}
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-1">
                      Humidity: {hour.humidity}%
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-1">
                      Wind: {formatWindSpeed(hour.windSpeed, preferences.windSpeed)}
                    </div>
                    
                    {hour.precipitation > 0 && (
                      <div className="text-xs text-blue-500 mb-1">
                        Rain: {hour.precipitation}mm
                      </div>
                    )}
                    
                    {/* Running recommendation */}
                    <div className="mt-2">
                      {isGoodTime ? (
                        <div className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                          Great for running
                        </div>
                      ) : isHeatRisk ? (
                        <div className="text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded">
                          Too hot
                        </div>
                      ) : isRainRisk ? (
                        <div className="text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded">
                          Heavy rain
                        </div>
                      ) : isHighHumidity ? (
                        <div className="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                          High humidity
                        </div>
                      ) : (
                        <div className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                          Acceptable
                        </div>
                      )}
                    </div>
                    
                    {/* Score indicator */}
                    <div className="mt-1">
                      <div className={`text-xs font-medium ${
                        runningScore >= 80 ? 'text-green-600' :
                        runningScore >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {runningScore}%
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Summary */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-600 mb-2">Running Conditions Summary:</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Great conditions</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span>Acceptable conditions</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Avoid running</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Running recommendations for this day */}
        {showImpact && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Running Recommendations</h4>
            
            {/* Best time to run */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Best Time</span>
                <span className="text-sm font-semibold text-blue-600">
                  {optimalTime?.time || 'Not available'}
                </span>
              </div>
              
              {optimalTime && (
                <p className="text-xs text-gray-600">
                  {optimalTime.reason}
                </p>
              )}
            </div>

            {/* Weather impact */}
            {impact && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Running Impact</span>
                  <Badge 
                    variant="outline" 
                    className={getRiskColor(impact.risk)}
                  >
                    {impact.risk} risk
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Performance</span>
                  <span className={`text-sm font-medium ${getPerformanceColor(impact.performance)}`}>
                    {impact.performance}
                  </span>
                </div>

                {/* Key recommendations */}
                {impact.recommendations.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-700">Key Tips:</span>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {impact.recommendations.slice(0, 2).map((rec, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span className="text-blue-500 mt-1">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
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
  const { today: todayForecast, tomorrow: tomorrowForecast } = getTodayAndTomorrowForecast()
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
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
      <CardContent className="space-y-4">
        {/* Current Conditions */}
        <div className="grid grid-cols-2 gap-4">
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

        {/* Forecast Tabs */}
        {showForecastTabs && forecast?.forecast?.hourly && (
          <div className="pt-4 border-t">
            <Tabs defaultValue="today" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="today" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Today
                </TabsTrigger>
                <TabsTrigger value="tomorrow" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Tomorrow
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="today" className="mt-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Calendar className="h-4 w-4" />
                    {getDayName(today)} • {getDateString(today)}
                  </div>
                  {renderHourlyForecast(todayForecast, 'Today')}
                </div>
              </TabsContent>
              
              <TabsContent value="tomorrow" className="mt-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Calendar className="h-4 w-4" />
                    {getDayName(tomorrow)} • {getDateString(tomorrow)}
                  </div>
                  {renderHourlyForecast(tomorrowForecast, 'Tomorrow')}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Legacy Daily Running Forecast (if tabs are disabled) */}
        {!showForecastTabs && forecast?.forecast?.hourly && forecast.forecast.hourly.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Today's Running Forecast</span>
              <Badge variant="outline" className="text-xs">
                {forecast.forecast.hourly.length} hours
              </Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {(() => {
                const timeSlots = [
                  { name: 'Early Morning', hours: [6, 7, 8], icon: '🌅' },
                  { name: 'Day', hours: [9, 10, 11, 12, 13, 14, 15, 16, 17], icon: '☀️' },
                  { name: 'Evening', hours: [18, 19, 20, 21], icon: '🌆' }
                ]

                return timeSlots.map((slot) => {
                  const slotHours = forecast.forecast.hourly.filter(hour => {
                    const hourDate = new Date(hour.time)
                    const hourOfDay = hourDate.getHours()
                    return slot.hours.includes(hourOfDay)
                  })

                  if (slotHours.length === 0) return null

                  // Calculate average conditions for this time slot
                  const avgTemp = slotHours.reduce((sum, h) => sum + h.temperature, 0) / slotHours.length
                  const avgHumidity = slotHours.reduce((sum, h) => sum + h.humidity, 0) / slotHours.length
                  const avgWind = slotHours.reduce((sum, h) => sum + h.windSpeed, 0) / slotHours.length
                  const maxPrecip = Math.max(...slotHours.map(h => h.precipitation))

                  // Calculate running score for this time slot
                  const getRunningScore = (temp: number, humidity: number, wind: number, precip: number) => {
                    let score = 100
                    if (temp < 5 || temp > 25) score -= 30
                    else if (temp < 10 || temp > 20) score -= 15
                    if (humidity > 80) score -= 20
                    else if (humidity > 70) score -= 10
                    if (wind > 25) score -= 25
                    else if (wind > 15) score -= 10
                    if (precip > 2) score -= 30
                    else if (precip > 0.5) score -= 15
                    return Math.max(0, score)
                  }

                  const runningScore = getRunningScore(avgTemp, avgHumidity, avgWind, maxPrecip)
                  
                  const getScoreColor = (score: number) => {
                    if (score >= 80) return 'text-green-600'
                    if (score >= 60) return 'text-yellow-600'
                    return 'text-red-600'
                  }

                  const getScoreText = (score: number) => {
                    if (score >= 80) return 'Great'
                    if (score >= 60) return 'Good'
                    return 'Poor'
                  }

                  return (
                    <div key={slot.name} className="text-center p-2 bg-gray-50 rounded-lg">
                      <div className="text-lg mb-1">{slot.icon}</div>
                      <div className="text-xs font-medium text-gray-700">{slot.name}</div>
                      <div className={`text-xs font-semibold ${getScoreColor(runningScore)}`}>
                        {getScoreText(runningScore)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatTemperature(avgTemp, preferences.temperature)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.round(avgHumidity)}%
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
            
            {/* Detailed Hourly Breakdown */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-600 mb-2">Best times today:</div>
              <div className="space-y-1">
                {(() => {
                  const hourlyData = forecast.forecast.hourly.slice(0, 24) // Next 24 hours
                  const runningHours = hourlyData.filter(hour => {
                    const hourDate = new Date(hour.time)
                    const hourOfDay = hourDate.getHours()
                    return hourOfDay >= 6 && hourOfDay <= 21 // 6 AM to 9 PM
                  })

                  // Calculate running scores for each hour
                  const scoredHours = runningHours.map(hour => {
                    const getRunningScore = (temp: number, humidity: number, wind: number, precip: number) => {
                      let score = 100
                      if (temp < 5 || temp > 25) score -= 30
                      else if (temp < 10 || temp > 20) score -= 15
                      if (humidity > 80) score -= 20
                      else if (humidity > 70) score -= 10
                      if (wind > 25) score -= 25
                      else if (wind > 15) score -= 10
                      if (precip > 2) score -= 30
                      else if (precip > 0.5) score -= 15
                      return Math.max(0, score)
                    }

                    return {
                      ...hour,
                      score: getRunningScore(hour.temperature, hour.humidity, hour.windSpeed, hour.precipitation)
                    }
                  })

                  // Sort by score and take top 3
                  const bestHours = scoredHours
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 3)

                  return bestHours.map((hour, index) => {
                    const hourDate = new Date(hour.time)
                    const timeString = hourDate.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })

                    const getScoreColor = (score: number) => {
                      if (score >= 80) return 'text-green-600'
                      if (score >= 60) return 'text-yellow-600'
                      return 'text-red-600'
                    }

                    return (
                      <div key={hour.time} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">#{index + 1}</span>
                          <span className="font-medium">{timeString}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${getScoreColor(hour.score)}`}>
                            {hour.score}%
                          </span>
                          <span className="text-gray-500">
                            {formatTemperature(hour.temperature, preferences.temperature)}
                          </span>
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
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

        {/* Weather Impact */}
        {showImpact && impact && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Running Impact</span>
              <Badge 
                variant="outline" 
                className={getRiskColor(impact.risk)}
              >
                {impact.risk} risk
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Performance</span>
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
            </div>

            {/* Recommendations */}
            {impact.recommendations.length > 0 && (
              <div className="space-y-1">
                <span className="text-sm font-medium text-gray-700">Recommendations:</span>
                <ul className="text-xs text-gray-600 space-y-1">
                  {impact.recommendations.slice(0, 3).map((rec, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-blue-500 mt-1">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Optimal Running Time */}
        {showOptimalTime && optimalTime && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Best Time to Run</span>
              <span className="text-sm font-semibold text-blue-600">
                {optimalTime.time}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {optimalTime.reason}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 