import { formatDistance, formatPace, getActivityIcon } from '@/lib/utils'

describe('formatDistance', () => {
  it('formats distance in meters to km', () => {
    expect(formatDistance(5000, 'km')).toBe('5.0 km')
    expect(formatDistance(10000, 'km')).toBe('10.0 km')
  })

  it('formats distance in meters to miles', () => {
    expect(formatDistance(5000, 'miles')).toBe('3.1 mi')
    expect(formatDistance(10000, 'miles')).toBe('6.2 mi')
  })
})

describe('formatPace', () => {
  it('formats pace in seconds per km', () => {
    expect(formatPace(300, 'min/km')).toBe('5:00/km')
    expect(formatPace(240, 'min/km')).toBe('4:00/km')
  })

  it('formats pace in seconds per mile', () => {
    expect(formatPace(480, 'min/mile')).toBe('12:52/mi')
    expect(formatPace(360, 'min/mile')).toBe('9:39/mi')
  })
})

describe('getActivityIcon', () => {
  it('returns correct icons for different activity types', () => {
    expect(getActivityIcon('Ride')).toBe('🚴‍♂️')
    expect(getActivityIcon('Swim')).toBe('🏊‍♂️')
    expect(getActivityIcon('Hike')).toBe('🥾')
    expect(getActivityIcon('Walk')).toBe('🚶‍♂️')
    expect(getActivityIcon('VirtualRide')).toBe('🚴‍♂️')
    expect(getActivityIcon('EBikeRide')).toBe('🚴‍♂️⚡')
  })

  it('distinguishes between indoor and outdoor runs', () => {
    expect(getActivityIcon('Run', false)).toBe('🏃‍♂️') // Outdoor run
    expect(getActivityIcon('Run', true)).toBe('🏃‍♂️🏠') // Indoor run
  })

  it('returns weight training icons for workout activities', () => {
    expect(getActivityIcon('Workout')).toBe('🏋️‍♂️')
    expect(getActivityIcon('WeightTraining')).toBe('🏋️‍♂️')
  })

  it('returns default icon for unknown activity types', () => {
    expect(getActivityIcon('UnknownActivity')).toBe('🏃‍♂️')
    expect(getActivityIcon('')).toBe('🏃‍♂️')
  })

  it('handles undefined trainer flag for runs', () => {
    expect(getActivityIcon('Run')).toBe('🏃‍♂️') // Defaults to outdoor run
    expect(getActivityIcon('Run', undefined)).toBe('🏃‍♂️')
  })
}) 