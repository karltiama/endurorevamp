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

// ✨ NEW: Consolidated date formatting functions
export function formatDate(dateString: string, options?: {
  style?: 'short' | 'medium' | 'long' | 'full';
  includeYear?: boolean;
}): string {
  const date = new Date(dateString);
  
  if (options?.style === 'full') {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  if (options?.style === 'long') {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  if (options?.style === 'medium') {
    return date.toLocaleDateString('en-US', {
      year: options.includeYear !== false ? 'numeric' : undefined,
      month: 'short',
      day: 'numeric'
    });
  }
  
  // Default: short format (existing behavior)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

// ✨ NEW: Time duration formatting
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${Math.floor(remainingSeconds).toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${Math.floor(remainingSeconds).toString().padStart(2, '0')}`;
}

// ✨ NEW: Relative time formatting (e.g., "2 hours ago")
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return formatDate(dateString, { style: 'medium' });
  }
}

// ✨ NEW: Projected completion time formatting
export function formatProjectedCompletion(daysToComplete: number): string {
  if (daysToComplete <= 0) return 'Already achieved';
  if (daysToComplete < 7) return `${Math.ceil(daysToComplete)} days`;
  if (daysToComplete < 30) return `${Math.ceil(daysToComplete / 7)} weeks`;
  return `${Math.ceil(daysToComplete / 30)} months`;
}

// ✨ NEW: Percentage formatting
export function formatPercentage(value: number, options?: {
  decimals?: number;
  showSign?: boolean;
}): string {
  const decimals = options?.decimals ?? 1;
  const showSign = options?.showSign ?? false;
  const formatted = value.toFixed(decimals);
  const sign = showSign && value >= 0 ? '+' : '';
  return `${sign}${formatted}%`;
}

// ✨ NEW: Number formatting with units
export function formatNumber(value: number, options?: {
  decimals?: number;
  unit?: string;
  compact?: boolean;
}): string {
  const { decimals = 0, unit = '', compact = false } = options || {};
  
  if (compact && value >= 1000) {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M${unit}`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K${unit}`;
    }
  }
  
  return `${value.toFixed(decimals)}${unit}`;
}

// ✨ NEW: Ordinal number formatting
export function formatOrdinal(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return `${num}st`;
  if (j === 2 && k !== 12) return `${num}nd`;
  if (j === 3 && k !== 13) return `${num}rd`;
  return `${num}th`;
}

/**
 * Get activity icon based on sport type and trainer flag
 * Distinguishes between indoor/outdoor runs and weight training
 */
export function getActivityIcon(type: string, trainer?: boolean): string {
  const icons: Record<string, string> = {
    'Ride': '🚴‍♂️',
    'Run': trainer ? '🏃‍♂️🏠' : '🏃‍♂️', // Indoor run vs outdoor run
    'Swim': '🏊‍♂️',
    'Hike': '🥾',
    'Walk': '🚶‍♂️',
    'Workout': '🏋️‍♂️', // Weight training icon
    'WeightTraining': '🏋️‍♂️', // Weight training icon
    'VirtualRide': '🚴‍♂️',
    'EBikeRide': '🚴‍♂️⚡',
  }
  return icons[type] || '🏃‍♂️'
}


