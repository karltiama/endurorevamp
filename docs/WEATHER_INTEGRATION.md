# 🌤️ Weather Integration for Runners

## Overview

This weather integration system provides comprehensive weather data and analysis specifically tailored for runners. It includes current conditions, forecasts, impact analysis, and optimal running time recommendations.

## Key Features

### 🎯 **Weather Data Points**

- **Temperature** - Current and feels-like temperature
- **Humidity** - Relative humidity percentage
- **Wind** - Speed and direction
- **Precipitation** - Rain/snow amounts
- **UV Index** - Sun protection guidance
- **Air Quality** - Respiratory health considerations
- **Dew Point** - Humidity comfort indicator

### 🏃‍♂️ **Running-Specific Analysis**

- **Performance Impact** - How weather affects running performance
- **Risk Assessment** - Safety considerations for different conditions
- **Intensity Adjustments** - Recommended workout modifications
- **Clothing Recommendations** - What to wear for current conditions
- **Hydration Guidance** - Fluid intake recommendations
- **Route Suggestions** - Weather-appropriate route planning

### ⏰ **Optimal Running Time**

- **24-Hour Forecast Analysis** - Best times to run
- **Condition Scoring** - Temperature, humidity, wind, UV optimization
- **Reasoning** - Why a time is recommended

## Architecture

### Core Components

#### 1. **Weather Service** (`lib/weather/service.ts`)

```typescript
export class WeatherService {
  getCurrentWeather(lat: number, lon: number): Promise<WeatherData>;
  getForecast(lat: number, lon: number, days: number): Promise<WeatherData>;
  analyzeRunningImpact(weather: RunningWeatherConditions): WeatherImpact;
  getOptimalRunningTime(forecast: WeatherData): {
    time: string;
    reason: string;
  };
}
```

#### 2. **Weather Hooks** (`hooks/useWeather.ts`)

```typescript
useWeather({ lat, lon }); // Get weather at specific location
useLocationWeather(); // Get weather at user's location
useWeatherForWorkout(lat, lon); // Weather data for workout planning
```

#### 3. **Weather Widget** (`components/weather/WeatherWidget.tsx`)

```typescript
<WeatherWidget
  showImpact={true}
  showOptimalTime={true}
  className="w-full"
/>
```

#### 4. **API Endpoint** (`app/api/weather/route.ts`)

```typescript
GET /api/weather?lat=51.5074&lon=-0.1278&type=current
GET /api/weather?lat=51.5074&lon=-0.1278&type=forecast
```

## Weather Impact Analysis

### Temperature Guidelines

```typescript
// Optimal: 10-20°C (50-68°F)
if (temperature < 0) {
  // Cold: Dress in layers, warm up thoroughly
  impact.adjustments.intensity -= 1;
  impact.adjustments.duration -= 10;
} else if (temperature > 25) {
  // Hot: Reduce intensity, stay hydrated
  impact.adjustments.intensity -= 2;
  impact.adjustments.duration -= 20;
}
```

### Humidity Guidelines

```typescript
// Optimal: 40-60%
if (humidity > 80) {
  // High humidity: Reduce intensity, electrolyte replacement
  impact.adjustments.intensity -= 1;
  impact.adjustments.duration -= 15;
}
```

### Wind Guidelines

```typescript
// Optimal: < 15 km/h
if (windSpeed > 25) {
  // High winds: Consider indoor alternatives
  impact.adjustments.intensity -= 1;
  impact.risk = 'medium';
}
```

### Precipitation Guidelines

```typescript
if (precipitation > 5) {
  // Heavy rain: Consider indoor alternatives
  impact.adjustments.intensity -= 1;
  impact.adjustments.duration -= 10;
}
```

## Integration with Workout Planning

### Enhanced Workout Planning

The weather system integrates with your existing workout planning system:

```typescript
// In EnhancedWorkoutPlanner
private adjustForWeather(workout: EnhancedWorkoutRecommendation): EnhancedWorkoutRecommendation {
  const { temperature, precipitation, windSpeed } = weather

  if (temperature > 25) {
    workout.weatherConsideration = 'High temperature - reduce intensity by 1-2 points and stay hydrated'
    workout.intensity = Math.max(1, workout.intensity - 1)
    workout.duration = Math.min(workout.duration, 45)
  }

  return workout
}
```

### Workout Planning Hook Integration

```typescript
// In useEnhancedWorkoutPlanning
const { weatherConditions } = useWeatherForWorkout(lat, lon);

const context: WorkoutPlanningContext = {
  // ... other context
  userPreferences: {
    // ... other preferences
    weatherConditions,
  },
};
```

## API Integration

### OpenWeatherMap Setup

1. **Get API Key**: Sign up at [OpenWeatherMap](https://openweathermap.org/api)
2. **Environment Variables**:
   ```env
   OPENWEATHER_API_KEY=your_api_key_here
   NEXT_PUBLIC_OPENWEATHER_API_KEY=your_api_key_here
   ```

### API Endpoints

#### Current Weather

```bash
GET /api/weather?lat=51.5074&lon=-0.1278
```

Response:

```json
{
  "weather": {
    "location": { "name": "London", "country": "GB" },
    "current": {
      "temperature": 15,
      "humidity": 60,
      "windSpeed": 10,
      "precipitation": 0
    }
  },
  "impact": {
    "performance": "positive",
    "risk": "low",
    "recommendations": ["Optimal temperature for running"]
  },
  "optimalTime": {
    "time": "6:00 AM",
    "reason": "Best conditions: comfortable temperature, low humidity"
  }
}
```

#### Weather Forecast

```bash
GET /api/weather?lat=51.5074&lon=-0.1278&type=forecast
```

## Usage Examples

### Basic Weather Widget

```tsx
import { WeatherWidget } from '@/components/weather/WeatherWidget';

function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <WeatherWidget />
      {/* Other dashboard components */}
    </div>
  );
}
```

### Weather-Aware Workout Planning

```tsx
import { useWeatherForWorkout } from '@/hooks/useWeather';

function WorkoutPlanningPage() {
  const { weatherConditions, impact, optimalTime } = useWeatherForWorkout();

  return (
    <div>
      {impact && (
        <Alert>
          <AlertDescription>
            {impact.recommendations.join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {optimalTime && (
        <Card>
          <CardTitle>Best Time to Run</CardTitle>
          <CardContent>
            <p>{optimalTime.time}</p>
            <p className="text-sm text-gray-600">{optimalTime.reason}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

### Custom Weather Analysis

```tsx
import { useWeather } from '@/hooks/useWeather';

function CustomWeatherComponent() {
  const { weather, impact, isLoading } = useWeather({
    lat: 51.5074,
    lon: -0.1278,
  });

  if (isLoading) return <div>Loading weather...</div>;

  return (
    <div>
      <h3>Current Conditions</h3>
      <p>Temperature: {weather?.current.temperature}°C</p>
      <p>Humidity: {weather?.current.humidity}%</p>
      <p>Wind: {weather?.current.windSpeed} km/h</p>

      {impact && (
        <div>
          <h3>Running Impact</h3>
          <p>Performance: {impact.performance}</p>
          <p>Risk: {impact.risk}</p>
        </div>
      )}
    </div>
  );
}
```

## Testing

### Weather Service Tests

```bash
npm test __tests__/lib/weather-service.test.ts
```

### Weather Hook Tests

```bash
npm test __tests__/hooks/useWeather.test.tsx
```

### Weather Widget Tests

```bash
npm test __tests__/components/weather/WeatherWidget.test.tsx
```

## Weather API Providers

### Current: OpenWeatherMap

- **Free Tier**: 1,000 calls/day
- **Features**: Current weather, 5-day forecast
- **Cost**: Free for basic usage

### Alternative: WeatherAPI.com

- **Free Tier**: 1,000,000 calls/month
- **Features**: Current weather, 3-day forecast, air quality
- **Cost**: Free for basic usage

### Alternative: Tomorrow.io

- **Free Tier**: 500 calls/day
- **Features**: Advanced forecasting, minute-by-minute
- **Cost**: Free for basic usage

## Future Enhancements

### Phase 1: Core Features ✅

- [x] Current weather display
- [x] Weather impact analysis
- [x] Optimal running time
- [x] Integration with workout planning

### Phase 2: Advanced Features

- [ ] Historical weather data
- [ ] Weather-based route recommendations
- [ ] Personalized weather preferences
- [ ] Weather alerts and notifications

### Phase 3: Advanced Analytics

- [ ] Weather performance correlation
- [ ] Seasonal training adjustments
- [ ] Weather-based goal modifications
- [ ] Multi-location weather tracking

## Best Practices

### 1. **Error Handling**

```typescript
const { weather, error } = useWeather({ lat, lon })

if (error) {
  return <Alert>Unable to load weather data</Alert>
}
```

### 2. **Loading States**

```typescript
const { isLoading } = useWeather({ lat, lon })

if (isLoading) {
  return <WeatherWidgetSkeleton />
}
```

### 3. **Caching Strategy**

```typescript
// Weather data cached for 10 minutes
const { weather } = useWeather({
  lat,
  lon,
  staleTime: 10 * 60 * 1000,
});
```

### 4. **Location Permissions**

```typescript
// Handle location permission gracefully
const { weather } = useLocationWeather()

if (!weather) {
  return <LocationPermissionPrompt />
}
```

## Troubleshooting

### Common Issues

#### 1. **API Key Issues**

```bash
# Check environment variables
echo $OPENWEATHER_API_KEY
echo $NEXT_PUBLIC_OPENWEATHER_API_KEY
```

#### 2. **Location Permission Denied**

```typescript
// Add fallback location
const { weather } = useLocationWeather();
const fallbackWeather = useWeather({ lat: 51.5074, lon: -0.1278 });
```

#### 3. **Rate Limiting**

```typescript
// Implement exponential backoff
const { weather, refetch } = useWeather({
  lat,
  lon,
  retry: 3,
  retryDelay: 1000,
});
```

## Performance Considerations

### 1. **Caching Strategy**

- Weather data cached for 10 minutes
- Forecast data cached for 1 hour
- Impact analysis cached with weather data

### 2. **API Call Optimization**

- Single API call for current weather + forecast
- Batch location requests when possible
- Implement request deduplication

### 3. **Bundle Size**

- Weather service: ~15KB
- Weather widget: ~8KB
- Total weather integration: ~23KB

---

This weather integration provides runners with comprehensive weather data and intelligent recommendations to optimize their training based on current and forecasted conditions.
