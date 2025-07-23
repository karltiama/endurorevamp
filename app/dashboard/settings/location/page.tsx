import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MapPin, Shield, Info } from 'lucide-react'
import { LocationSettingsClient } from '@/components/settings/LocationSettingsClient'

export default function LocationSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Location Settings</h1>
        <p className="text-muted-foreground">
          Manage your location preferences for weather data and running recommendations.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Privacy Notice */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy & Location Data
            </CardTitle>
            <CardDescription>
              How we use your location data to improve your running experience.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Your location data is used solely for weather information and running recommendations. 
                We do not track your movements or share your location with third parties.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Location data is stored locally on your device</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Weather API calls use your location coordinates only</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>You can delete your location data at any time</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Management */}
        <LocationSettingsClient />
      </div>
    </div>
  )
} 