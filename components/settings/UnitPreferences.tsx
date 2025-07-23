'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useUnitPreferences } from '@/hooks/useUnitPreferences'
import { formatDistance, formatPace, formatTemperature, formatWindSpeed } from '@/lib/utils'
import { Check } from 'lucide-react'

export default function UnitPreferences() {
  const { preferences, isLoading, toggleUnits, updatePreferences } = useUnitPreferences()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Units & Display</CardTitle>
          <CardDescription>Choose your preferred units for distances and pace</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded mb-4"></div>
            <div className="h-16 bg-gray-100 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Units & Display</CardTitle>
        <CardDescription>Choose your preferred units for distances, pace, and temperature</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Distance & Pace</h4>
            <div className="flex gap-2">
              <Button
                variant={preferences.distance === 'km' ? 'default' : 'outline'}
                onClick={() => toggleUnits()}
                disabled={preferences.distance === 'km'}
              >
                {preferences.distance === 'km' && <Check className="w-4 h-4 mr-1" />}
                Kilometers (km)
              </Button>
              <Button
                variant={preferences.distance === 'miles' ? 'default' : 'outline'}
                onClick={() => toggleUnits()}
                disabled={preferences.distance === 'miles'}
              >
                {preferences.distance === 'miles' && <Check className="w-4 h-4 mr-1" />}
                Miles (mi)
              </Button>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Wind Speed</h4>
            <div className="flex gap-2">
              <Button
                variant={preferences.windSpeed === 'km/h' ? 'default' : 'outline'}
                onClick={() => updatePreferences({ windSpeed: 'km/h' })}
                disabled={preferences.windSpeed === 'km/h'}
              >
                {preferences.windSpeed === 'km/h' && <Check className="w-4 h-4 mr-1" />}
                Kilometers per hour (km/h)
              </Button>
              <Button
                variant={preferences.windSpeed === 'mph' ? 'default' : 'outline'}
                onClick={() => updatePreferences({ windSpeed: 'mph' })}
                disabled={preferences.windSpeed === 'mph'}
              >
                {preferences.windSpeed === 'mph' && <Check className="w-4 h-4 mr-1" />}
                Miles per hour (mph)
              </Button>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Temperature</h4>
            <div className="flex gap-2">
              <Button
                variant={preferences.temperature === 'celsius' ? 'default' : 'outline'}
                onClick={() => updatePreferences({ temperature: 'celsius' })}
                disabled={preferences.temperature === 'celsius'}
              >
                {preferences.temperature === 'celsius' && <Check className="w-4 h-4 mr-1" />}
                Celsius (°C)
              </Button>
              <Button
                variant={preferences.temperature === 'fahrenheit' ? 'default' : 'outline'}
                onClick={() => updatePreferences({ temperature: 'fahrenheit' })}
                disabled={preferences.temperature === 'fahrenheit'}
              >
                {preferences.temperature === 'fahrenheit' && <Check className="w-4 h-4 mr-1" />}
                Fahrenheit (°F)
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Current Settings</h4>
            <div className="text-sm text-gray-600">
              <div>Distance: {preferences.distance === 'km' ? 'Kilometers (km)' : 'Miles (mi)'}</div>
              <div>Pace: {preferences.pace}</div>
              <div>Temperature: {preferences.temperature === 'celsius' ? 'Celsius (°C)' : 'Fahrenheit (°F)'}</div>
              <div>Wind Speed: {preferences.windSpeed === 'km/h' ? 'Kilometers per hour (km/h)' : 'Miles per hour (mph)'}</div>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
            <div className="font-medium mb-2">Examples with current setting:</div>
            <div className="space-y-1">
              <div>• Distance: {formatDistance(5000, preferences.distance)}</div>
              <div>• Pace: {formatPace(300, preferences.pace)} (5:00 per km converted)</div>
              <div>• Temperature: {formatTemperature(15, preferences.temperature)}</div>
              <div>• Wind Speed: {formatWindSpeed(15, preferences.windSpeed)}</div>
              <div>• Long run: {formatDistance(21097, preferences.distance)}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 