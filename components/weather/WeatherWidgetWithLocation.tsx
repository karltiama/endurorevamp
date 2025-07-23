'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Thermometer, Droplets, Wind, CloudRain, Sun, AlertTriangle, MapPin, Settings } from 'lucide-react'
import { useWeather } from '@/hooks/useWeather'
import { useUnitPreferences } from '@/hooks/useUnitPreferences'
import { formatTemperature } from '@/lib/utils'

interface WeatherWidgetWithLocationProps {
  className?: string
  showImpact?: boolean
  showOptimalTime?: boolean
}

export function WeatherWidgetWithLocation({ 
  className = '', 
  showImpact = true, 
  showOptimalTime = true
}: WeatherWidgetWithLocationProps) {
  const [showLocationInput, setShowLocationInput] = useState(false)
  const [lat, setLat] = useState('51.5074') // London default
  const [lon, setLon] = useState('-0.1278')
  const [locationName, setLocationName] = useState('London')
  const { preferences } = useUnitPreferences()

  const { weather, impact, optimalTime, isLoading, error } = useWeather({ 
    lat: parseFloat(lat), 
    lon: parseFloat(lon),
    enabled: !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lon))
  })

  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowLocationInput(false)
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
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g., London, New York"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="51.5074"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={lon}
                  onChange={(e) => setLon(e.target.value)}
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

  if (isLoading) {
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getWeatherIcon(current.weatherCondition)}
          Weather
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm font-normal text-gray-500">
              {locationName}
            </span>
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
            <span className="text-sm">{Math.round(current.windSpeed)} km/h</span>
          </div>
          
          {current.precipitation > 0 && (
            <div className="flex items-center gap-2">
              <CloudRain className="h-4 w-4 text-blue-500" />
              <span className="text-sm">{current.precipitation}mm</span>
            </div>
          )}
        </div>

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