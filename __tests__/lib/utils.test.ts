import { 
  formatDistance, 
  formatPace, 
  convertDistance, 
  convertPace, 
  getDistanceUnit, 
  getPaceUnit,
  CONVERSION_CONSTANTS 
} from '@/lib/utils'

describe('Unit Conversion Utilities', () => {
  describe('formatDistance', () => {
    it('formats distance in kilometers by default', () => {
      expect(formatDistance(5000)).toBe('5.0 km')
      expect(formatDistance(1500)).toBe('1.5 km')
      expect(formatDistance(500)).toBe('0.5 km')
    })

    it('formats distance in miles when specified', () => {
      expect(formatDistance(5000, 'miles')).toBe('3.1 mi')
      expect(formatDistance(1609.34, 'miles')).toBe('1.0 mi') // 1 mile = 1609.34 meters
      expect(formatDistance(3218.69, 'miles')).toBe('2.0 mi') // 2 miles
    })

    it('handles zero distance', () => {
      expect(formatDistance(0)).toBe('0.0 km')
      expect(formatDistance(0, 'miles')).toBe('0.0 mi')
    })
  })

  describe('formatPace', () => {
    it('formats pace in min/km by default', () => {
      expect(formatPace(300)).toBe('5:00/km') // 5 minutes per km
      expect(formatPace(330)).toBe('5:30/km') // 5 minutes 30 seconds per km
      expect(formatPace(275)).toBe('4:35/km') // 4 minutes 35 seconds per km
    })

    it('formats pace in min/mile when specified', () => {
      expect(formatPace(300, 'min/mile')).toBe('8:02/mi') // ~8:02 per mile (300 * 1.60934 / 60 = 8.047 minutes)
      expect(formatPace(240, 'min/mile')).toBe('6:26/mi') // ~6:26 per mile
    })

    it('handles zero pace', () => {
      expect(formatPace(0)).toBe('0:00/km')
      expect(formatPace(0, 'min/mile')).toBe('0:00/mi')
    })

    it('rounds seconds correctly', () => {
      expect(formatPace(305)).toBe('5:05/km') // Should round to 5 seconds
      expect(formatPace(302)).toBe('5:02/km') // Should round to 2 seconds
    })
  })

  describe('convertDistance', () => {
    it('converts meters to kilometers', () => {
      expect(convertDistance(5000, 'km')).toBe(5.0)
      expect(convertDistance(1500, 'km')).toBe(1.5)
    })

    it('converts meters to miles', () => {
      expect(convertDistance(1609.34, 'miles')).toBeCloseTo(1.0, 2)
      expect(convertDistance(5000, 'miles')).toBeCloseTo(3.107, 2)
    })

    it('handles zero distance', () => {
      expect(convertDistance(0, 'km')).toBe(0)
      expect(convertDistance(0, 'miles')).toBe(0)
    })
  })

  describe('convertPace', () => {
    it('returns same pace for min/km', () => {
      expect(convertPace(300, 'min/km')).toBe(300)
      expect(convertPace(240, 'min/km')).toBe(240)
    })

    it('converts pace from min/km to min/mile', () => {
      const paceKm = 300 // 5:00/km
      const paceMile = convertPace(paceKm, 'min/mile')
      expect(paceMile).toBeCloseTo(paceKm * CONVERSION_CONSTANTS.MILES_TO_KM, 1)
    })

    it('handles zero pace', () => {
      expect(convertPace(0, 'min/km')).toBe(0)
      expect(convertPace(0, 'min/mile')).toBe(0)
    })
  })

  describe('getDistanceUnit', () => {
    it('returns correct unit strings', () => {
      expect(getDistanceUnit('km')).toBe('km')
      expect(getDistanceUnit('miles')).toBe('mi')
    })
  })

  describe('getPaceUnit', () => {
    it('returns correct pace unit strings', () => {
      expect(getPaceUnit('min/km')).toBe('/km')
      expect(getPaceUnit('min/mile')).toBe('/mi')
    })
  })

  describe('CONVERSION_CONSTANTS', () => {
    it('has correct conversion factors', () => {
      expect(CONVERSION_CONSTANTS.KM_TO_MILES).toBeCloseTo(0.621371, 5)
      expect(CONVERSION_CONSTANTS.MILES_TO_KM).toBeCloseTo(1.60934, 5)
    })

    it('conversion factors are reciprocals', () => {
      const product = CONVERSION_CONSTANTS.KM_TO_MILES * CONVERSION_CONSTANTS.MILES_TO_KM
      expect(product).toBeCloseTo(1.0, 3)
    })
  })
}) 