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
    // Show clean values: 3.1 mi instead of 3.1 mi, 5 mi instead of 5.0 mi
    return `${miles % 1 === 0 ? miles.toFixed(0) : miles.toFixed(1)} mi`
  }
  const km = meters / 1000
  // Show clean values: 5 km instead of 5.0 km, 3.2 km instead of 3.2 km
  return `${km % 1 === 0 ? km.toFixed(0) : km.toFixed(1)} km`
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



/**
 * Format time from Strava's start_date_local field
 * Handles timezone conversion properly
 */
export function formatStravaTime(dateString: string): string {
  if (!dateString) return ''
  
  try {
    // Parse the date string and extract time components manually
    // This avoids JavaScript's automatic timezone conversion
    const date = new Date(dateString)
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString)
      return ''
    }
    
    // Get the time in the local timezone of the activity (not browser timezone)
    const hours = date.getUTCHours()
    const minutes = date.getUTCMinutes()
    
    // Convert to 12-hour format
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
  } catch (error) {
    console.error('Error formatting Strava time:', error, dateString)
    return ''
  }
}

/**
 * Format date from Strava's start_date_local field
 * Shows relative dates for recent activities
 */
export function formatStravaDate(dateString: string): string {
  if (!dateString) return ''
  
  try {
    // Parse the date string directly
    const date = new Date(dateString)
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString)
      return ''
    }
    
    // For date calculations, we need to compare only the date part, not the full timestamp
    const now = new Date()
    const activityDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    const diffTime = today.getTime() - activityDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays === 2) {
      return '2 days ago'
    } else if (diffDays > 0 && diffDays <= 7) {
      return `${diffDays} days ago`
    } else if (diffDays === 0) {
      return 'Today'
    } else {
      // For older dates, use the local date components
      const month = date.toLocaleDateString('en-US', { month: 'short' })
      const day = date.getDate() // Use local date, not UTC
      
      return `${month} ${day}`
    }
  } catch (error) {
    console.error('Error formatting Strava date:', error, dateString)
    return ''
  }
}

/**
 * Format date and time from Strava's start_date_local field
 * Shows both date and time with proper timezone handling
 */
export function formatStravaDateTime(dateString: string): string {
  if (!dateString) return ''
  
  try {
    // Parse the date string directly
    const date = new Date(dateString)
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString)
      return ''
    }
    
    // Get date components (use local date, not UTC)
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    const day = date.getDate() // Use local date, not UTC
    
    // Get time components (using UTC to avoid timezone conversion)
    const hours = date.getUTCHours()
    const minutes = date.getUTCMinutes()
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    
    return `${month} ${day}, ${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
  } catch (error) {
    console.error('Error formatting Strava date/time:', error, dateString)
    return ''
  }
}

/**
 * Get the current week boundaries (Monday to Sunday)
 * Returns start and end dates for the current week
 * 
 * User-friendly approach: If it's Sunday, show the week that's ending today
 * rather than the week that starts tomorrow
 */
export function getCurrentWeekBoundaries(): { start: Date; end: Date } {
  const now = new Date()
  const currentWeekStart = new Date(now)
  
  // If it's Sunday (day 0), show the week that's ending today
  // Otherwise, show the week that starts on Monday
  if (now.getDay() === 0) {
    // Sunday: show the week that started last Monday and ends today
    currentWeekStart.setDate(now.getDate() - 6) // Go back 6 days to get Monday
  } else {
    // Other days: show the week that starts on Monday
    currentWeekStart.setDate(now.getDate() - now.getDay() + 1)
  }
  
  currentWeekStart.setHours(0, 0, 0, 0)
  
  const currentWeekEnd = new Date(currentWeekStart)
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6) // Sunday
  currentWeekEnd.setHours(23, 59, 59, 999)
  
  return { start: currentWeekStart, end: currentWeekEnd }
}

/**
 * Check if a date falls within the current week (Monday to Sunday)
 */
export function isInCurrentWeek(date: Date): boolean {
  const { start, end } = getCurrentWeekBoundaries()
  return date >= start && date <= end
}

/**
 * Get the day of week as a string (Mon, Tue, etc.)
 */
export function getDayOfWeek(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[date.getDay()]
}

/**
 * Parse Hevy workout data from Strava description
 * Extracts exercises, sets, weights, and reps from Hevy format
 */
export function parseHevyWorkout(description: string): {
  exercises: Array<{
    name: string;
    sets: Array<{
      weight: number;
      reps: number;
    }>;
  }>;
  totalVolume: number;
  totalSets: number;
} | null {
  if (!description) return null;

  const lines = description.split('\n').filter(line => line.trim());
  const exercises: Array<{
    name: string;
    sets: Array<{
      weight: number;
      reps: number;
    }>;
  }> = [];

  let currentExercise: { name: string; sets: Array<{ weight: number; reps: number }> } | null = null;
  let totalVolume = 0;
  let totalSets = 0;

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Check if this is a set line (contains "Set" and weight/reps pattern)
    const setMatch = trimmedLine.match(/Set \d+:\s*(\d+(?:\.\d+)?)\s*(?:lbs?|kg)\s*x\s*(\d+)/i);
    if (setMatch && currentExercise) {
      const weight = parseFloat(setMatch[1]);
      const reps = parseInt(setMatch[2]);
      
      if (!isNaN(weight) && !isNaN(reps)) {
        currentExercise.sets.push({ weight, reps });
        totalVolume += weight * reps;
        totalSets++;
      }
    } else if (!trimmedLine.includes('Set') && !trimmedLine.includes('set')) {
      // This might be an exercise name - only treat as exercise if we have sets or it's not empty
      if (currentExercise && currentExercise.sets.length > 0) {
        exercises.push(currentExercise);
      }
      
      // Start new exercise
      currentExercise = {
        name: trimmedLine,
        sets: []
      };
    }
  }

  // Add the last exercise if it has sets
  if (currentExercise && currentExercise.sets.length > 0) {
    exercises.push(currentExercise);
  }

  return exercises.length > 0 ? {
    exercises,
    totalVolume,
    totalSets
  } : null;
}

/**
 * Format Hevy workout data for display
 */
export function formatHevyWorkout(parsedWorkout: ReturnType<typeof parseHevyWorkout>): string {
  if (!parsedWorkout) return '';

  return parsedWorkout.exercises.map(exercise => {
    const setsText = exercise.sets.map(set => 
      `${set.weight} lbs × ${set.reps}`
    ).join('\n  ');
    
    return `${exercise.name}\n  ${setsText}`;
  }).join('\n\n');
}


