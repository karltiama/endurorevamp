import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Thermometer,
  Droplets,
  Wind,
  CloudRain,
  Sun,
  AlertTriangle,
  Calendar,
  Clock,
} from 'lucide-react';
import { useLocationWeather } from '@/hooks/useWeather';
interface WeatherForecastTabsProps {
  className?: string;
  showImpact?: boolean;
  showOptimalTime?: boolean;
}

export function WeatherForecastTabs({
  className = '',
  showImpact = true,
}: WeatherForecastTabsProps) {
  const { weather, forecast, impact, optimalTime, isLoading, error } =
    useLocationWeather();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5" />
            Weather Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5" />
            Weather Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Unable to load weather data. Please check your location
              permissions.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!weather || !forecast) {
    return null;
  }

  const { location } = weather;

  // Get today's and tomorrow's hourly forecasts
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayForecast = forecast.forecast.hourly.filter(hour => {
    const hourDate = new Date(hour.time);
    return hourDate.toDateString() === today.toDateString();
  });

  const tomorrowForecast = forecast.forecast.hourly.filter(hour => {
    const hourDate = new Date(hour.time);
    return hourDate.toDateString() === tomorrow.toDateString();
  });

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'clear':
        return <Sun className="h-5 w-5 text-yellow-500" />;
      case 'rain':
      case 'drizzle':
        return <CloudRain className="h-5 w-5 text-blue-500" />;
      case 'snow':
        return <CloudRain className="h-5 w-5 text-blue-300" />;
      case 'clouds':
        return <CloudRain className="h-5 w-5 text-gray-500" />;
      default:
        return <Thermometer className="h-5 w-5" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getDateString = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const renderHourlyForecast = (
    forecast: Array<{
      time: string;
      temperature: number;
      humidity: number;
      windSpeed: number;
      precipitation: number;
      weatherCondition: string;
    }>
  ) => {
    // Group by 3-hour intervals for better readability
    const intervals = [];
    for (let i = 0; i < forecast.length; i += 3) {
      intervals.push(forecast.slice(i, i + 3));
    }

    return (
      <div className="space-y-4">
        {/* Current conditions summary */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-red-500" />
            <span className="text-sm">
              {Math.round(forecast[0]?.temperature || 0)}°C
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-500" />
            <span className="text-sm">{forecast[0]?.humidity || 0}%</span>
          </div>

          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-gray-500" />
            <span className="text-sm">
              {Math.round(forecast[0]?.windSpeed || 0)} km/h
            </span>
          </div>

          {forecast[0]?.precipitation > 0 && (
            <div className="flex items-center gap-2">
              <CloudRain className="h-4 w-4 text-blue-500" />
              <span className="text-sm">{forecast[0].precipitation}mm</span>
            </div>
          )}
        </div>

        {/* Hourly breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Hourly Breakdown
          </h4>

          {intervals.map((interval, index) => (
            <div key={index} className="border rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-2">
                {formatTime(interval[0]?.time)} -{' '}
                {formatTime(interval[interval.length - 1]?.time)}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {interval.map((hour, hourIndex) => (
                  <div key={hourIndex} className="text-center">
                    <div className="flex justify-center mb-1">
                      {getWeatherIcon(hour.weatherCondition)}
                    </div>
                    <div className="text-xs font-medium">
                      {Math.round(hour.temperature)}°C
                    </div>
                    <div className="text-xs text-gray-500">
                      {hour.humidity}%
                    </div>
                    {hour.precipitation > 0 && (
                      <div className="text-xs text-blue-500">
                        {hour.precipitation}mm
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Running recommendations for this day */}
        {showImpact && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Running Recommendations
            </h4>

            {/* Best time to run */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Best Time</span>
                <span className="text-sm font-semibold text-blue-600">
                  {optimalTime?.time || 'Not available'}
                </span>
              </div>

              {optimalTime && (
                <p className="text-xs text-gray-600">{optimalTime.reason}</p>
              )}
            </div>

            {/* Weather impact */}
            {impact && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Running Impact</span>
                  <Badge
                    variant="outline"
                    className={getRiskColor(impact.risk)}
                  >
                    {impact.risk} risk
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Performance</span>
                  <span
                    className={`text-sm font-medium ${getPerformanceColor(impact.performance)}`}
                  >
                    {impact.performance}
                  </span>
                </div>

                {/* Key recommendations */}
                {impact.recommendations.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-700">
                      Key Tips:
                    </span>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {impact.recommendations.slice(0, 2).map((rec, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span className="text-blue-500 mt-1">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Thermometer className="h-5 w-5" />
          Running Weather Forecast
          {location && (
            <span className="text-sm font-normal text-gray-500">
              • {location.name}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="today" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Today
            </TabsTrigger>
            <TabsTrigger value="tomorrow" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Tomorrow
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Calendar className="h-4 w-4" />
                {getDayName(today)} • {getDateString(today)}
              </div>
              {renderHourlyForecast(todayForecast)}
            </div>
          </TabsContent>

          <TabsContent value="tomorrow" className="mt-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Calendar className="h-4 w-4" />
                {getDayName(tomorrow)} • {getDateString(tomorrow)}
              </div>
              {renderHourlyForecast(tomorrowForecast)}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
