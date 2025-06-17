import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Unit conversion utilities
export type DistanceUnit = 'km' | 'miles'
export type PaceUnit = 'min/km' | 'min/mile'

export const CONVERSION_CONSTANTS = {
  KM_TO_MILES: 0.621371,
  MILES_TO_KM: 1.60934,
} as const

export function formatDistance(meters: number, unit: DistanceUnit = 'km'): string {
  if (unit === 'miles') {
    const miles = (meters / 1000) * CONVERSION_CONSTANTS.KM_TO_MILES
    return `${miles.toFixed(1)} mi`
  }
  const km = meters / 1000
  return `${km.toFixed(1)} km`
}

export function formatPace(secondsPerKm: number, unit: PaceUnit = 'min/km'): string {
  let secondsPerUnit = secondsPerKm
  
  if (unit === 'min/mile') {
    // Convert seconds per km to seconds per mile
    secondsPerUnit = secondsPerKm * CONVERSION_CONSTANTS.MILES_TO_KM
  }
  
  const minutes = Math.floor(secondsPerUnit / 60)
  const seconds = Math.floor(secondsPerUnit % 60)
  const unitSuffix = unit === 'min/mile' ? '/mi' : '/km'
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}${unitSuffix}`
}

export function convertDistance(meters: number, toUnit: DistanceUnit): number {
  const km = meters / 1000
  return toUnit === 'miles' ? km * CONVERSION_CONSTANTS.KM_TO_MILES : km
}

export function convertPace(secondsPerKm: number, toUnit: PaceUnit): number {
  return toUnit === 'min/mile' ? secondsPerKm * CONVERSION_CONSTANTS.MILES_TO_KM : secondsPerKm
}

export function getDistanceUnit(unit: DistanceUnit): string {
  return unit === 'miles' ? 'mi' : 'km'
}

export function getPaceUnit(unit: PaceUnit): string {
  return unit === 'min/mile' ? '/mi' : '/km'
}
