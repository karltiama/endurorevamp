import { GoalOrchestrator } from '@/lib/goals/orchestrator';
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

describe('GoalOrchestrator', () => {
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

      const result = await GoalOrchestrator.createGoal(goalData, {
        type: 'manual',
        source: 'test'
      });

      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      
      expect(fetchCall[0]).toBe('/api/goals');
      expect(fetchCall[1].method).toBe('POST');
      expect(fetchCall[1].headers).toEqual({ 'Content-Type': 'application/json' });
      expect(requestBody.goal_type_id).toBe('type-1');
      expect(requestBody.target_value).toBe(50);
      expect(requestBody.goal_data.notes).toBe('Test goal');
      expect(requestBody.goal_data.creation_context).toBe('manual');
      expect(requestBody.goal_data.creation_source).toBe('test');
      expect(requestBody.goal_data.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

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

      await expect(GoalOrchestrator.createGoal(goalData)).rejects.toThrow('Creation failed');
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
        goalType: { name: 'type-1' } as GoalType,
        suggestedTarget: 30,
        targetUnit: 'km',
        timeframe: '4 weeks',
        difficulty: 'moderate',
        benefits: ['Improved endurance'],
        strategies: ['Gradual increase', 'Rest days'],
        successProbability: 85,
        requiredCommitment: 'medium'
      };

      const result = await GoalOrchestrator.createGoalFromSuggestion(suggestion);

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
        goalType: { name: 'type-1' } as GoalType,
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

      const result = await GoalOrchestrator.createGoalFromSuggestion(suggestion);

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

      const result = await GoalOrchestrator.updateGoal('goal-1', updates, context);

      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      
      expect(fetchCall[0]).toBe('/api/goals/goal-1');
      expect(fetchCall[1].method).toBe('PATCH');
      expect(fetchCall[1].headers).toEqual({ 'Content-Type': 'application/json' });
      expect(requestBody.target_value).toBe(60);
      expect(requestBody.goal_data.last_update_context).toBe('target');
      expect(requestBody.goal_data.last_update_reason).toBe('adjusted_target');
      expect(requestBody.goal_data.last_updated).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

      expect(result).toEqual(mockGoal);
    });
  });

  describe('manageDashboardGoals', () => {
    it('should manage dashboard goals with validation', async () => {
      const mockGoals = [
        { id: '1', goal_data: { show_on_dashboard: true } },
        { id: '2', goal_data: { show_on_dashboard: false } },
        { id: '3', goal_data: { show_on_dashboard: true } }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, goals: mockGoals })
      });

      const result = await GoalOrchestrator.manageDashboardGoals(['1', '2'], 'user-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalIds: ['1', '2'], userId: 'user-1' })
      });
      expect(result).toEqual(mockGoals);
    });

    it('should reject more than 3 dashboard goals', async () => {
      await expect(
        GoalOrchestrator.manageDashboardGoals(['1', '2', '3', '4'], 'user-1')
      ).rejects.toThrow('Maximum 3 dashboard goals allowed');
    });
  });

  describe('getGoalAnalytics', () => {
    it('should return analytics from API', async () => {
      const mockAnalytics = {
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
        averageProgress: 50,
        completionRate: 50
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, analytics: mockAnalytics })
      });

      const analytics = await GoalOrchestrator.getGoalAnalytics('user-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/goals/analytics?userId=user-1');
      expect(analytics).toEqual(mockAnalytics);
    });

    it('should handle API response without analytics field', async () => {
      const mockResponse = {
        totalGoals: 2,
        activeGoals: 1,
        completedGoals: 1
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, ...mockResponse })
      });

      const analytics = await GoalOrchestrator.getGoalAnalytics('user-1');

      expect(analytics).toEqual({ success: true, ...mockResponse });
    });
  });

  describe('getGoalRecommendations', () => {
    it('should return recommendations from API', async () => {
      const mockRecommendations = [
        {
          id: 'setup_dashboard',
          type: 'dashboard_setup',
          title: 'Set Up Dashboard Goals',
          description: 'Configure your dashboard',
          priority: 'high',
          action: {
            type: 'manage_dashboard',
            data: {}
          }
        },
        {
          id: 'review_progress',
          type: 'progress_update',
          title: 'Review Goal Progress',
          description: 'Check your progress',
          priority: 'medium',
          action: {
            type: 'update_progress',
            data: {}
          }
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, recommendations: mockRecommendations })
      });

      const recommendations = await GoalOrchestrator.getGoalRecommendations('user-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/goals/recommendations?userId=user-1');
      expect(recommendations).toEqual(mockRecommendations);
    });

    it('should handle API response without recommendations field', async () => {
      const mockResponse = {
        goals: [
          {
            id: '1',
            is_active: true,
            is_completed: false,
            current_progress: 10,
            target_value: 50,
            goal_type: { category: 'distance' },
            goal_data: { creation_context: 'manual', show_on_dashboard: false }
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, ...mockResponse })
      });

      const recommendations = await GoalOrchestrator.getGoalRecommendations('user-1');

      expect(recommendations).toEqual({ success: true, ...mockResponse });
    });
  });

  describe('validateGoalData', () => {
    it('should validate goal data correctly', () => {
      const validGoalData: CreateGoalRequest = {
        goal_type_id: 'type-1',
        target_value: 50,
        time_period: 'weekly',
        goal_data: {}
      };

      const validation = GoalOrchestrator.validateGoalData(validGoalData);

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

      const validation = GoalOrchestrator.validateGoalData(invalidGoalData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Goal type is required');
      expect(validation.errors).toContain('Target value must be greater than 0');
      expect(validation.errors).toContain('Target date must be in the future');
    });

    it('should require time_period', () => {
      const invalidGoalData: CreateGoalRequest = {
        goal_type_id: 'type-1',
        target_value: 50,
        goal_data: {}
      };

      const validation = GoalOrchestrator.validateGoalData(invalidGoalData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Time period is required');
    });
  });

  describe('bulkUpdateGoals', () => {
    it('should update multiple goals with context', async () => {
      const mockGoals = [
        { id: 'goal-1', target_value: 60 },
        { id: 'goal-2', target_value: 70 }
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, goals: mockGoals })
      });

      const updates = [
        { goalId: 'goal-1', updates: { target_value: 60 } },
        { goalId: 'goal-2', updates: { target_value: 70 } }
      ];

      const context = { updateType: 'target' as const, reason: 'bulk_update' };

      const results = await GoalOrchestrator.bulkUpdateGoals(updates, context);

      expect(mockFetch).toHaveBeenCalledWith('/api/goals/bulk-update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates, context })
      });
      expect(results).toEqual(mockGoals);
    });
  });

  describe('archiveCompletedGoals', () => {
    it('should archive completed goals', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, archivedCount: 2 })
      });

      const archivedCount = await GoalOrchestrator.archiveCompletedGoals('user-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/goals/archive-completed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user-1' })
      });
      expect(archivedCount).toBe(2);
    });

    it('should handle API response without archivedCount field', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const archivedCount = await GoalOrchestrator.archiveCompletedGoals('user-1');

      expect(archivedCount).toBe(0);
    });
  });

  describe('getGoalInsights', () => {
    it('should return goal insights from API', async () => {
      const mockInsights = {
        progressTrend: 'stable',
        timeToCompletion: null,
        recommendations: [
          'Stay consistent with your activities',
          'Review your target if needed'
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, insights: mockInsights })
      });

      const insights = await GoalOrchestrator.getGoalInsights('goal-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/goals/goal-1/insights');
      expect(insights).toEqual(mockInsights);
    });

    it('should handle API response without insights field', async () => {
      const mockResponse = {
        goal: {},
        success: true
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const insights = await GoalOrchestrator.getGoalInsights('goal-1');

      expect(insights).toEqual(mockResponse);
    });
  });
}); 