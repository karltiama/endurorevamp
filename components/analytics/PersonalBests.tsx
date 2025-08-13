'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity } from '@/lib/strava/types';
import { useUnitPreferences } from '@/hooks/useUnitPreferences';
import {
  convertDistance,
  getDistanceUnit,
  convertPace,
  getPaceUnit,
} from '@/lib/utils';
import { Trophy, MapPin, Calendar } from 'lucide-react';

interface PersonalBestsProps {
  activities: Activity[];
}

interface RaceBest {
  distance: number;
  distanceName: string;
  time: number;
  pace: number;
  activity: Activity;
  date: string;
}

const COMMON_RACES = [
  { distance: 1609.34, name: '1 Mile', tolerance: 0.05 }, // 1 mile ± 5%
  { distance: 5000, name: '5K', tolerance: 0.05 }, // 5K ± 5%
  { distance: 10000, name: '10K', tolerance: 0.05 }, // 10K ± 5%
  { distance: 21097.5, name: 'Half Marathon', tolerance: 0.05 }, // 13.1 miles ± 5%
  { distance: 42195, name: 'Marathon', tolerance: 0.05 }, // 26.2 miles ± 5%
];

export function PersonalBests({ activities }: PersonalBestsProps) {
  const { preferences } = useUnitPreferences();

  const raceBests = useMemo(() => {
    if (!activities || activities.length === 0) return [];

    // Filter for running activities with valid data
    const runningActivities = activities.filter(
      activity =>
        activity.sport_type === 'Run' &&
        activity.distance > 0 &&
        activity.moving_time > 0 &&
        activity.average_speed &&
        activity.average_speed > 0
    );

    if (runningActivities.length === 0) return [];

    const bests: RaceBest[] = [];

    // Find best times for each race distance
    COMMON_RACES.forEach(race => {
      const matchingActivities = runningActivities.filter(activity => {
        const distanceDiff = Math.abs(activity.distance - race.distance);
        const tolerance = race.distance * race.tolerance;
        return distanceDiff <= tolerance;
      });

      if (matchingActivities.length > 0) {
        // Find the fastest time for this distance
        const fastest = matchingActivities.reduce((best, current) =>
          current.moving_time < best.moving_time ? current : best
        );

        const paceSecondsPerKm = 1000 / (fastest.average_speed || 1);

        bests.push({
          distance: fastest.distance,
          distanceName: race.name,
          time: fastest.moving_time,
          pace: paceSecondsPerKm,
          activity: fastest,
          date: fastest.start_date,
        });
      }
    });

    // Sort by distance (shortest to longest)
    return bests.sort((a, b) => a.distance - b.distance);
  }, [activities]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPace = (secondsPerKm: number) => {
    // Convert pace to user's preferred unit
    const paceInUserUnit = convertPace(secondsPerKm, preferences.pace);
    const paceUnit = getPaceUnit(preferences.pace);

    const minutes = Math.floor(paceInUserUnit / 60);
    const seconds = Math.floor(paceInUserUnit % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}${paceUnit}`;
  };

  const formatDistance = (meters: number) => {
    const distanceUnit = getDistanceUnit(preferences.distance);
    const convertedDistance = convertDistance(meters, preferences.distance);
    return `${convertedDistance.toFixed(1)} ${distanceUnit}`;
  };

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Race Bests
          </CardTitle>
          <CardDescription>
            Your best times at common race distances
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No activities found to calculate race bests</p>
            <p className="text-sm">
              Sync your activities from Strava to see your records
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (raceBests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Race Bests
          </CardTitle>
          <CardDescription>
            Your best times at common race distances
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No race distance activities found</p>
            <p className="text-sm">
              Complete runs at 1 mile, 5K, 10K, half marathon, or marathon
              distances to see your bests
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Race Bests
        </CardTitle>
        <CardDescription>
          Your best times at common race distances
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {raceBests.map((best, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">
                    {best.distanceName}
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800"
                >
                  {formatDistance(best.distance)}
                </Badge>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Time</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatTime(best.time)}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1">Pace</div>
                  <div className="text-lg font-semibold text-gray-700">
                    {formatPace(best.pace)}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t">
                <div className="text-sm text-muted-foreground mb-1">
                  {best.activity.name}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(best.date).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {raceBests.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Distance Matching
              </span>
            </div>
            <p className="text-xs text-blue-700">
              Activities are matched to race distances with ±5% tolerance. For
              example, a 5K activity can be between 4.75K and 5.25K.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
