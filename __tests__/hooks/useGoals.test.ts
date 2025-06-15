import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useGoalTypes, useUserGoals, useCreateGoal } from '@/hooks/useGoals';
import { GoalType, UserGoal } from '@/types/goals';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Test wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  
  return Wrapper;
};

describe('useGoals hooks', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('useGoalTypes', () => {
    it('should fetch goal types successfully', async () => {
      const mockGoalTypes: GoalType[] = [
        {
          id: '1',
          name: 'weekly_distance',
          display_name: 'Weekly Distance Goal',
          description: 'Set a target distance to run each week',
          unit: 'km',
          category: 'distance',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          goalTypes: mockGoalTypes
        })
      } as Response);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useGoalTypes(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockGoalTypes);
      expect(mockFetch).toHaveBeenCalledWith('/api/goals/types');
    });

    it('should handle fetch error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      } as Response);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useGoalTypes(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('useUserGoals', () => {
    it('should fetch user goals successfully', async () => {
      const mockUserGoals: UserGoal[] = [
        {
          id: '1',
          user_id: 'user-1',
          goal_type_id: 'goal-type-1',
          target_value: 50,
          target_unit: 'km',
          goal_data: {},
          is_active: true,
          is_completed: false,
          priority: 1,
          current_progress: 25,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          goals: mockUserGoals,
          onboarding: null
        })
      } as Response);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useUserGoals(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.goals).toEqual(mockUserGoals);
      expect(mockFetch).toHaveBeenCalledWith('/api/goals');
    });
  });

  describe('useCreateGoal', () => {
    it('should create a goal successfully', async () => {
      const newGoal: UserGoal = {
        id: '2',
        user_id: 'user-1',
        goal_type_id: 'goal-type-1',
        target_value: 30,
        target_unit: 'km',
        goal_data: {},
        is_active: true,
        is_completed: false,
        priority: 1,
        current_progress: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          goal: newGoal
        })
      } as Response);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateGoal(), { wrapper });

      const goalData = {
        goal_type_id: 'goal-type-1',
        target_value: 30,
        target_unit: 'km'
      };

      await waitFor(async () => {
        const createdGoal = await result.current.mutateAsync(goalData);
        expect(createdGoal).toEqual(newGoal);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goalData),
      });
    });

    it('should handle creation error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Goal type is required'
        })
      } as Response);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateGoal(), { wrapper });

      const goalData = {
        goal_type_id: '',
        target_value: 30,
        target_unit: 'km'
      };

      await waitFor(async () => {
        try {
          await result.current.mutateAsync(goalData);
          fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Goal type is required');
        }
      });
    });
  });
}); 