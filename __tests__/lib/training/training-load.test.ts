import {
  TrainingLoadCalculator,
  estimateAthleteThresholds,
} from '@/lib/training/training-load';
import { Activity } from '@/lib/strava/types';

// Mock activity data for testing
const createMockActivity = (overrides: Partial<Activity> = {}): Activity => ({
  id: '1',
  user_id: 'user-123',
  strava_activity_id: 123456789,
  name: 'Morning Run',
  sport_type: 'Run',
  distance: 5000, // 5km
  moving_time: 1800, // 30 minutes
  elapsed_time: 1800,
  total_elevation_gain: 50,
  start_date: '2024-01-15T08:00:00Z',
  start_date_local: '2024-01-15T08:00:00Z',
  timezone: 'UTC',
  average_heartrate: 150,
  max_heartrate: 175,
  has_heartrate: true,
  average_watts: 200,
  weighted_average_watts: 210,
  trainer: false,
  commute: false,
  manual: false,
  private: false,
  device_watts: true,
  kudos_count: 5,
  comment_count: 1,
  athlete_count: 1,
  photo_count: 0,
  achievement_count: 0,
  pr_count: 0,
  ...overrides,
});

const mockAthleteThresholds = {
  maxHeartRate: 190,
  restingHeartRate: 60,
  functionalThresholdPower: 250,
  lactateThreshold: 161,
};

describe('TrainingLoadCalculator', () => {
  let calculator: TrainingLoadCalculator;

  beforeEach(() => {
    calculator = new TrainingLoadCalculator(mockAthleteThresholds);
  });

  describe('TRIMP Calculation', () => {
    it('should calculate TRIMP for an activity with heart rate data', () => {
      const activity = createMockActivity({
        average_heartrate: 150,
        moving_time: 3600, // 1 hour
        has_heartrate: true,
      });

      const trimp = calculator.calculateTRIMP(activity);

      expect(trimp).toBeGreaterThan(0);
      expect(typeof trimp).toBe('number');
    });

    it('should return 0 for activities without heart rate data', () => {
      const activity = createMockActivity({
        has_heartrate: false,
        average_heartrate: undefined,
      });

      const trimp = calculator.calculateTRIMP(activity);
      expect(trimp).toBe(0);
    });

    it('should apply sport-specific multipliers', () => {
      const runActivity = createMockActivity({
        sport_type: 'Run',
        average_heartrate: 150,
        moving_time: 3600,
      });

      const rideActivity = createMockActivity({
        sport_type: 'Ride',
        average_heartrate: 150,
        moving_time: 3600,
      });

      const runTrimp = calculator.calculateTRIMP(runActivity);
      const rideTrimp = calculator.calculateTRIMP(rideActivity);

      // Running should have higher TRIMP than cycling at same HR
      expect(runTrimp).toBeGreaterThan(rideTrimp);
    });

    it('should increase TRIMP with higher heart rate', () => {
      const lowHR = createMockActivity({
        average_heartrate: 130,
        moving_time: 3600,
      });

      const highHR = createMockActivity({
        average_heartrate: 170,
        moving_time: 3600,
      });

      const lowTrimp = calculator.calculateTRIMP(lowHR);
      const highTrimp = calculator.calculateTRIMP(highHR);

      expect(highTrimp).toBeGreaterThan(lowTrimp);
    });
  });

  describe('TSS Calculation', () => {
    it('should calculate power-based TSS when power data is available', () => {
      const activity = createMockActivity({
        average_watts: 200,
        moving_time: 3600, // 1 hour
      });

      const tss = calculator.calculateTSS(activity);

      expect(tss).toBeGreaterThan(0);
      expect(typeof tss).toBe('number');
    });

    it('should calculate HR-based TSS when only heart rate is available', () => {
      const activity = createMockActivity({
        average_watts: undefined,
        average_heartrate: 150,
        has_heartrate: true,
        moving_time: 3600,
      });

      const tss = calculator.calculateTSS(activity);

      expect(tss).toBeGreaterThan(0);
      expect(typeof tss).toBe('number');
    });

    it('should prefer power-based TSS over HR-based when both are available', () => {
      const powerActivity = createMockActivity({
        average_watts: 200,
        average_heartrate: 150,
        has_heartrate: true,
        moving_time: 3600,
      });

      const hrOnlyActivity = createMockActivity({
        average_watts: undefined,
        average_heartrate: 150,
        has_heartrate: true,
        moving_time: 3600,
      });

      const powerTSS = calculator.calculateTSS(powerActivity);
      const hrTSS = calculator.calculateTSS(hrOnlyActivity);

      // Both should be positive but power-based calculation should be different
      expect(powerTSS).toBeGreaterThan(0);
      expect(hrTSS).toBeGreaterThan(0);
      expect(powerTSS).not.toBe(hrTSS);
    });

    it('should scale TSS with duration', () => {
      const shortActivity = createMockActivity({
        average_watts: 200,
        moving_time: 1800, // 30 minutes
      });

      const longActivity = createMockActivity({
        average_watts: 200,
        moving_time: 7200, // 2 hours
      });

      const shortTSS = calculator.calculateTSS(shortActivity);
      const longTSS = calculator.calculateTSS(longActivity);

      expect(longTSS).toBeGreaterThan(shortTSS);
    });
  });

  describe('Normalized Load Calculation', () => {
    it('should calculate normalized load on 0-100 scale', () => {
      const activity = createMockActivity({
        average_heartrate: 150,
        average_watts: 200,
        moving_time: 3600,
      });

      const normalizedLoad = calculator.calculateNormalizedLoad(activity);

      expect(normalizedLoad).toBeGreaterThanOrEqual(0);
      expect(normalizedLoad).toBeLessThanOrEqual(100);
    });

    it('should combine TRIMP and TSS when both are available', () => {
      const fullDataActivity = createMockActivity({
        average_heartrate: 150,
        average_watts: 200,
        has_heartrate: true,
        moving_time: 3600,
      });

      const hrOnlyActivity = createMockActivity({
        average_heartrate: 150,
        has_heartrate: true,
        average_watts: undefined,
        moving_time: 3600,
      });

      const fullLoad = calculator.calculateNormalizedLoad(fullDataActivity);
      const hrLoad = calculator.calculateNormalizedLoad(hrOnlyActivity);

      expect(fullLoad).toBeGreaterThan(0);
      expect(hrLoad).toBeGreaterThan(0);
    });
  });

  describe('Process Activities', () => {
    it('should filter out very short activities', () => {
      const activities = [
        createMockActivity({ moving_time: 120 }), // 2 minutes - should be filtered
        createMockActivity({ moving_time: 1800 }), // 30 minutes - should be included
        createMockActivity({ moving_time: 3600 }), // 1 hour - should be included
      ];

      const loadPoints = calculator.processActivities(activities);

      expect(loadPoints).toHaveLength(1); // Only activities > 5 minutes, grouped by date
    });

    it('should filter out very short activities and group by date', () => {
      const activities = [
        createMockActivity({
          start_date_local: '2024-01-15T08:00:00Z',
          moving_time: 120, // 2 minutes - should be filtered
        }),
        createMockActivity({
          start_date_local: '2024-01-15T08:00:00Z',
          moving_time: 1800, // 30 minutes - should be included
        }),
        createMockActivity({
          start_date_local: '2024-01-16T08:00:00Z',
          moving_time: 3600, // 1 hour - should be included
        }),
      ];

      const loadPoints = calculator.processActivities(activities);

      expect(loadPoints).toHaveLength(2); // 2 different dates with valid activities
      expect(loadPoints[0].activity?.name).toBe('Morning Run'); // Single activity on first day
      expect(loadPoints[1].activity?.name).toBe('Morning Run'); // Single activity on second day
    });

    it('should aggregate multiple activities on same day', () => {
      const activities = [
        createMockActivity({
          start_date_local: '2024-01-15T08:00:00Z',
          moving_time: 1800,
          name: 'Morning Run',
        }),
        createMockActivity({
          start_date_local: '2024-01-15T14:00:00Z', // Same day, different time
          moving_time: 3600,
          name: 'Afternoon Ride',
        }),
      ];

      const loadPoints = calculator.processActivities(activities);

      expect(loadPoints).toHaveLength(1); // One load point for one day
      expect(loadPoints[0].activity?.name).toBe('2 activities'); // Aggregated name
      expect(loadPoints[0].activity?.sport_type).toBe('Mixed'); // Mixed sports
      expect(loadPoints[0].activity?.duration).toBe(5400); // Total duration (1800 + 3600)
    });

    it('should sort load points by date', () => {
      const activities = [
        createMockActivity({
          start_date_local: '2024-01-15T08:00:00Z',
          moving_time: 1800,
        }),
        createMockActivity({
          start_date_local: '2024-01-14T08:00:00Z',
          moving_time: 1800,
        }),
        createMockActivity({
          start_date_local: '2024-01-16T08:00:00Z',
          moving_time: 1800,
        }),
      ];

      const loadPoints = calculator.processActivities(activities);

      expect(loadPoints).toHaveLength(3);
      expect(new Date(loadPoints[0].date).getTime()).toBeLessThanOrEqual(
        new Date(loadPoints[1].date).getTime()
      );
      expect(new Date(loadPoints[1].date).getTime()).toBeLessThanOrEqual(
        new Date(loadPoints[2].date).getTime()
      );
    });
  });

  describe('Training Load Metrics', () => {
    it('should calculate training load metrics from load points', () => {
      const loadPoints = Array.from({ length: 60 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        trimp: 50 + Math.random() * 50,
        tss: 60 + Math.random() * 60,
        normalizedLoad: 40 + Math.random() * 40,
      }));

      const metrics = calculator.calculateLoadMetrics(loadPoints);

      expect(metrics.acute).toBeGreaterThanOrEqual(0);
      expect(metrics.chronic).toBeGreaterThanOrEqual(0);
      expect(typeof metrics.balance).toBe('number');
      expect(typeof metrics.rampRate).toBe('number');
      expect(['peak', 'maintain', 'build', 'recover']).toContain(
        metrics.status
      );
      expect(typeof metrics.recommendation).toBe('string');
    });

    it('should handle empty load points gracefully', () => {
      const metrics = calculator.calculateLoadMetrics([]);

      expect(metrics.acute).toBe(0);
      expect(metrics.chronic).toBe(0);
      expect(metrics.balance).toBe(0);
      expect(metrics.rampRate).toBe(0);
      expect(metrics.status).toBe('recover');
      expect(metrics.recommendation).toContain('Start building');
    });
  });
});

describe('estimateAthleteThresholds', () => {
  it('should estimate thresholds from activity data', () => {
    const activities = [
      createMockActivity({
        max_heartrate: 185,
        average_heartrate: 150,
        has_heartrate: true,
        average_watts: 220,
        moving_time: 3600,
      }),
      createMockActivity({
        max_heartrate: 180,
        average_heartrate: 145,
        has_heartrate: true,
        average_watts: 210,
        moving_time: 3600,
      }),
    ];

    const thresholds = estimateAthleteThresholds(activities);

    expect(thresholds.maxHeartRate).toBeGreaterThan(0);
    expect(thresholds.restingHeartRate).toBeGreaterThan(0);
  });

  it('should provide default values when no data is available', () => {
    const thresholds = estimateAthleteThresholds([]);

    expect(thresholds.maxHeartRate).toBe(190); // Default max HR
    expect(thresholds.restingHeartRate).toBe(60); // Default resting HR
    expect(thresholds.functionalThresholdPower).toBeUndefined();
  });

  it('should handle activities without heart rate or power data', () => {
    const activities = [
      createMockActivity({
        has_heartrate: false,
        average_heartrate: undefined,
        average_watts: undefined,
      }),
    ];

    const thresholds = estimateAthleteThresholds(activities);

    // Should fall back to defaults
    expect(thresholds.maxHeartRate).toBe(190);
    expect(thresholds.restingHeartRate).toBe(60);
    expect(thresholds.functionalThresholdPower).toBeUndefined();
  });
});
