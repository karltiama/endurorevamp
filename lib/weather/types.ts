export interface WeatherData {
  location: {
    name: string;
    country: string;
    lat: number;
    lon: number;
    timezone: string;
  };
  current: {
    temperature: number; // Celsius
    feelsLike: number; // Celsius
    humidity: number; // Percentage
    windSpeed: number; // km/h
    windDirection: number; // Degrees
    precipitation: number; // mm
    uvIndex: number; // 0-11 scale
    airQuality: number; // AQI
    dewPoint: number; // Celsius
    pressure: number; // hPa
    visibility: number; // km
    weatherCondition: string; // "sunny", "rainy", etc.
    weatherIcon: string; // Icon code
    lastUpdated: string; // ISO timestamp
  };
  forecast: {
    hourly: HourlyForecast[];
    daily: DailyForecast[];
  };
}

export interface HourlyForecast {
  time: string; // ISO timestamp
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  uvIndex: number;
  weatherCondition: string;
  weatherIcon: string;
}

export interface DailyForecast {
  date: string; // YYYY-MM-DD
  high: number;
  low: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  uvIndex: number;
  weatherCondition: string;
  weatherIcon: string;
  sunrise: string;
  sunset: string;
}

export interface WeatherPreferences {
  unit: 'metric' | 'imperial';
  location: {
    lat: number;
    lon: number;
    name: string;
  };
  alerts: {
    temperature: {
      min: number;
      max: number;
    };
    windSpeed: number;
    precipitation: number;
    uvIndex: number;
    airQuality: number;
  };
}

export interface WeatherImpact {
  performance: 'positive' | 'negative' | 'neutral';
  risk: 'low' | 'medium' | 'high';
  recommendations: string[];
  adjustments: {
    intensity: number; // -2 to +2 scale
    duration: number; // Percentage change
    route: string[]; // Route suggestions
    clothing: string[];
    hydration: string[];
  };
}

export interface RunningWeatherConditions {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  uvIndex: number;
  airQuality: number;
  feelsLike: number;
  dewPoint: number;
  weatherCondition: string;
}
