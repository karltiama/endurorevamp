'use client'

import { useState, useEffect } from 'react'
import type { DistanceUnit, PaceUnit, TemperatureUnit } from '@/lib/utils'

export interface UnitPreferences {
  distance: DistanceUnit
  pace: PaceUnit
  temperature: TemperatureUnit
  windSpeed: 'km/h' | 'mph'
}

const DEFAULT_PREFERENCES: UnitPreferences = {
  distance: 'km',
  pace: 'min/km',
  temperature: 'celsius',
  windSpeed: 'km/h'
}

const STORAGE_KEY = 'enduro-unit-preferences'

export function useUnitPreferences() {
  const [preferences, setPreferences] = useState<UnitPreferences>(DEFAULT_PREFERENCES)
  const [isLoading, setIsLoading] = useState(true)

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed })
      }
    } catch (error) {
      console.error('Error loading unit preferences:', error)
      // Continue with defaults
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updatePreferences = (newPreferences: Partial<UnitPreferences>) => {
    const updated = { ...preferences, ...newPreferences }
    setPreferences(updated)
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch (error) {
      console.error('Error saving unit preferences:', error)
      // Continue anyway - the state is updated even if saving fails
    }
  }

  const setDistanceUnit = (unit: DistanceUnit) => {
    const pace: PaceUnit = unit === 'miles' ? 'min/mile' : 'min/km'
    updatePreferences({ distance: unit, pace })
  }

  const toggleUnits = () => {
    const newUnit: DistanceUnit = preferences.distance === 'km' ? 'miles' : 'km'
    setDistanceUnit(newUnit)
  }

  return {
    preferences,
    isLoading,
    updatePreferences,
    setDistanceUnit,
    toggleUnits
  }
} 