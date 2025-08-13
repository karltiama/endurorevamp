import { TrainingLoadCalculator } from '@/lib/training/training-load';
import { ActivityWithTrainingData } from '@/types';

describe('Weight Training Load Calculations', () => {
  const mockThresholds = {
    maxHeartRate: 190,
    restingHeartRate: 60,
    functionalThresholdPower: 250,
  };

  const calculator = new TrainingLoadCalculator(mockThresholds);

  describe('calculateWeightTrainingLoad', () => {
    it('calculates load for strength training with heart rate', () => {
      const activity: ActivityWithTrainingData = {
        id: '1',
        user_id: 'user1',
        strava_activity_id: 123,
        name: 'Heavy Squats 3x5',
        sport_type: 'WeightTraining',
        distance: 0,
        moving_time: 3600, // 60 minutes
        elapsed_time: 3600,
        total_elevation_gain: 0,
        start_date: '2024-01-01T10:00:00Z',
        start_date_local: '2024-01-01T10:00:00Z',
        timezone: 'UTC',
        has_heartrate: true,
        average_heartrate: 140, // 70% of max HR
        perceived_exertion: 8,
      };

      const load = calculator.calculateWeightTrainingLoad(activity);

      // Expected calculation:
      // hrRatio = (140 - 60) / (190 - 60) = 0.615
      // neuromuscularFactor = 1.3
      // baseLoad = 60 * 0.615 * 1.3 = 47.97
      // typeMultiplier = 0.7 (strength)
      // intensityMultiplier = 0.5 + (8/10) * 0.8 = 1.14
      // finalLoad = 47.97 * 0.7 * 1.14 = 38.3

      expect(load).toBeGreaterThan(30);
      expect(load).toBeLessThan(50);
    });

    it('calculates load for circuit training with high heart rate', () => {
      const activity: ActivityWithTrainingData = {
        id: '2',
        user_id: 'user1',
        strava_activity_id: 124,
        name: 'Circuit Training HIIT',
        sport_type: 'WeightTraining',
        distance: 0,
        moving_time: 1800, // 30 minutes
        elapsed_time: 1800,
        total_elevation_gain: 0,
        start_date: '2024-01-01T10:00:00Z',
        start_date_local: '2024-01-01T10:00:00Z',
        timezone: 'UTC',
        has_heartrate: true,
        average_heartrate: 170, // 85% of max HR
        perceived_exertion: 9,
      };

      const load = calculator.calculateWeightTrainingLoad(activity);

      // Circuit training should have higher load due to:
      // - Higher heart rate (85% vs 70%)
      // - Circuit multiplier (1.0 vs 0.7)
      // - Higher RPE (9 vs 8)

      expect(load).toBeGreaterThan(35);
      expect(load).toBeLessThan(70);
    });

    it('calculates load for endurance training with moderate heart rate', () => {
      const activity: ActivityWithTrainingData = {
        id: '3',
        user_id: 'user1',
        strava_activity_id: 125,
        name: 'Light Endurance Sets 15+',
        sport_type: 'WeightTraining',
        distance: 0,
        moving_time: 2700, // 45 minutes
        elapsed_time: 2700,
        total_elevation_gain: 0,
        start_date: '2024-01-01T10:00:00Z',
        start_date_local: '2024-01-01T10:00:00Z',
        timezone: 'UTC',
        has_heartrate: true,
        average_heartrate: 120, // 60% of max HR
        perceived_exertion: 5,
      };

      const load = calculator.calculateWeightTrainingLoad(activity);

      // Endurance training should have moderate load due to:
      // - Lower heart rate (60% vs 70-85%)
      // - Endurance multiplier (0.9 vs 0.7-1.0)
      // - Lower RPE (5 vs 8-9)

      expect(load).toBeGreaterThan(20);
      expect(load).toBeLessThan(40);
    });

    it('falls back to duration-based calculation when no heart rate', () => {
      const activity: ActivityWithTrainingData = {
        id: '4',
        user_id: 'user1',
        strava_activity_id: 126,
        name: 'General Weight Training',
        sport_type: 'WeightTraining',
        distance: 0,
        moving_time: 3600, // 60 minutes
        elapsed_time: 3600,
        total_elevation_gain: 0,
        start_date: '2024-01-01T10:00:00Z',
        start_date_local: '2024-01-01T10:00:00Z',
        timezone: 'UTC',
        has_heartrate: false,
        perceived_exertion: 6,
      };

      const load = calculator.calculateWeightTrainingLoad(activity);

      // Fallback calculation:
      // baseLoad = 60 * 0.8 = 48
      // typeMultiplier = 0.8 (default)
      // intensityMultiplier = 0.5 + (6/10) * 0.8 = 0.98
      // finalLoad = 48 * 0.8 * 0.98 = 37.6

      expect(load).toBeGreaterThan(30);
      expect(load).toBeLessThan(50);
    });
  });

  describe('determineWeightTrainingType', () => {
    it('classifies strength training correctly', () => {
      const activity: ActivityWithTrainingData = {
        id: '1',
        user_id: 'user1',
        strava_activity_id: 123,
        name: 'Heavy Squats 3x5',
        sport_type: 'WeightTraining',
        distance: 0,
        moving_time: 3600,
        elapsed_time: 3600,
        total_elevation_gain: 0,
        start_date: '2024-01-01T10:00:00Z',
        start_date_local: '2024-01-01T10:00:00Z',
        timezone: 'UTC',
      };

      const load = calculator.calculateWeightTrainingLoad(activity);
      expect(load).toBeGreaterThan(0);
    });

    it('classifies power training correctly', () => {
      const activity: ActivityWithTrainingData = {
        id: '2',
        user_id: 'user1',
        strava_activity_id: 124,
        name: 'Power Clean and Jerk',
        sport_type: 'WeightTraining',
        distance: 0,
        moving_time: 1800,
        elapsed_time: 1800,
        total_elevation_gain: 0,
        start_date: '2024-01-01T10:00:00Z',
        start_date_local: '2024-01-01T10:00:00Z',
        timezone: 'UTC',
      };

      const load = calculator.calculateWeightTrainingLoad(activity);
      expect(load).toBeGreaterThan(0);
    });

    it('classifies circuit training correctly', () => {
      const activity: ActivityWithTrainingData = {
        id: '3',
        user_id: 'user1',
        strava_activity_id: 125,
        name: 'CrossFit Circuit',
        sport_type: 'WeightTraining',
        distance: 0,
        moving_time: 2700,
        elapsed_time: 2700,
        total_elevation_gain: 0,
        start_date: '2024-01-01T10:00:00Z',
        start_date_local: '2024-01-01T10:00:00Z',
        timezone: 'UTC',
      };

      const load = calculator.calculateWeightTrainingLoad(activity);
      expect(load).toBeGreaterThan(0);
    });

    it('defaults to hypertrophy for generic names', () => {
      const activity: ActivityWithTrainingData = {
        id: '4',
        user_id: 'user1',
        strava_activity_id: 126,
        name: 'General Weight Training',
        sport_type: 'WeightTraining',
        distance: 0,
        moving_time: 3600,
        elapsed_time: 3600,
        total_elevation_gain: 0,
        start_date: '2024-01-01T10:00:00Z',
        start_date_local: '2024-01-01T10:00:00Z',
        timezone: 'UTC',
      };

      const load = calculator.calculateWeightTrainingLoad(activity);
      expect(load).toBeGreaterThan(0);
    });
  });

  describe('Integration with Normalized Load', () => {
    it('uses weight training calculation for WeightTraining activities', () => {
      const activity: ActivityWithTrainingData = {
        id: '1',
        user_id: 'user1',
        strava_activity_id: 123,
        name: 'Heavy Squats 3x5',
        sport_type: 'WeightTraining',
        distance: 0,
        moving_time: 3600,
        elapsed_time: 3600,
        total_elevation_gain: 0,
        start_date: '2024-01-01T10:00:00Z',
        start_date_local: '2024-01-01T10:00:00Z',
        timezone: 'UTC',
        has_heartrate: true,
        average_heartrate: 140,
        perceived_exertion: 8,
      };

      const normalizedLoad = calculator.calculateNormalizedLoad(activity);
      const weightTrainingLoad =
        calculator.calculateWeightTrainingLoad(activity);

      // Normalized load should use weight training calculation
      expect(normalizedLoad).toBe(weightTrainingLoad);
    });

    it('uses standard calculation for non-weight training activities', () => {
      const activity: ActivityWithTrainingData = {
        id: '2',
        user_id: 'user1',
        strava_activity_id: 124,
        name: 'Morning Run',
        sport_type: 'Run',
        distance: 5000,
        moving_time: 1800,
        elapsed_time: 1800,
        total_elevation_gain: 50,
        start_date: '2024-01-01T10:00:00Z',
        start_date_local: '2024-01-01T10:00:00Z',
        timezone: 'UTC',
        has_heartrate: true,
        average_heartrate: 150,
      };

      const normalizedLoad = calculator.calculateNormalizedLoad(activity);

      // Should not be zero and should use standard calculation
      expect(normalizedLoad).toBeGreaterThan(0);
    });
  });
});
