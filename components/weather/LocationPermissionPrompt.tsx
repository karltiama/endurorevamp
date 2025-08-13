'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Shield, X, Check } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';

interface LocationPermissionPromptProps {
  onLocationGranted?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function LocationPermissionPrompt({
  onLocationGranted,
  onDismiss,
  className = '',
}: LocationPermissionPromptProps) {
  const {
    requestLocation,
    permissionStatus,
    hasRequestedPermission,
    canRequestLocation,
    isLocationSupported,
  } = useLocation();

  const [isRequesting, setIsRequesting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleRequestLocation = async () => {
    if (!canRequestLocation) return;

    setIsRequesting(true);
    setError(null);

    try {
      await requestLocation();
      onLocationGranted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
    } finally {
      setIsRequesting(false);
    }
  };

  // Don't show if location is not supported
  if (!isLocationSupported) {
    return null;
  }

  // Don't show if permission is already granted
  if (permissionStatus === 'granted') {
    return null;
  }

  // Don't show if user has already been prompted and denied
  if (hasRequestedPermission && permissionStatus === 'denied') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Location access was denied. You can still use the weather widget
              with a manual location.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Show Weather for Your Location?
        </CardTitle>
        <CardDescription>
          Get personalized weather data for your current location to improve
          your running experience.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Get accurate weather for your runs</span>
          </div>
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Receive personalized running recommendations</span>
          </div>
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Your location is only used for weather data</span>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleRequestLocation}
            disabled={isRequesting || !canRequestLocation}
            className="flex-1"
          >
            {isRequesting ? 'Getting Location...' : 'Allow Location Access'}
          </Button>
          <Button variant="outline" onClick={onDismiss} disabled={isRequesting}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-xs text-gray-500">
          You can change this later in your browser settings or manually set
          your location.
        </div>
      </CardContent>
    </Card>
  );
}
