import { WeatherService } from '@/lib/weather/service';
import type { RunningWeatherConditions } from '@/lib/weather/types';

// Mock fetch globally
global.fetch = jest.fn();

describe('WeatherService', () => {
  let weatherService: WeatherService;

  beforeEach(() => {
    weatherService = new WeatherService('test-api-key');
    jest.clearAllMocks();
  });

  describe('analyzeRunningImpact', () => {
    it('should return neutral impact for optimal conditions', () => {
      const weather: RunningWeatherConditions = {
        temperature: 15,
        humidity: 50,
        windSpeed: 10,
        windDirection: 180,
        precipitation: 0,
        uvIndex: 3,
        airQuality: 30,
        feelsLike: 15,
        dewPoint: 5,
        weatherCondition: 'clear',
      };

      const impact = weatherService.analyzeRunningImpact(weather);

      expect(impact.performance).toBe('positive');
      expect(impact.risk).toBe('low');
      expect(impact.recommendations).toContain(
        'Optimal temperature for running'
      );
    });

    it('should return negative impact for high temperature', () => {
      const weather: RunningWeatherConditions = {
        temperature: 30,
        humidity: 70,
        windSpeed: 5,
        windDirection: 180,
        precipitation: 0,
        uvIndex: 8,
        airQuality: 40,
        feelsLike: 32,
        dewPoint: 20,
        weatherCondition: 'clear',
      };

      const impact = weatherService.analyzeRunningImpact(weather);

      expect(impact.performance).toBe('negative');
      expect(impact.risk).toBe('high');
      expect(impact.adjustments.intensity).toBe(-2);
      expect(impact.adjustments.duration).toBe(-20);
      expect(impact.recommendations).toContain(
        'High heat - reduce intensity, stay hydrated'
      );
    });

    it('should return negative impact for cold temperature', () => {
      const weather: RunningWeatherConditions = {
        temperature: -5,
        humidity: 60,
        windSpeed: 15,
        windDirection: 180,
        precipitation: 0,
        uvIndex: 2,
        airQuality: 25,
        feelsLike: -8,
        dewPoint: -10,
        weatherCondition: 'clear',
      };

      const impact = weatherService.analyzeRunningImpact(weather);

      expect(impact.performance).toBe('negative');
      expect(impact.risk).toBe('medium');
      expect(impact.adjustments.intensity).toBe(-1);
      expect(impact.adjustments.duration).toBe(-10);
      expect(impact.recommendations).toContain(
        'Dress in layers, warm up thoroughly'
      );
    });

    it('should return negative impact for high humidity', () => {
      const weather: RunningWeatherConditions = {
        temperature: 20,
        humidity: 85,
        windSpeed: 5,
        windDirection: 180,
        precipitation: 0,
        uvIndex: 4,
        airQuality: 35,
        feelsLike: 25,
        dewPoint: 18,
        weatherCondition: 'clear',
      };

      const impact = weatherService.analyzeRunningImpact(weather);

      expect(impact.performance).toBe('negative');
      expect(impact.adjustments.intensity).toBe(-1);
      expect(impact.adjustments.duration).toBe(-15);
      expect(impact.recommendations).toContain(
        'High humidity - reduce intensity, stay hydrated'
      );
    });

    it('should return negative impact for high winds', () => {
      const weather: RunningWeatherConditions = {
        temperature: 15,
        humidity: 50,
        windSpeed: 30,
        windDirection: 180,
        precipitation: 0,
        uvIndex: 3,
        airQuality: 30,
        feelsLike: 12,
        dewPoint: 5,
        weatherCondition: 'clear',
      };

      const impact = weatherService.analyzeRunningImpact(weather);

      expect(impact.performance).toBe('negative');
      expect(impact.risk).toBe('medium');
      expect(impact.adjustments.intensity).toBe(-1);
      expect(impact.recommendations).toContain(
        'High winds - consider indoor alternatives'
      );
    });

    it('should return negative impact for heavy precipitation', () => {
      const weather: RunningWeatherConditions = {
        temperature: 15,
        humidity: 80,
        windSpeed: 10,
        windDirection: 180,
        precipitation: 8,
        uvIndex: 2,
        airQuality: 25,
        feelsLike: 13,
        dewPoint: 12,
        weatherCondition: 'rain',
      };

      const impact = weatherService.analyzeRunningImpact(weather);

      expect(impact.performance).toBe('negative');
      expect(impact.risk).toBe('medium');
      expect(impact.adjustments.intensity).toBe(-1);
      expect(impact.adjustments.duration).toBe(-10);
      expect(impact.recommendations).toContain(
        'Heavy rain - consider indoor alternatives'
      );
    });

    it('should return high risk for poor air quality', () => {
      const weather: RunningWeatherConditions = {
        temperature: 15,
        humidity: 50,
        windSpeed: 5,
        windDirection: 180,
        precipitation: 0,
        uvIndex: 3,
        airQuality: 150,
        feelsLike: 15,
        dewPoint: 5,
        weatherCondition: 'clear',
      };

      const impact = weatherService.analyzeRunningImpact(weather);

      expect(impact.performance).toBe('negative');
      expect(impact.risk).toBe('high');
      expect(impact.adjustments.intensity).toBe(-1);
      expect(impact.recommendations).toContain(
        'Poor air quality - consider indoor alternatives'
      );
    });
  });

  describe('getCurrentWeather', () => {
    it('should fetch and transform weather data', async () => {
      const mockResponse = {
        name: 'London',
        sys: { country: 'GB' },
        coord: { lat: 51.5074, lon: -0.1278 },
        timezone: 0,
        main: {
          temp: 15,
          feels_like: 14,
          humidity: 60,
          pressure: 1013,
          dew_point: 7,
        },
        wind: { speed: 5.5, deg: 180 },
        rain: { '1h': 0 },
        visibility: 10000,
        weather: [{ main: 'Clear', icon: '01d' }],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await weatherService.getCurrentWeather(51.5074, -0.1278);

      expect(result.location.name).toBe('London');
      expect(result.current.temperature).toBe(15);
      expect(result.current.windSpeed).toBe(19.8); // 5.5 m/s * 3.6
      expect(result.current.weatherCondition).toBe('clear');
    });

    it('should throw error for API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(
        weatherService.getCurrentWeather(51.5074, -0.1278)
      ).rejects.toThrow('Weather API error: 401');
    });
  });

  describe('getOptimalRunningTime', () => {
    it('should prefer realistic running hours over 2 AM', () => {
      // Mock forecast data with 2 AM having perfect weather but 7 AM having good weather
      const mockForecast = {
        location: {
          name: 'Test City',
          country: 'US',
          lat: 40,
          lon: -74,
          timezone: 'America/New_York',
        },
        current: {
          temperature: 15,
          feelsLike: 15,
          humidity: 60,
          windSpeed: 10,
          windDirection: 180,
          precipitation: 0,
          uvIndex: 3,
          airQuality: 30,
          dewPoint: 5,
          pressure: 1013,
          visibility: 10,
          weatherCondition: 'clear',
          weatherIcon: '01d',
          lastUpdated: new Date().toISOString(),
        },
        forecast: {
          hourly: [
            // 2 AM - perfect weather but unrealistic time
            {
              time: '2024-01-01T02:00:00Z',
              temperature: 12,
              feelsLike: 11,
              humidity: 50,
              windSpeed: 5,
              windDirection: 180,
              precipitation: 0,
              uvIndex: 0,
              weatherCondition: 'clear',
              weatherIcon: '01n',
            },
            // 7 AM - good weather and realistic time
            {
              time: '2024-01-01T07:00:00Z',
              temperature: 14,
              feelsLike: 13,
              humidity: 55,
              windSpeed: 8,
              windDirection: 180,
              precipitation: 0,
              uvIndex: 2,
              weatherCondition: 'clear',
              weatherIcon: '01d',
            },
            // 6 PM - decent weather and realistic time
            {
              time: '2024-01-01T18:00:00Z',
              temperature: 16,
              feelsLike: 15,
              humidity: 60,
              windSpeed: 12,
              windDirection: 180,
              precipitation: 0,
              uvIndex: 4,
              weatherCondition: 'clear',
              weatherIcon: '01d',
            },
          ],
          daily: [],
        },
      };

      const result = weatherService.getOptimalRunningTime(mockForecast);

      // Should not be 2 AM
      expect(result.time).not.toBe('2:00 AM');

      // Should be a realistic time (not 2 AM)
      expect(result.time).not.toBe('2:00 AM');
      expect([
        '7:00 AM',
        '6:00 PM',
        '8:00 AM',
        '7:00 PM',
        '10:00 AM',
        '1:00 PM',
      ]).toContain(result.time);

      // Should include realistic reasoning
      expect(result.reason).toContain('comfortable temperature');
      expect(result.reason).toContain('comfortable temperature');
    });

    it('should prioritize morning and evening windows', () => {
      const mockForecast = {
        location: {
          name: 'Test City',
          country: 'US',
          lat: 40,
          lon: -74,
          timezone: 'America/New_York',
        },
        current: {
          temperature: 15,
          feelsLike: 14,
          humidity: 60,
          windSpeed: 10,
          windDirection: 180,
          precipitation: 0,
          uvIndex: 3,
          airQuality: 30,
          dewPoint: 7,
          pressure: 1013,
          visibility: 10,
          weatherCondition: 'clear',
          weatherIcon: '01d',
          lastUpdated: '2024-01-01T12:00:00Z',
        },
        forecast: {
          hourly: [
            // Morning window (6-8 AM) - high priority
            {
              time: '2024-01-01T07:00:00Z',
              temperature: 13,
              feelsLike: 12,
              humidity: 55,
              windSpeed: 8,
              windDirection: 180,
              precipitation: 0,
              uvIndex: 2,
              weatherCondition: 'clear',
              weatherIcon: '01d',
            },
            // Afternoon window (12-2 PM) - lower priority
            {
              time: '2024-01-01T13:00:00Z',
              temperature: 20,
              feelsLike: 22,
              humidity: 65,
              windSpeed: 10,
              windDirection: 180,
              precipitation: 0,
              uvIndex: 7,
              weatherCondition: 'clear',
              weatherIcon: '01d',
            },
            // Evening window (6-8 PM) - high priority
            {
              time: '2024-01-01T19:00:00Z',
              temperature: 15,
              feelsLike: 14,
              humidity: 60,
              windSpeed: 12,
              windDirection: 180,
              precipitation: 0,
              uvIndex: 3,
              weatherCondition: 'clear',
              weatherIcon: '01d',
            },
          ],
          daily: [],
        },
      };

      const result = weatherService.getOptimalRunningTime(mockForecast);

      // Should prefer morning or evening over afternoon
      expect(['7:00 AM', '7:00 PM', '8:00 AM', '6:00 PM']).toContain(
        result.time
      );
      expect(result.time).not.toBe('1:00 PM');
    });

    it('should handle safety considerations for very early/late hours', () => {
      const mockForecast = {
        location: {
          name: 'Test City',
          country: 'US',
          lat: 40,
          lon: -74,
          timezone: 'America/New_York',
        },
        current: {
          temperature: 15,
          feelsLike: 14,
          humidity: 60,
          windSpeed: 10,
          windDirection: 180,
          precipitation: 0,
          uvIndex: 3,
          airQuality: 30,
          dewPoint: 7,
          pressure: 1013,
          visibility: 10,
          weatherCondition: 'clear',
          weatherIcon: '01d',
          lastUpdated: '2024-01-01T12:00:00Z',
        },
        forecast: {
          hourly: [
            // 3 AM - unsafe hour
            {
              time: '2024-01-01T03:00:00Z',
              temperature: 10,
              feelsLike: 9,
              humidity: 50,
              windSpeed: 5,
              windDirection: 180,
              precipitation: 0,
              uvIndex: 0,
              weatherCondition: 'clear',
              weatherIcon: '01n',
            },
            // 6 AM - safe hour
            {
              time: '2024-01-01T06:00:00Z',
              temperature: 12,
              feelsLike: 11,
              humidity: 55,
              windSpeed: 8,
              windDirection: 180,
              precipitation: 0,
              uvIndex: 1,
              weatherCondition: 'clear',
              weatherIcon: '01d',
            },
          ],
          daily: [],
        },
      };

      const result = weatherService.getOptimalRunningTime(mockForecast);

      // Should prefer a safe hour over 3 AM
      expect(result.time).not.toBe('3:00 AM');
      expect([
        '6:00 AM',
        '7:00 AM',
        '8:00 AM',
        '6:00 PM',
        '7:00 PM',
        '10:00 PM',
      ]).toContain(result.time);
    });

    it('should provide meaningful reasons for the chosen time', () => {
      const mockForecast = {
        location: {
          name: 'Test City',
          country: 'US',
          lat: 40,
          lon: -74,
          timezone: 'America/New_York',
        },
        current: {
          temperature: 15,
          feelsLike: 14,
          humidity: 60,
          windSpeed: 10,
          windDirection: 180,
          precipitation: 0,
          uvIndex: 3,
          airQuality: 30,
          dewPoint: 7,
          pressure: 1013,
          visibility: 10,
          weatherCondition: 'clear',
          weatherIcon: '01d',
          lastUpdated: '2024-01-01T12:00:00Z',
        },
        forecast: {
          hourly: [
            {
              time: '2024-01-01T07:00:00Z',
              temperature: 14,
              feelsLike: 13,
              humidity: 55,
              windSpeed: 8,
              windDirection: 180,
              precipitation: 0,
              uvIndex: 2,
              weatherCondition: 'clear',
              weatherIcon: '01d',
            },
          ],
          daily: [],
        },
      };

      const result = weatherService.getOptimalRunningTime(mockForecast);

      expect(result.reason).toContain('comfortable temperature');
      expect(result.reason).toContain('low humidity');
      expect(result.reason).toContain('light winds');
    });

    it('should fallback to reasonable hours when no ideal times available', () => {
      const mockForecast = {
        location: {
          name: 'Test City',
          country: 'US',
          lat: 40,
          lon: -74,
          timezone: 'America/New_York',
        },
        current: {
          temperature: 15,
          feelsLike: 14,
          humidity: 60,
          windSpeed: 10,
          windDirection: 180,
          precipitation: 0,
          uvIndex: 3,
          airQuality: 30,
          dewPoint: 7,
          pressure: 1013,
          visibility: 10,
          weatherCondition: 'clear',
          weatherIcon: '01d',
          lastUpdated: '2024-01-01T12:00:00Z',
        },
        forecast: {
          hourly: [
            // Only available times are outside preferred windows
            {
              time: '2024-01-01T10:00:00Z',
              temperature: 18,
              feelsLike: 19,
              humidity: 70,
              windSpeed: 15,
              windDirection: 180,
              precipitation: 1,
              uvIndex: 6,
              weatherCondition: 'cloudy',
              weatherIcon: '02d',
            },
            {
              time: '2024-01-01T14:00:00Z',
              temperature: 22,
              feelsLike: 24,
              humidity: 75,
              windSpeed: 18,
              windDirection: 180,
              precipitation: 2,
              uvIndex: 8,
              weatherCondition: 'rain',
              weatherIcon: '10d',
            },
          ],
          daily: [],
        },
      };

      const result = weatherService.getOptimalRunningTime(mockForecast);

      // Should still return a reasonable time
      expect(result.time).toBeDefined();
      expect(result.reason).toContain('conditions');
    });
  });

  describe('calculateRunningScore', () => {
    it('should score optimal conditions highly', () => {
      const optimalHour = {
        temperature: 15,
        humidity: 50,
        windSpeed: 10,
        precipitation: 0,
        uvIndex: 3,
      };

      const score = (weatherService as any).calculateRunningScore(optimalHour);
      expect(score).toBeGreaterThan(80);
    });

    it('should penalize extreme conditions', () => {
      const extremeHour = {
        temperature: 35,
        humidity: 90,
        windSpeed: 30,
        precipitation: 5,
        uvIndex: 10,
      };

      const score = (weatherService as any).calculateRunningScore(extremeHour);
      expect(score).toBeLessThan(50);
    });
  });
});
