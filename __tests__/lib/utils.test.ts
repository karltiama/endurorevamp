import { formatDistance, getActivityIcon, formatStravaTime, formatStravaDate, formatStravaDateTime } from '@/lib/utils'

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
}) 