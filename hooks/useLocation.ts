'use client';

import { useState, useEffect, useCallback } from 'react';

export interface UserLocation {
  lat: number;
  lon: number;
  name: string;
  source: 'default' | 'saved' | 'geolocation' | 'manual';
}

const DEFAULT_LOCATION: UserLocation = {
  lat: 51.5074,
  lon: -0.1278,
  name: 'London',
  source: 'default',
};

const LOCATION_STORAGE_KEY = 'enduro-user-location';

export function useLocation() {
  const [location, setLocation] = useState<UserLocation>(DEFAULT_LOCATION);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<
    'granted' | 'denied' | 'prompt' | 'unsupported'
  >('prompt');
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);

  // Load saved location on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCATION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setLocation({ ...parsed, source: 'saved' });
      }
    } catch (error) {
      console.error('Error loading saved location:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check geolocation support
  useEffect(() => {
    if (!navigator.geolocation) {
      setPermissionStatus('unsupported');
      return;
    }

    // Check if we have permission
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        setPermissionStatus(result.state);

        result.addEventListener('change', () => {
          setPermissionStatus(result.state);
        });
      });
    }
  }, []);

  const requestLocation = useCallback(async (): Promise<UserLocation> => {
    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported');
    }

    setHasRequestedPermission(true);

    return new Promise((resolve, reject) => {
      const options = {
        timeout: 10000,
        enableHighAccuracy: false,
        maximumAge: 5 * 60 * 1000, // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        position => {
          const userLocation: UserLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            name: 'Your Location',
            source: 'geolocation',
          };

          // Save to localStorage
          try {
            localStorage.setItem(
              LOCATION_STORAGE_KEY,
              JSON.stringify(userLocation)
            );
          } catch (error) {
            console.error('Error saving location:', error);
          }

          setLocation(userLocation);
          resolve(userLocation);
        },
        error => {
          console.log('Geolocation error:', error.message);
          reject(new Error(error.message));
        },
        options
      );
    });
  }, []);

  const setManualLocation = useCallback(
    (lat: number, lon: number, name: string) => {
      const manualLocation: UserLocation = {
        lat,
        lon,
        name,
        source: 'manual',
      };

      try {
        localStorage.setItem(
          LOCATION_STORAGE_KEY,
          JSON.stringify(manualLocation)
        );
      } catch (error) {
        console.error('Error saving manual location:', error);
      }

      setLocation(manualLocation);
    },
    []
  );

  const clearLocation = useCallback(() => {
    try {
      localStorage.removeItem(LOCATION_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing location:', error);
    }

    setLocation(DEFAULT_LOCATION);
  }, []);

  const canRequestLocation =
    permissionStatus === 'prompt' || permissionStatus === 'granted';
  const hasLocationPermission = permissionStatus === 'granted';
  const isLocationSupported = permissionStatus !== 'unsupported';

  return {
    location,
    isLoading,
    permissionStatus,
    hasRequestedPermission,
    canRequestLocation,
    hasLocationPermission,
    isLocationSupported,
    requestLocation,
    setManualLocation,
    clearLocation,
  };
}
