import type {
  WeatherData,
  WeatherImpact,
  RunningWeatherConditions,
} from './types';

export class WeatherService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
  }

  /**
   * Get current weather for a location
   */
  async getCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
    const response = await fetch(
      `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    return this.transformWeatherData(data);
  }

  /**
   * Get weather forecast for a location
   */
  async getForecast(
    lat: number,
    lon: number,
    days: number = 5
  ): Promise<WeatherData> {
    const response = await fetch(
      `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&cnt=${days * 8}` // 8 readings per day
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    return this.transformForecastData(data);
  }

  /**
   * Analyze weather impact on running performance
   */
  analyzeRunningImpact(weather: RunningWeatherConditions): WeatherImpact {
    const impact: WeatherImpact = {
      performance: 'neutral',
      risk: 'low',
      recommendations: [],
      adjustments: {
        intensity: 0,
        duration: 0,
        route: [],
        clothing: [],
        hydration: [],
      },
    };

    // Temperature analysis
    this.analyzeTemperature(weather, impact);

    // Humidity analysis
    this.analyzeHumidity(weather, impact);

    // Wind analysis
    this.analyzeWind(weather, impact);

    // Precipitation analysis
    this.analyzePrecipitation(weather, impact);

    // UV and air quality analysis
    this.analyzeEnvironmentalFactors(weather, impact);

    return impact;
  }

  /**
   * Get optimal running time based on weather forecast
   */
  getOptimalRunningTime(forecast: WeatherData): {
    time: string;
    reason: string;
  } {
    const hourlyData = forecast.forecast.hourly.slice(0, 48); // Next 48 hours for better options

    // Define realistic running time windows
    const runningWindows = this.getRunningTimeWindows();

    let bestTime = null;
    let bestScore = -Infinity;
    let bestWindow = '';

    // Evaluate each running time window
    runningWindows.forEach(({ name, startHour, endHour, priority }) => {
      const windowHours = hourlyData.filter(hour => {
        const hourDate = new Date(hour.time);
        const hourOfDay = hourDate.getHours();
        return hourOfDay >= startHour && hourOfDay <= endHour;
      });

      if (windowHours.length === 0) return;

      // Find best time within this window
      windowHours.forEach(hour => {
        const score = this.calculateRealisticRunningScore(hour, name, priority);
        if (score > bestScore) {
          bestScore = score;
          bestTime = hour;
          bestWindow = name;
        }
      });
    });

    // Fallback: if no good times found in preferred windows, look at all reasonable hours
    if (!bestTime) {
      const reasonableHours = hourlyData.filter(hour => {
        const hourDate = new Date(hour.time);
        const hourOfDay = hourDate.getHours();
        return hourOfDay >= 5 && hourOfDay <= 21; // 5 AM to 9 PM
      });

      if (reasonableHours.length > 0) {
        reasonableHours.forEach(hour => {
          const score = this.calculateRunningScore(hour);
          if (score > bestScore) {
            bestScore = score;
            bestTime = hour;
            bestWindow = 'general';
          }
        });
      }
    }

    // Final fallback: use the first reasonable hour
    if (!bestTime) {
      bestTime =
        hourlyData.find(hour => {
          const hourDate = new Date(hour.time);
          const hourOfDay = hourDate.getHours();
          return hourOfDay >= 6 && hourOfDay <= 20;
        }) || hourlyData[0];
      bestWindow = 'fallback';
    }

    const time = new Date(bestTime.time).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const reason = this.getOptimalTimeReason(bestTime, bestWindow);

    return { time, reason };
  }

  /**
   * Calculate running score for a specific hour
   */
  private calculateRunningScore(hour: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    precipitation: number;
    uvIndex: number;
  }): number {
    let score = 100;

    // Temperature scoring (optimal: 10-15°C)
    if (hour.temperature < 5 || hour.temperature > 25) {
      score -= 30;
    } else if (hour.temperature < 10 || hour.temperature > 20) {
      score -= 15;
    }

    // Humidity scoring (optimal: 40-60%)
    if (hour.humidity > 80) {
      score -= 20;
    } else if (hour.humidity > 70) {
      score -= 10;
    }

    // Wind scoring (optimal: < 15 km/h)
    if (hour.windSpeed > 25) {
      score -= 25;
    } else if (hour.windSpeed > 15) {
      score -= 10;
    }

    // Precipitation scoring
    if (hour.precipitation > 2) {
      score -= 30;
    } else if (hour.precipitation > 0.5) {
      score -= 15;
    }

    // UV scoring (optimal: < 5)
    if (hour.uvIndex > 8) {
      score -= 20;
    } else if (hour.uvIndex > 5) {
      score -= 10;
    }

    return score;
  }

  /**
   * Get reason for optimal running time
   */
  private getOptimalTimeReason(
    hour: {
      time: string;
      temperature: number;
      humidity: number;
      windSpeed: number;
      precipitation: number;
      uvIndex: number;
    },
    windowName: string
  ): string {
    const reasons = [];
    const hourDate = new Date(hour.time);
    const hourOfDay = hourDate.getHours();

    // Weather condition reasons
    if (hour.temperature >= 10 && hour.temperature <= 20) {
      reasons.push('comfortable temperature');
    } else if (hour.temperature >= 5 && hour.temperature <= 25) {
      reasons.push('acceptable temperature');
    }

    if (hour.humidity <= 70) {
      reasons.push('low humidity');
    } else if (hour.humidity <= 80) {
      reasons.push('moderate humidity');
    }

    if (hour.windSpeed <= 15) {
      reasons.push('light winds');
    } else if (hour.windSpeed <= 25) {
      reasons.push('moderate winds');
    }

    if (hour.precipitation <= 0.5) {
      reasons.push('dry conditions');
    } else if (hour.precipitation <= 2) {
      reasons.push('light precipitation');
    }

    if (hour.uvIndex <= 5) {
      reasons.push('moderate UV');
    } else if (hour.uvIndex <= 8) {
      reasons.push('high UV');
    }

    // Time-specific reasons
    if (windowName.includes('early_morning')) {
      reasons.push('early morning (6-8 AM) - cooler temps, less traffic');
    } else if (windowName.includes('morning')) {
      reasons.push('morning (8-10 AM) - popular running time');
    } else if (windowName.includes('late_afternoon')) {
      reasons.push('late afternoon (4-6 PM) - good daylight, moderate temps');
    } else if (windowName.includes('early_evening')) {
      reasons.push('early evening (6-8 PM) - cooling down, good visibility');
    } else if (windowName.includes('evening')) {
      reasons.push('evening (8-9 PM) - cooler temperatures');
    } else if (windowName.includes('pre_dawn')) {
      reasons.push('pre-dawn (5-6 AM) - very early but often best weather');
    } else if (windowName.includes('late_morning')) {
      reasons.push('late morning (10-12 PM) - good daylight');
    } else if (windowName.includes('early_afternoon')) {
      reasons.push('early afternoon (12-2 PM) - avoid if possible due to heat');
    }

    // Safety and practical considerations
    if (hourOfDay >= 6 && hourOfDay <= 20) {
      reasons.push('good daylight for safety');
    } else if (hourOfDay >= 5 && hourOfDay <= 21) {
      reasons.push('reasonable running hours');
    }

    return reasons.length > 0
      ? `Best conditions: ${reasons.join(', ')}`
      : 'Acceptable conditions for running';
  }

  /**
   * Analyze temperature impact
   */
  private analyzeTemperature(
    weather: RunningWeatherConditions,
    impact: WeatherImpact
  ): void {
    const { temperature } = weather;

    if (temperature < 0) {
      impact.performance = 'negative';
      impact.risk = 'medium';
      impact.recommendations.push('Dress in layers, warm up thoroughly');
      impact.adjustments.intensity -= 1;
      impact.adjustments.duration -= 10;
      impact.adjustments.clothing.push(
        'Thermal base layer',
        'Windproof jacket',
        'Gloves',
        'Hat'
      );
    } else if (temperature < 10) {
      impact.recommendations.push('Wear appropriate layers, consider gloves');
      impact.adjustments.clothing.push('Long sleeves', 'Light jacket');
    } else if (temperature >= 10 && temperature <= 20) {
      impact.performance = 'positive';
      impact.recommendations.push('Optimal temperature for running');
    } else if (temperature > 20 && temperature <= 25) {
      impact.recommendations.push('Stay hydrated, run in shade if possible');
      impact.adjustments.hydration.push(
        'Drink 500ml before run',
        'Carry water'
      );
    } else if (temperature > 25) {
      impact.performance = 'negative';
      impact.risk = 'high';
      impact.recommendations.push(
        'High heat - reduce intensity, stay hydrated'
      );
      impact.adjustments.intensity -= 2;
      impact.adjustments.duration -= 20;
      impact.adjustments.hydration.push(
        'Electrolyte replacement',
        'Frequent water breaks'
      );
    }
  }

  /**
   * Analyze humidity impact
   */
  private analyzeHumidity(
    weather: RunningWeatherConditions,
    impact: WeatherImpact
  ): void {
    const { humidity } = weather;

    if (humidity > 80) {
      impact.performance = 'negative';
      impact.recommendations.push(
        'High humidity - reduce intensity, stay hydrated'
      );
      impact.adjustments.intensity -= 1;
      impact.adjustments.duration -= 15;
      impact.adjustments.hydration.push('Electrolyte replacement');
    } else if (humidity > 70) {
      impact.recommendations.push('Moderate humidity - stay hydrated');
      impact.adjustments.hydration.push('Extra water intake');
    }
  }

  /**
   * Analyze wind impact
   */
  private analyzeWind(
    weather: RunningWeatherConditions,
    impact: WeatherImpact
  ): void {
    const { windSpeed } = weather;

    if (windSpeed > 25) {
      impact.performance = 'negative';
      impact.risk = 'medium';
      impact.recommendations.push('High winds - consider indoor alternatives');
      impact.adjustments.intensity -= 1;
      impact.adjustments.route.push('Sheltered routes', 'Avoid open areas');
    } else if (windSpeed > 15) {
      impact.recommendations.push('Moderate winds - plan route accordingly');
      impact.adjustments.route.push(
        'Headwind on way out, tailwind on way back'
      );
    }
  }

  /**
   * Analyze precipitation impact
   */
  private analyzePrecipitation(
    weather: RunningWeatherConditions,
    impact: WeatherImpact
  ): void {
    const { precipitation } = weather;

    if (precipitation > 5) {
      impact.performance = 'negative';
      impact.risk = 'medium';
      impact.recommendations.push('Heavy rain - consider indoor alternatives');
      impact.adjustments.intensity -= 1;
      impact.adjustments.duration -= 10;
    } else if (precipitation > 1) {
      impact.recommendations.push('Light rain - wear appropriate gear');
      impact.adjustments.clothing.push('Waterproof jacket', 'Waterproof shoes');
    }
  }

  /**
   * Analyze environmental factors
   */
  private analyzeEnvironmentalFactors(
    weather: RunningWeatherConditions,
    impact: WeatherImpact
  ): void {
    const { uvIndex, airQuality } = weather;

    if (uvIndex > 8) {
      impact.risk = 'high';
      impact.recommendations.push('High UV - run early morning or evening');
      impact.adjustments.route.push('Shaded routes', 'Avoid midday sun');
    } else if (uvIndex > 5) {
      impact.recommendations.push('Moderate UV - wear sunscreen');
    }

    if (airQuality > 100) {
      impact.performance = 'negative';
      impact.risk = 'high';
      impact.recommendations.push(
        'Poor air quality - consider indoor alternatives'
      );
      impact.adjustments.intensity -= 1;
    }
  }

  /**
   * Transform OpenWeatherMap data to our format
   */
  private transformWeatherData(data: {
    name: string;
    sys: { country: string };
    coord: { lat: number; lon: number };
    timezone: number; // Will be converted to string
    main: {
      temp: number;
      feels_like: number;
      humidity: number;
      dew_point: number;
      pressure: number;
    };
    wind: { speed: number; deg: number };
    rain?: { '1h': number };
    visibility: number;
    weather: Array<{ main: string; icon: string }>;
  }): WeatherData {
    return {
      location: {
        name: data.name,
        country: data.sys.country,
        lat: data.coord.lat,
        lon: data.coord.lon,
        timezone: data.timezone.toString(),
      },
      current: {
        temperature: data.main.temp,
        feelsLike: data.main.feels_like,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed * 3.6, // Convert m/s to km/h
        windDirection: data.wind.deg,
        precipitation: data.rain?.['1h'] || 0,
        uvIndex: 0, // Not available in current weather
        airQuality: 0, // Not available in current weather
        dewPoint: data.main.dew_point,
        pressure: data.main.pressure,
        visibility: data.visibility / 1000, // Convert m to km
        weatherCondition: data.weather[0].main.toLowerCase(),
        weatherIcon: data.weather[0].icon,
        lastUpdated: new Date().toISOString(),
      },
      forecast: {
        hourly: [],
        daily: [],
      },
    };
  }

  /**
   * Transform forecast data
   */
  private transformForecastData(data: {
    city: {
      name: string;
      country: string;
      coord: { lat: number; lon: number };
      timezone: number;
    };
    list: Array<{
      dt: number;
      main: {
        temp: number;
        feels_like: number;
        humidity: number;
      };
      wind: { speed: number; deg: number };
      rain?: { '3h': number };
      weather: Array<{ main: string; icon: string }>;
    }>;
  }): WeatherData {
    // This would need to be implemented based on the actual API response
    // For now, returning a basic structure
    return {
      location: {
        name: data.city.name,
        country: data.city.country,
        lat: data.city.coord.lat,
        lon: data.city.coord.lon,
        timezone: data.city.timezone.toString(),
      },
      current: {
        temperature: 0,
        feelsLike: 0,
        humidity: 0,
        windSpeed: 0,
        windDirection: 0,
        precipitation: 0,
        uvIndex: 0,
        airQuality: 0,
        dewPoint: 0,
        pressure: 0,
        visibility: 0,
        weatherCondition: '',
        weatherIcon: '',
        lastUpdated: new Date().toISOString(),
      },
      forecast: {
        hourly: data.list.map(
          (item: {
            dt: number;
            main: {
              temp: number;
              feels_like: number;
              humidity: number;
            };
            wind: { speed: number; deg: number };
            rain?: { '3h': number };
            weather: Array<{ main: string; icon: string }>;
          }) => ({
            time: new Date(item.dt * 1000).toISOString(),
            temperature: item.main.temp,
            feelsLike: item.main.feels_like,
            humidity: item.main.humidity,
            windSpeed: item.wind.speed * 3.6,
            windDirection: item.wind.deg,
            precipitation: item.rain?.['3h'] || 0,
            uvIndex: 0,
            weatherCondition: item.weather[0].main.toLowerCase(),
            weatherIcon: item.weather[0].icon,
          })
        ),
        daily: [],
      },
    };
  }

  /**
   * Define realistic running time windows with priorities
   */
  private getRunningTimeWindows(): Array<{
    name: string;
    startHour: number;
    endHour: number;
    priority: number;
  }> {
    return [
      // Morning windows (most popular)
      { name: 'early_morning', startHour: 6, endHour: 8, priority: 1.2 },
      { name: 'morning', startHour: 8, endHour: 10, priority: 1.1 },

      // Afternoon windows
      { name: 'early_afternoon', startHour: 12, endHour: 14, priority: 0.8 },
      { name: 'late_afternoon', startHour: 16, endHour: 18, priority: 1.0 },

      // Evening windows (second most popular)
      { name: 'early_evening', startHour: 18, endHour: 20, priority: 1.1 },
      { name: 'evening', startHour: 20, endHour: 21, priority: 0.9 },

      // Extended options for flexibility
      { name: 'pre_dawn', startHour: 5, endHour: 6, priority: 0.7 },
      { name: 'late_morning', startHour: 10, endHour: 12, priority: 0.9 },
    ];
  }

  /**
   * Calculate realistic running score considering time windows and preferences
   */
  private calculateRealisticRunningScore(
    hour: {
      time: string;
      temperature: number;
      humidity: number;
      windSpeed: number;
      precipitation: number;
      uvIndex: number;
    },
    windowName: string,
    priority: number
  ): number {
    let score = this.calculateRunningScore(hour);

    // Apply time window priority
    score *= priority;

    // Additional time-based adjustments
    const hourDate = new Date(hour.time);
    const hourOfDay = hourDate.getHours();

    // Safety adjustments for very early/late hours
    if (hourOfDay < 6 || hourOfDay > 21) {
      score *= 0.5; // Significantly reduce score for unsafe hours
    }

    // Daylight considerations
    const isDaylight = hourOfDay >= 6 && hourOfDay <= 20;
    if (!isDaylight) {
      score *= 0.7; // Reduce score for dark hours
    }

    // Temperature adjustments for different times
    if (windowName.includes('morning')) {
      // Morning runners often prefer cooler temps
      if (hour.temperature >= 5 && hour.temperature <= 15) {
        score *= 1.1;
      }
    } else if (windowName.includes('evening')) {
      // Evening runners might prefer slightly warmer temps
      if (hour.temperature >= 10 && hour.temperature <= 20) {
        score *= 1.05;
      }
    }

    // UV index is less important in early morning/evening
    if (
      windowName.includes('early_morning') ||
      windowName.includes('evening')
    ) {
      if (hour.uvIndex <= 3) {
        score *= 1.1; // Bonus for low UV during these times
      }
    }

    return score;
  }
}
