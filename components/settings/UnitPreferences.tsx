'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useUnitPreferences } from '@/hooks/useUnitPreferences'
import { formatDistance, formatPace } from '@/lib/utils'

export default function UnitPreferences() {
  const { preferences, isLoading, toggleUnits } = useUnitPreferences()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unit Preferences</CardTitle>
          <CardDescription>Choose your preferred units for distance and pace</CardDescription>
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
        <CardTitle>Unit Preferences</CardTitle>
        <CardDescription>Choose your preferred units for distance and pace</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant={preferences.distance === 'km' ? 'default' : 'outline'}
            onClick={() => toggleUnits()}
            disabled={preferences.distance === 'km'}
          >
            Kilometers (km)
          </Button>
          <Button
            variant={preferences.distance === 'miles' ? 'default' : 'outline'}
            onClick={() => toggleUnits()}
            disabled={preferences.distance === 'miles'}
          >
            Miles
          </Button>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
          <div className="font-medium mb-2">Examples with current setting:</div>
          <div className="space-y-1">
            <div>• Distance: {formatDistance(5000, preferences.distance)}</div>
            <div>• Pace: {formatPace(300, preferences.pace)} (5:00 per km converted)</div>
            <div>• Long run: {formatDistance(21097, preferences.distance)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 