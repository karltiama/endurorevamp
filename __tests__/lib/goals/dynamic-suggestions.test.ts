import {
  DynamicGoalEngine,
  UserPerformanceProfile,
} from '@/lib/goals/dynamic-suggestions';
import { Activity } from '@/lib/strava/types';
import { UserGoal } from '@/types/goals';

describe('DynamicGoalEngine', () => {
  const mockActivities: Activity[] = [
    {
      id: '1',
      user_id: 'user-1',
      strava_activity_id: 123456789,
      name: 'Morning Run',
      sport_type: 'Run',
      distance: 5000, // 5km
      moving_time: 1800, // 30 minutes
      elapsed_time: 1900,
      total_elevation_gain: 50,
      start_date: '2024-01-15T06:00:00Z',
      start_date_local: '2024-01-15T06:00:00Z',
      timezone: 'America/New_York',
      average_speed: 2.78, // m/s
      max_speed: 3.33,
      average_heartrate: 150,
      max_heartrate: 170,
      average_cadence: 170,
      has_heartrate: true,
      created_at: '2024-01-15T06:30:00Z',
      updated_at: '2024-01-15T06:30:00Z',
    },
    {
      id: '2',
      user_id: 'user-1',
      strava_activity_id: 987654321,
      name: 'Evening Run',
      sport_type: 'Run',
      distance: 3000, // 3km
      moving_time: 1200, // 20 minutes
      elapsed_time: 1250,
      total_elevation_gain: 30,
      start_date: '2024-01-17T18:00:00Z',
      start_date_local: '2024-01-17T18:00:00Z',
      timezone: 'America/New_York',
      average_speed: 2.5, // m/s
      max_speed: 3.0,
      average_heartrate: 145,
      max_heartrate: 165,
      average_cadence: 165,
      has_heartrate: true,
      created_at: '2024-01-17T18:30:00Z',
      updated_at: '2024-01-17T18:30:00Z',
    },
  ];

  const mockGoals: UserGoal[] = [];

  describe('generateDynamicSuggestions', () => {
    it('should generate suggestions with valid goal types', () => {
      const profile = DynamicGoalEngine.analyzeUserPerformance(
        mockActivities,
        mockGoals
      );
      const suggestions = DynamicGoalEngine.generateDynamicSuggestions(
        profile,
        mockGoals
      );

      // Verify suggestions have valid goal types
      suggestions.forEach(suggestion => {
        expect(suggestion.goalType).toBeDefined();
        expect(suggestion.goalType.name).toBeDefined();
        expect(suggestion.goalType.name).toBeDefined();
        expect(suggestion.goalType.category).toBeDefined();
        expect(suggestion.goalType.metric_type).toBeDefined();
        expect(suggestion.goalType.is_active).toBe(true);
      });
    });

    it('should map goal categories to correct goal types', () => {
      const profile = DynamicGoalEngine.analyzeUserPerformance(
        mockActivities,
        mockGoals
      );
      const suggestions = DynamicGoalEngine.generateDynamicSuggestions(
        profile,
        mockGoals
      );

      // Check that distance suggestions use distance goal type
      const distanceSuggestions = suggestions.filter(
        s => s.category === 'distance'
      );
      distanceSuggestions.forEach(suggestion => {
        expect(suggestion.goalType.category).toBe('distance');
        expect(suggestion.goalType.metric_type).toBe('total_distance');
        expect(suggestion.goalType.name).toBe('weekly_distance');
      });

      // Check that frequency suggestions use frequency goal type
      const frequencySuggestions = suggestions.filter(
        s => s.category === 'frequency'
      );
      frequencySuggestions.forEach(suggestion => {
        expect(suggestion.goalType.category).toBe('frequency');
        expect(suggestion.goalType.metric_type).toBe('run_count');
        expect(suggestion.goalType.name).toBe('weekly_run_frequency');
      });

      // Check that pace suggestions use pace goal type
      const paceSuggestions = suggestions.filter(s => s.category === 'pace');
      paceSuggestions.forEach(suggestion => {
        expect(suggestion.goalType.category).toBe('pace');
        expect(suggestion.goalType.metric_type).toBe('average_pace');
        expect(suggestion.goalType.name).toBe('general_pace_improvement');
      });
    });

    it('should not have empty goal type objects', () => {
      const profile = DynamicGoalEngine.analyzeUserPerformance(
        mockActivities,
        mockGoals
      );
      const suggestions = DynamicGoalEngine.generateDynamicSuggestions(
        profile,
        mockGoals
      );

      // Verify no suggestions have empty goal type objects
      suggestions.forEach(suggestion => {
        expect(suggestion.goalType).not.toEqual({});
        expect(Object.keys(suggestion.goalType).length).toBeGreaterThan(0);
      });
    });

    it('should convert distance goals to user preferred units', () => {
      const profile = DynamicGoalEngine.analyzeUserPerformance(
        mockActivities,
        mockGoals
      );

      // Test with kilometers (default)
      const kmSuggestions = DynamicGoalEngine.generateDynamicSuggestions(
        profile,
        mockGoals,
        { distance: 'km', pace: 'min/km' }
      );
      const kmDistanceSuggestions = kmSuggestions.filter(
        s => s.category === 'distance'
      );
      kmDistanceSuggestions.forEach(suggestion => {
        expect(suggestion.targetUnit).toBe('km');
        expect(suggestion.description).toContain('km');
      });

      // Test with miles
      const mileSuggestions = DynamicGoalEngine.generateDynamicSuggestions(
        profile,
        mockGoals,
        { distance: 'miles', pace: 'min/mile' }
      );
      const mileDistanceSuggestions = mileSuggestions.filter(
        s => s.category === 'distance'
      );
      mileDistanceSuggestions.forEach(suggestion => {
        expect(suggestion.targetUnit).toBe('miles');
        expect(suggestion.description).toContain('mi');
      });
    });

    it('should convert pace goals to user preferred units', () => {
      const profile = DynamicGoalEngine.analyzeUserPerformance(
        mockActivities,
        mockGoals
      );

      // Test with min/km (default)
      const kmPaceSuggestions = DynamicGoalEngine.generateDynamicSuggestions(
        profile,
        mockGoals,
        { distance: 'km', pace: 'min/km' }
      );
      const kmPaceGoals = kmPaceSuggestions.filter(s => s.category === 'pace');
      kmPaceGoals.forEach(suggestion => {
        expect(suggestion.targetUnit).toBe('seconds/km');
        expect(suggestion.description).toContain('/km');
      });

      // Test with min/mile
      const milePaceSuggestions = DynamicGoalEngine.generateDynamicSuggestions(
        profile,
        mockGoals,
        { distance: 'miles', pace: 'min/mile' }
      );
      const milePaceGoals = milePaceSuggestions.filter(
        s => s.category === 'pace'
      );
      milePaceGoals.forEach(suggestion => {
        expect(suggestion.targetUnit).toBe('seconds/mile');
        expect(suggestion.description).toContain('/mi');
      });
    });

    it('should convert target values appropriately for different units', () => {
      const profile = DynamicGoalEngine.analyzeUserPerformance(
        mockActivities,
        mockGoals
      );

      // Test distance conversion (8km should become ~5mi)
      const kmSuggestions = DynamicGoalEngine.generateDynamicSuggestions(
        profile,
        mockGoals,
        { distance: 'km', pace: 'min/km' }
      );
      const mileSuggestions = DynamicGoalEngine.generateDynamicSuggestions(
        profile,
        mockGoals,
        { distance: 'miles', pace: 'min/mile' }
      );

      const kmDistanceGoal = kmSuggestions.find(s => s.category === 'distance');
      const mileDistanceGoal = mileSuggestions.find(
        s => s.category === 'distance'
      );

      if (kmDistanceGoal && mileDistanceGoal) {
        // The mile target should be approximately 0.621371 times the km target
        const expectedMileTarget =
          Math.round(kmDistanceGoal.suggestedTarget * 0.621371 * 10) / 10;
        expect(mileDistanceGoal.suggestedTarget).toBeCloseTo(
          expectedMileTarget,
          1
        );
      }
    });

    it('should have valid goal types for specific problematic suggestions', () => {
      const profile = DynamicGoalEngine.analyzeUserPerformance(
        mockActivities,
        mockGoals
      );
      const suggestions = DynamicGoalEngine.generateDynamicSuggestions(
        profile,
        mockGoals
      );

      // Check "Take the Next Step" suggestion (should be frequency category)
      const nextStepSuggestion = suggestions.find(
        s => s.id === 'dynamic-beginner-progression'
      );
      if (nextStepSuggestion) {
        expect(nextStepSuggestion.category).toBe('frequency');
        expect(nextStepSuggestion.goalType.category).toBe('frequency');
        expect(nextStepSuggestion.goalType.name).toBe('weekly_run_frequency');
      }

      // Check "Conquer Your First 10K" suggestion (should be distance category)
      const challengeSuggestion = suggestions.find(
        s => s.id === 'dynamic-10k-challenge'
      );
      if (challengeSuggestion) {
        expect(challengeSuggestion.category).toBe('distance');
        expect(challengeSuggestion.goalType.category).toBe('distance');
        expect(challengeSuggestion.goalType.name).toBe('weekly_distance');
      }

      // Check "Get Back on Track" suggestion (should be frequency category)
      const recoverySuggestion = suggestions.find(
        s => s.id === 'dynamic-frequency-recovery'
      );
      if (recoverySuggestion) {
        expect(recoverySuggestion.category).toBe('frequency');
        expect(recoverySuggestion.goalType.category).toBe('frequency');
        expect(recoverySuggestion.goalType.name).toBe('weekly_run_frequency');
      }
    });

    it('should have correct targetUnit format for "Improve Your Running Efficiency" goal', () => {
      // Create a profile that would trigger the "Improve Your Running Efficiency" goal
      const beginnerProfile: UserPerformanceProfile = {
        weeklyDistance: 15, // Enough to trigger the goal
        monthlyDistance: 60,
        averagePace: 300, // 5:00 min/km
        runFrequency: 3, // Meets the >= 2 requirement
        longestRun: 8,
        averageHeartRate: 150,
        distanceTrend: 'improving',
        paceTrend: 'stable',
        frequencyTrend: 'stable',
        preferredSportTypes: ['Run'],
        preferredDays: [1, 3, 5],
        averageActivityDuration: 30,
        goalCompletionRate: 70,
        consistencyScore: 75,
        totalActivities: 10,
        runningExperience: 'beginner',
        hasRecentInjuries: false,
      };

      const suggestions = DynamicGoalEngine.generateDynamicSuggestions(
        beginnerProfile,
        [],
        { distance: 'km', pace: 'min/km' }
      );

      // Find the "Improve Your Running Efficiency" goal
      const efficiencyGoal = suggestions.find(
        s => s.id === 'dynamic-beginner-pace'
      );

      if (efficiencyGoal) {
        // Verify the targetUnit is correctly set to seconds/km
        expect(efficiencyGoal.targetUnit).toBe('seconds/km');
        expect(efficiencyGoal.title).toBe('Improve Your Running Efficiency');
        expect(efficiencyGoal.category).toBe('pace');

        // Verify the suggestedTarget is in seconds (should be current pace - 10)
        expect(efficiencyGoal.suggestedTarget).toBe(290); // 300 - 10
      }
    });

    it('should have proper spacing in target unit formatting', () => {
      // Test that the targetUnit values have proper spacing when formatted
      const profile = DynamicGoalEngine.analyzeUserPerformance(
        mockActivities,
        mockGoals
      );
      const suggestions = DynamicGoalEngine.generateDynamicSuggestions(
        profile,
        mockGoals
      );

      // Check that all suggestions have properly formatted target units
      suggestions.forEach(suggestion => {
        // For pace goals, the targetUnit should be 'seconds/km' or 'seconds/mile'
        if (suggestion.category === 'pace') {
          expect(suggestion.targetUnit).toMatch(/^seconds\/(km|mile)$/);
        }

        // For distance goals, the targetUnit should be 'km' or 'miles'
        if (suggestion.category === 'distance') {
          expect(suggestion.targetUnit).toMatch(/^(km|miles)$/);
        }

        // For frequency goals, the targetUnit should be 'runs/week' or similar
        if (suggestion.category === 'frequency') {
          expect(suggestion.targetUnit).toMatch(
            /^(runs\/week|activities\/week)$/
          );
        }
      });
    });
  });
});
