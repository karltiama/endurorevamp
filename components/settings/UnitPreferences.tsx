'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useUnitPreferences } from '@/hooks/useUnitPreferences'
import { Check } from 'lucide-react'

export default function UnitPreferences() {
  const { preferences, isLoading, toggleUnits, updatePreferences } = useUnitPreferences()

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Units & Display</CardTitle>
          <CardDescription className="text-sm">Choose your preferred units</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-100 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Units & Display</CardTitle>
        <CardDescription className="text-sm">Choose your preferred units for distances, pace, and temperature</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium mb-2">Distance & Pace</h4>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={preferences.distance === 'km' ? 'default' : 'outline'}
                onClick={() => toggleUnits()}
                disabled={preferences.distance === 'km'}
                className="flex-1"
              >
                {preferences.distance === 'km' && <Check className="w-3 h-3 mr-1" />}
                km
              </Button>
              <Button
                size="sm"
                variant={preferences.distance === 'miles' ? 'default' : 'outline'}
                onClick={() => toggleUnits()}
                disabled={preferences.distance === 'miles'}
                className="flex-1"
              >
                {preferences.distance === 'miles' && <Check className="w-3 h-3 mr-1" />}
                mi
              </Button>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Wind Speed</h4>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={preferences.windSpeed === 'km/h' ? 'default' : 'outline'}
                onClick={() => updatePreferences({ windSpeed: 'km/h' })}
                disabled={preferences.windSpeed === 'km/h'}
                className="flex-1"
              >
                {preferences.windSpeed === 'km/h' && <Check className="w-3 h-3 mr-1" />}
                km/h
              </Button>
              <Button
                size="sm"
                variant={preferences.windSpeed === 'mph' ? 'default' : 'outline'}
                onClick={() => updatePreferences({ windSpeed: 'mph' })}
                disabled={preferences.windSpeed === 'mph'}
                className="flex-1"
              >
                {preferences.windSpeed === 'mph' && <Check className="w-3 h-3 mr-1" />}
                mph
              </Button>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Temperature</h4>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={preferences.temperature === 'celsius' ? 'default' : 'outline'}
                onClick={() => updatePreferences({ temperature: 'celsius' })}
                disabled={preferences.temperature === 'celsius'}
                className="flex-1"
              >
                {preferences.temperature === 'celsius' && <Check className="w-3 h-3 mr-1" />}
                °C
              </Button>
              <Button
                size="sm"
                variant={preferences.temperature === 'fahrenheit' ? 'default' : 'outline'}
                onClick={() => updatePreferences({ temperature: 'fahrenheit' })}
                disabled={preferences.temperature === 'fahrenheit'}
                className="flex-1"
              >
                {preferences.temperature === 'fahrenheit' && <Check className="w-3 h-3 mr-1" />}
                °F
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 