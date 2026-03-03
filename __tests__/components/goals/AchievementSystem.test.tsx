import React from 'react';
import { render, screen } from '@testing-library/react';
import { AchievementSystem } from '@/components/goals/AchievementSystem';
import { UserGoal, GoalProgress } from '@/types/goals';

jest.mock('canvas-confetti', () => jest.fn());

const createMockGoal = (overrides: Partial<UserGoal> = {}): UserGoal => ({
  id: 'goal-1',
  user_id: 'user-1',
  goal_type_id: 'weekly_distance',
  target_value: 100,
  target_unit: 'km',
  time_period: 'weekly',
  current_progress: 50,
  streak_count: 0,
  is_active: true,
  is_completed: false,
  priority: 1,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  goal_type: {
    name: 'weekly_distance',
    display_name: 'Weekly Distance',
    description: 'Run weekly distance',
    category: 'distance',
    metric_type: 'total_distance',
    unit: 'km',
    calculation_method: 'sum',
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  ...overrides,
});

const createMockGoalProgress = (
  dates: string[]
): GoalProgress[] =>
  dates.map((activity_date, i) => ({
    id: `progress-${i}`,
    user_goal_id: 'goal-1',
    activity_date,
    value_achieved: 10,
    contribution_amount: 10,
    created_at: activity_date,
  }));

describe('AchievementSystem', () => {
  it('renders achievement stats section', () => {
    const goal = createMockGoal();
    const goalProgress = createMockGoalProgress(['2024-01-15']);
    const userGoals = [goal];

    render(
      <AchievementSystem
        goal={goal}
        goalProgress={goalProgress}
        userGoals={userGoals}
      />
    );

    expect(screen.getByText('Your Achievement Stats')).toBeInTheDocument();
    expect(screen.getByText('Achievement Points')).toBeInTheDocument();
    expect(screen.getByText('Day Streak')).toBeInTheDocument();
    expect(screen.getByText('Goals Completed')).toBeInTheDocument();
    expect(screen.getByText('Achievement Level')).toBeInTheDocument();
  });

  it('calculates total points from unlocked achievements', () => {
    const goal = createMockGoal({
      current_progress: 50,
      target_value: 100,
      is_completed: false,
    });
    const goalProgress = createMockGoalProgress(['2024-01-15']);
    const userGoals = [goal];

    render(
      <AchievementSystem
        goal={goal}
        goalProgress={goalProgress}
        userGoals={userGoals}
      />
    );

    // First Step (10) + Quarter Way (15) + Halfway Hero (30) = 55 pts
    const pointsCell = screen.getByText('Achievement Points').closest('div');
    expect(pointsCell?.previousElementSibling?.textContent).toBe('55');
  });

  it('calculates level from total points', () => {
    const goal = createMockGoal({
      current_progress: 100,
      target_value: 100,
      is_completed: true,
    });
    const goalProgress = createMockGoalProgress(['2024-01-15']);
    const userGoals = [goal];

    render(
      <AchievementSystem
        goal={goal}
        goalProgress={goalProgress}
        userGoals={userGoals}
      />
    );

    // Level = floor(totalPoints/100) + 1. Goal Crusher (150) => level 2
    const levelCell = screen.getByText('Achievement Level').closest('div');
    expect(levelCell?.previousElementSibling?.textContent).toBe('2');
  });

  it('shows zero points when no achievements unlocked', () => {
    const goal = createMockGoal({
      current_progress: 0,
      target_value: 100,
    });
    const goalProgress: GoalProgress[] = [];
    const userGoals = [goal];

    render(
      <AchievementSystem
        goal={goal}
        goalProgress={goalProgress}
        userGoals={userGoals}
      />
    );

    const pointsCell = screen.getByText('Achievement Points').closest('div');
    expect(pointsCell?.previousElementSibling?.textContent).toBe('0');
  });

  it('renders achievement gallery', () => {
    const goal = createMockGoal();
    const goalProgress = createMockGoalProgress(['2024-01-15']);
    const userGoals = [goal];

    render(
      <AchievementSystem
        goal={goal}
        goalProgress={goalProgress}
        userGoals={userGoals}
      />
    );

    expect(screen.getByText('Achievement Gallery')).toBeInTheDocument();
    expect(screen.getByText('Recent Achievements')).toBeInTheDocument();
    expect(screen.getByText('Next Achievements')).toBeInTheDocument();
  });

  it('shows completed goals count in stats', () => {
    const activeGoal = createMockGoal({ id: 'goal-1', is_completed: false });
    const completedGoal = createMockGoal({
      id: 'goal-2',
      is_completed: true,
    });
    const userGoals = [activeGoal, completedGoal];
    const goalProgress = createMockGoalProgress(['2024-01-15']);

    render(
      <AchievementSystem
        goal={activeGoal}
        goalProgress={goalProgress}
        userGoals={userGoals}
      />
    );

    const completedCell = screen.getByText('Goals Completed').closest('div');
    expect(completedCell?.previousElementSibling?.textContent).toBe('1');
  });
});
