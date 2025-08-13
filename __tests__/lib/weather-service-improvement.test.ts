import { WeatherService } from '@/lib/weather/service';

describe('WeatherService - Improvement Demo', () => {
  let weatherService: WeatherService;

  beforeEach(() => {
    weatherService = new WeatherService('test-api-key');
  });

  it('should demonstrate the improvement from 2 AM to realistic times', () => {
    // Mock forecast with 2 AM having perfect weather but being unrealistic
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

    console.log('🏃‍♂️ Best time to run:', result.time);
    console.log('📝 Reason:', result.reason);

    // Verify it's not suggesting 2 AM
    expect(result.time).not.toBe('2:00 AM');

    // Verify it's suggesting a realistic time
    expect(['7:00 AM', '6:00 PM', '8:00 AM', '7:00 PM', '1:00 PM']).toContain(
      result.time
    );

    // Verify the reason is helpful
    expect(result.reason).toContain('comfortable temperature');
    expect(result.reason).toContain('light winds');
  });
});
