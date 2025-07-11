import { GoalsOrchestrator } from '@/lib/goals/orchestrator';
import { DynamicGoalSuggestion } from '@/lib/goals/dynamic-suggestions';
import { CreateGoalRequest, GoalType } from '@/types/goals';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock the AutomaticGoalProgress module
jest.mock('@/lib/goals/automatic-progress', () => ({
  AutomaticGoalProgress: {
    getQuantifiableGoals: jest.fn().mockResolvedValue({
      quantifiable: [
        { id: '1', goal_type: { metric_type: 'total_distance' } },
        { id: '2', goal_type: { metric_type: 'run_count' } }
      ]
    })
  }
}));

describe('GoalsOrchestrator', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('createGoal', () => {
    it('should create a goal with context tracking', async () => {
      const mockGoal = {
        id: 'goal-1',
        goal_type_id: 'type-1',
        target_value: 50,
        goal_data: { creation_context: 'manual' }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, goal: mockGoal })
      });

      const goalData: CreateGoalRequest = {
        goal_type_id: 'type-1',
        target_value: 50,
        goal_data: { notes: 'Test goal' }
      };

      const result = await GoalsOrchestrator.createGoal(goalData, {
        type: 'manual',
        source: 'test'
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...goalData,
          goal_data: {
            ...goalData.goal_data,
            creation_context: 'manual',
            creation_source: 'test',
            creation_metadata: undefined,
            created_at: expect.any(String)
          }
        })
      });

      expect(result).toEqual(mockGoal);
    });

    it('should handle creation errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Creation failed' })
      });

      const goalData: CreateGoalRequest = {
        goal_type_id: 'type-1',
        target_value: 50,
        goal_data: {}
      };

      await expect(GoalsOrchestrator.createGoal(goalData)).rejects.toThrow('Creation failed');
    });
  });

  describe('createGoalFromSuggestion', () => {
    it('should create a goal from AI suggestion with proper data mapping', async () => {
      const mockGoal = {
        id: 'goal-1',
        goal_type_id: 'type-1',
        target_value: 30,
        goal_data: { from_suggestion: true }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, goal: mockGoal })
      });

      const suggestion: DynamicGoalSuggestion = {
        id: 'suggestion-1',
        title: 'Weekly Distance Goal',
        description: 'Run 30km per week',
        reasoning: 'Based on your current fitness level',
        priority: 'high',
        category: 'distance',
        goalType: { id: 'type-1' } as GoalType,
        suggestedTarget: 30,
        targetUnit: 'km',
        timeframe: '4 weeks',
        difficulty: 'moderate',
        benefits: ['Improved endurance'],
        strategies: ['Gradual increase', 'Rest days'],
        successProbability: 85,
        requiredCommitment: 'medium'
      };

      const result = await GoalsOrchestrator.createGoalFromSuggestion(suggestion);

      expect(mockFetch).toHaveBeenCalledWith('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"from_suggestion":true')
      });

      expect(result).toEqual(mockGoal);
    });

    it('should handle suggestion with warnings', async () => {
      const mockGoal = {
        id: 'goal-1',
        goal_type_id: 'type-1',
        target_value: 50,
        goal_data: { from_suggestion: true, warnings: ['High intensity'] }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, goal: mockGoal })
      });

      const suggestion: DynamicGoalSuggestion = {
        id: 'suggestion-1',
        title: 'Ambitious Goal',
        description: 'Challenging target',
        reasoning: 'Push your limits',
        priority: 'high',
        category: 'distance',
        goalType: { id: 'type-1' } as GoalType,
        suggestedTarget: 50,
        targetUnit: 'km',
        timeframe: '4 weeks',
        difficulty: 'ambitious',
        benefits: ['Achievement'],
        strategies: ['Consistency'],
        successProbability: 70,
        requiredCommitment: 'high',
        warnings: ['High intensity', 'Risk of overtraining']
      };

      const result = await GoalsOrchestrator.createGoalFromSuggestion(suggestion);

      expect(result).toEqual(mockGoal);
    });
  });

  describe('updateGoal', () => {
    it('should update a goal with context tracking', async () => {
      const mockGoal = {
        id: 'goal-1',
        target_value: 60,
        goal_data: { last_updated: expect.any(String) }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, goal: mockGoal })
      });

      const updates = { target_value: 60 };
      const context = { updateType: 'target' as const, reason: 'adjusted_target' };

      const result = await GoalsOrchestrator.updateGoal('goal-1', updates, context);

      expect(mockFetch).toHaveBeenCalledWith('/api/goals/goal-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updates,
          goal_data: {
            last_updated: expect.any(String),
            last_update_context: 'target',
            last_update_reason: 'adjusted_target'
          }
        })
      });

      expect(result).toEqual(mockGoal);
    });
  });

  describe('manageDashboardGoals', () => {
    it('should manage dashboard goals with validation', async () => {
      const mockGoals = [
        { id: '1', goal_data: { show_on_dashboard: true } },
        { id: '2', goal_data: { show_on_dashboard: false } }
      ];

      // Mock fetch for getting goals
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, goals: mockGoals })
        })
        // Mock fetch for updating goals
        .mockResolvedValue({
          ok: true,
          json: async () => ({ success: true, goal: {} })
        });

      const result = await GoalsOrchestrator.manageDashboardGoals(['1', '2'], 'user-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/goals');
      expect(result).toHaveLength(2);
    });

    it('should reject more than 3 dashboard goals', async () => {
      await expect(
        GoalsOrchestrator.manageDashboardGoals(['1', '2', '3', '4'], 'user-1')
      ).rejects.toThrow('Maximum 3 dashboard goals allowed');
    });
  });

  describe('getGoalAnalytics', () => {
    it('should return comprehensive analytics', async () => {
      const mockGoals = [
        {
          id: '1',
          is_active: true,
          is_completed: false,
          current_progress: 25,
          target_value: 50,
          goal_type: { category: 'distance' },
          goal_data: { creation_context: 'manual', show_on_dashboard: true }
        },
        {
          id: '2',
          is_active: false,
          is_completed: true,
          current_progress: 100,
          target_value: 100,
          goal_type: { category: 'frequency' },
          goal_data: { creation_context: 'suggestion', from_suggestion: true }
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, goals: mockGoals })
      });

      const analytics = await GoalsOrchestrator.getGoalAnalytics('user-1');

      expect(analytics).toEqual({
        totalGoals: 2,
        activeGoals: 1,
        completedGoals: 1,
        dashboardGoals: 1,
        goalsByCategory: {
          distance: 1,
          frequency: 1
        },
        goalsByContext: {
          manual: 1,
          suggestion: 1
        },
        suggestionGoals: 1,
        autoTrackingGoals: 2,
        averageProgress: 50, // (50 + 100) / 2
        completionRate: 50  // 1 completed out of 2 total
      });
    });
  });

  describe('getGoalRecommendations', () => {
    it('should return personalized recommendations', async () => {
      const mockGoals = [
        {
          id: '1',
          is_active: true,
          is_completed: false,
          current_progress: 10,
          target_value: 50,
          goal_type: { category: 'distance' },
          goal_data: { creation_context: 'manual', show_on_dashboard: false }
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, goals: mockGoals })
      });

      const recommendations = await GoalsOrchestrator.getGoalRecommendations('user-1');

      expect(recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'setup_dashboard',
            type: 'dashboard_setup',
            title: 'Set Up Dashboard Goals',
            priority: 'high'
          }),
          expect.objectContaining({
            id: 'review_progress',
            type: 'low_progress',
            title: 'Review Goal Progress',
            priority: 'medium'
          })
        ])
      );
    });
  });

  describe('validateGoalData', () => {
    it('should validate goal data correctly', () => {
      const validGoalData: CreateGoalRequest = {
        goal_type_id: 'type-1',
        target_value: 50,
        target_date: '2024-12-31',
        goal_data: {}
      };

      const validation = GoalsOrchestrator.validateGoalData(validGoalData);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should catch validation errors', () => {
      const invalidGoalData: CreateGoalRequest = {
        goal_type_id: '',
        target_value: -5,
        target_date: '2020-01-01', // Past date
        goal_data: {}
      };

      const validation = GoalsOrchestrator.validateGoalData(invalidGoalData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Goal type is required');
      expect(validation.errors).toContain('Target value must be greater than 0');
      expect(validation.errors).toContain('Target date must be in the future');
    });
  });

  describe('bulkUpdateGoals', () => {
    it('should update multiple goals with context', async () => {
      const mockGoal = { id: 'goal-1', target_value: 60 };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, goal: mockGoal })
      });

      const updates = [
        { goalId: 'goal-1', updates: { target_value: 60 } },
        { goalId: 'goal-2', updates: { target_value: 70 } }
      ];

      const context = { updateType: 'target' as const, reason: 'bulk_update' };

      const results = await GoalsOrchestrator.bulkUpdateGoals(updates, context);

      expect(results).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('archiveCompletedGoals', () => {
    it('should archive completed goals', async () => {
      const mockGoals = [
        { id: '1', is_completed: true, goal_data: {} },
        { id: '2', is_completed: false, goal_data: {} },
        { id: '3', is_completed: true, goal_data: {} }
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, goals: mockGoals })
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ success: true, goal: {} })
        });

      const archivedCount = await GoalsOrchestrator.archiveCompletedGoals('user-1');

      expect(archivedCount).toBe(2);
      expect(mockFetch).toHaveBeenCalledTimes(3); // 1 for fetch, 2 for updates
    });
  });

  describe('getGoalInsights', () => {
    it('should return goal insights', async () => {
      const insights = await GoalsOrchestrator.getGoalInsights('goal-1');

      expect(insights).toEqual({
        progressTrend: 'stable',
        timeToCompletion: null,
        recommendations: [
          'Stay consistent with your activities',
          'Review your target if needed'
        ]
      });
    });
  });
}); 