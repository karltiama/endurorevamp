'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useUnitPreferences } from '@/hooks/useUnitPreferences'
import { formatDistance, formatPace } from '@/lib/utils'
import { Check } from 'lucide-react'

export default function UnitPreferences() {
  const { preferences, isLoading, toggleUnits } = useUnitPreferences()

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
        <CardDescription>Choose your preferred units for distances and pace</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Current Settings</h4>
            <div className="text-sm text-gray-600">
              <div>Distance: {preferences.distance === 'km' ? 'Kilometers (km)' : 'Miles (mi)'}</div>
              <div>Pace: {preferences.pace}</div>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
            <div className="font-medium mb-2">Examples with current setting:</div>
            <div className="space-y-1">
              <div>• Distance: {formatDistance(5000, preferences.distance)}</div>
              <div>• Pace: {formatPace(300, preferences.pace)} (5:00 per km converted)</div>
              <div>• Long run: {formatDistance(21097, preferences.distance)}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 