import { formatDistance, getActivityIcon, formatStravaTime, formatStravaDate, formatStravaDateTime, getCurrentWeekBoundaries, isInCurrentWeek, getDayOfWeek } from '@/lib/utils'
import { parseHevyWorkout, formatHevyWorkout } from '@/lib/utils'

describe('Utils', () => {
  describe('formatDistance', () => {
    it('formats distance in kilometers', () => {
      expect(formatDistance(5000, 'km')).toBe('5.0 km')
      expect(formatDistance(10000, 'km')).toBe('10.0 km')
    })

    it('formats distance in miles', () => {
      expect(formatDistance(5000, 'miles')).toBe('3.1 mi')
      expect(formatDistance(10000, 'miles')).toBe('6.2 mi')
    })
  })

  describe('getActivityIcon', () => {
    it('returns correct icons for different activities', () => {
      expect(getActivityIcon('Run')).toBe('🏃‍♂️')
      expect(getActivityIcon('Ride')).toBe('🚴‍♂️')
      expect(getActivityIcon('Swim')).toBe('🏊‍♂️')
      expect(getActivityIcon('Hike')).toBe('🥾')
      expect(getActivityIcon('Walk')).toBe('🚶‍♂️')
      expect(getActivityIcon('Workout')).toBe('🏋️‍♂️')
      expect(getActivityIcon('WeightTraining')).toBe('🏋️‍♂️')
    })

    it('handles indoor runs', () => {
      expect(getActivityIcon('Run', true)).toBe('🏃‍♂️🏠')
      expect(getActivityIcon('Run', false)).toBe('🏃‍♂️')
    })

    it('returns default icon for unknown activities', () => {
      expect(getActivityIcon('UnknownActivity')).toBe('🏃‍♂️')
    })
  })

  describe('formatStravaTime', () => {
    it('formats time correctly', () => {
      // Test with a known time
      const testTime = '2024-01-15T14:30:00Z'
      const formatted = formatStravaTime(testTime)
      
      // Should return a time in 12-hour format
      expect(formatted).toMatch(/^\d{1,2}:\d{2}\s?(AM|PM)$/)
    })

    it('formats time correctly', () => {
      const testTime = '2024-01-15T14:30:00Z'
      const formatted = formatStravaTime(testTime)
      
      // Should return a time in 12-hour format
      expect(formatted).toMatch(/^\d{1,2}:\d{2}\s?(AM|PM)$/)
    })

    it('formats 6:51 AM correctly', () => {
      // Test the user's specific example - 6:51 AM
      const testTime = '2024-01-15T06:51:00Z'
      const formatted = formatStravaTime(testTime)
      expect(formatted).toBe('6:51 AM')
    })

    it('formats 2:51 AM correctly', () => {
      // Test the user's specific example - 2:51 AM
      const testTime = '2024-01-15T02:51:00Z'
      const formatted = formatStravaTime(testTime)
      expect(formatted).toBe('2:51 AM')
    })

    it('handles empty string', () => {
      expect(formatStravaTime('')).toBe('')
    })

    it('handles invalid date string', () => {
      expect(formatStravaTime('invalid-date')).toBe('')
    })

    it('handles null/undefined', () => {
      expect(formatStravaTime(null as any)).toBe('')
      expect(formatStravaTime(undefined as any)).toBe('')
    })
  })

  describe('formatStravaDate', () => {
    it('shows "Yesterday" for activities from yesterday', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayString = yesterday.toISOString()
      
      expect(formatStravaDate(yesterdayString)).toBe('Yesterday')
    })

    it('shows relative days for recent activities', () => {
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
      const twoDaysAgoString = twoDaysAgo.toISOString()
      
      const result = formatStravaDate(twoDaysAgoString)
      // Should be either "2 days ago" or "3 days ago" due to timezone differences
      expect(result).toMatch(/^\d+\sdays\sago$/)
    })

    it('shows relative days correctly', () => {
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
      const twoDaysAgoString = twoDaysAgo.toISOString()
      
      const result = formatStravaDate(twoDaysAgoString)
      expect(result).toMatch(/^\d+\sdays\sago$/)
    })

    it('shows date for older activities', () => {
      const oldDate = '2024-01-01T10:00:00Z'
      const formatted = formatStravaDate(oldDate)
      
      // Should return a date format like "Jan 1"
      expect(formatted).toMatch(/^[A-Za-z]{3}\s\d{1,2}$/)
    })

    it('shows correct date for user example', () => {
      // Test the user's specific example - activity from yesterday
      // Create a date that represents yesterday at 6:51 AM in the user's timezone
      const now = new Date()
      const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 6, 51, 0)
      const yesterdayString = yesterday.toISOString()
      
      // The result should be "Yesterday" or "2 days ago" depending on timezone
      const result = formatStravaDate(yesterdayString)
      expect(result).toMatch(/^(Yesterday|\d+\sdays\sago)$/)
    })

    it('shows correct date for specific timezone example', () => {
      // Test with a specific date that should show "Yesterday"
      const testDate = new Date()
      testDate.setDate(testDate.getDate() - 1)
      testDate.setHours(14, 30, 0, 0) // 2:30 PM
      const testDateString = testDate.toISOString()
      
      const result = formatStravaDate(testDateString)
      expect(result).toBe('Yesterday')
    })

    it('handles empty string', () => {
      expect(formatStravaDate('')).toBe('')
    })

    it('handles invalid date string', () => {
      expect(formatStravaDate('invalid-date')).toBe('')
    })
  })

  describe('formatStravaDateTime', () => {
    it('formats date and time together', () => {
      const testDateTime = '2024-01-15T14:30:00Z'
      const formatted = formatStravaDateTime(testDateTime)
      
      // Should return a format like "Jan 15, 2:30 PM"
      expect(formatted).toMatch(/^[A-Za-z]{3}\s\d{1,2},\s\d{1,2}:\d{2}\s?(AM|PM)$/)
    })

    it('formats date and time correctly', () => {
      const testDateTime = '2024-01-15T14:30:00Z'
      const formatted = formatStravaDateTime(testDateTime)
      
      // Should return a format like "Jan 15, 2:30 PM"
      expect(formatted).toMatch(/^[A-Za-z]{3}\s\d{1,2},\s\d{1,2}:\d{2}\s?(AM|PM)$/)
    })

    it('handles empty string', () => {
      expect(formatStravaDateTime('')).toBe('')
    })

    it('handles invalid date string', () => {
      expect(formatStravaDateTime('invalid-date')).toBe('')
    })
  })

  describe('getCurrentWeekBoundaries', () => {
    it('returns Monday to Sunday week boundaries', () => {
      const { start, end } = getCurrentWeekBoundaries()
      
      // Start should be Monday (day 1)
      expect(start.getDay()).toBe(1)
      expect(start.getHours()).toBe(0)
      expect(start.getMinutes()).toBe(0)
      expect(start.getSeconds()).toBe(0)
      
      // End should be Sunday (day 0)
      expect(end.getDay()).toBe(0)
      expect(end.getHours()).toBe(23)
      expect(end.getMinutes()).toBe(59)
      expect(end.getSeconds()).toBe(59)
      
      // Should be 6 days apart (Monday to Sunday)
      const diffTime = end.getTime() - start.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      expect(diffDays).toBe(7)
    })
  })

  describe('isInCurrentWeek', () => {
    it('correctly identifies dates in current week', () => {
      const { start, end } = getCurrentWeekBoundaries()
      
      // Test start of week
      expect(isInCurrentWeek(start)).toBe(true)
      
      // Test end of week
      expect(isInCurrentWeek(end)).toBe(true)
      
      // Test middle of week
      const middleOfWeek = new Date(start)
      middleOfWeek.setDate(start.getDate() + 3)
      expect(isInCurrentWeek(middleOfWeek)).toBe(true)
      
      // Test previous week
      const previousWeek = new Date(start)
      previousWeek.setDate(start.getDate() - 1)
      expect(isInCurrentWeek(previousWeek)).toBe(false)
      
      // Test next week
      const nextWeek = new Date(end)
      nextWeek.setDate(end.getDate() + 1)
      expect(isInCurrentWeek(nextWeek)).toBe(false)
    })
  })

  describe('getDayOfWeek', () => {
    it('returns correct day abbreviations', () => {
      // Create dates for specific days of the week
      const monday = new Date(2024, 0, 1) // Monday (Jan 1, 2024)
      const wednesday = new Date(2024, 0, 3) // Wednesday (Jan 3, 2024)
      const sunday = new Date(2024, 0, 7) // Sunday (Jan 7, 2024)
      
      expect(getDayOfWeek(monday)).toBe('Mon')
      expect(getDayOfWeek(wednesday)).toBe('Wed')
      expect(getDayOfWeek(sunday)).toBe('Sun')
    })
  })
}) 

describe('Hevy Workout Parser', () => {
  describe('parseHevyWorkout', () => {
    it('should parse Hevy workout data correctly', () => {
      const description = `Incline Bench Press (Dumbbell)
Set 1: 45 lbs x 8
Set 2: 45 lbs x 8
Set 3: 45 lbs x 8

Chest Press (Machine)
Set 1: 70 lbs x 6
Set 2: 45 lbs x 8
Set 3: 45 lbs x 8

Low Cable Fly Crossovers
Set 1: 17 lbs x 8
Set 2: 17 lbs x 8
Set 3: 17 lbs x 8

Butterfly (Pec Deck)
Set 1: 70 lbs x 8
Set 2: 70 lbs x 8
Set 3: 70 lbs x 8`

      const result = parseHevyWorkout(description)

      expect(result).toEqual({
        exercises: [
          {
            name: 'Incline Bench Press (Dumbbell)',
            sets: [
              { weight: 45, reps: 8 },
              { weight: 45, reps: 8 },
              { weight: 45, reps: 8 }
            ]
          },
          {
            name: 'Chest Press (Machine)',
            sets: [
              { weight: 70, reps: 6 },
              { weight: 45, reps: 8 },
              { weight: 45, reps: 8 }
            ]
          },
          {
            name: 'Low Cable Fly Crossovers',
            sets: [
              { weight: 17, reps: 8 },
              { weight: 17, reps: 8 },
              { weight: 17, reps: 8 }
            ]
          },
          {
            name: 'Butterfly (Pec Deck)',
            sets: [
              { weight: 70, reps: 8 },
              { weight: 70, reps: 8 },
              { weight: 70, reps: 8 }
            ]
          }
        ],
        totalVolume: 45 * 8 * 3 + 70 * 6 + 45 * 8 * 2 + 17 * 8 * 3 + 70 * 8 * 3,
        totalSets: 12
      })
    })

    it('should return null for empty description', () => {
      expect(parseHevyWorkout('')).toBeNull()
      expect(parseHevyWorkout(null as any)).toBeNull()
      expect(parseHevyWorkout(undefined as any)).toBeNull()
    })

    it('should return null for non-Hevy format', () => {
      expect(parseHevyWorkout('Just some random text')).toBeNull()
    })

    it('should handle decimal weights', () => {
      const description = `Bench Press
Set 1: 135.5 lbs x 5
Set 2: 135.5 lbs x 5`

      const result = parseHevyWorkout(description)

      expect(result?.exercises[0].sets[0].weight).toBe(135.5)
    })
  })

  describe('formatHevyWorkout', () => {
    it('should format parsed workout data correctly', () => {
      const parsedWorkout = {
        exercises: [
          {
            name: 'Bench Press',
            sets: [
              { weight: 135, reps: 5 },
              { weight: 135, reps: 5 }
            ]
          },
          {
            name: 'Squats',
            sets: [
              { weight: 185, reps: 3 }
            ]
          }
        ],
        totalVolume: 135 * 5 * 2 + 185 * 3,
        totalSets: 3
      }

      const result = formatHevyWorkout(parsedWorkout)

      expect(result).toBe(`Bench Press
  135 lbs × 5
  135 lbs × 5

Squats
  185 lbs × 3`)
    })

    it('should return empty string for null input', () => {
      expect(formatHevyWorkout(null)).toBe('')
    })
  })
}) 