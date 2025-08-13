# API Testing Methodology Guide

## The Problem with Current Patterns

Our test failures are mainly coming from inconsistent API mocking strategies:

1. **Deep mocking** - Mocking implementation details instead of behavior
2. **Inconsistent mock data** - Mock responses don't match real API shapes
3. **Wrong abstraction level** - Mocking React Query hooks instead of HTTP layer
4. **Brittle test setup** - Changes to internal implementation break tests

## Better Testing Strategy: Layered Approach

### Layer 1: HTTP/Network Layer (MSW - Recommended)

Mock at the network level for integration-style tests.

```typescript
// __tests__/setup/msw-handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Supabase API mocks
  http.get('https://test.supabase.co/rest/v1/goals', () => {
    return HttpResponse.json([
      {
        id: '1',
        user_id: 'user-1',
        goal_type_id: 'weekly-distance',
        target_value: 50,
        current_progress: 25,
        // ... full realistic response
      },
    ]);
  }),

  // Strava API mocks
  http.get('https://www.strava.com/api/v3/athlete', () => {
    return HttpResponse.json({
      id: 12345,
      firstname: 'Test',
      lastname: 'User',
      // ... full realistic response
    });
  }),
];
```

### Layer 2: Service Layer (Unit Tests)

Test API client functions in isolation.

```typescript
// __tests__/lib/api/goals.test.ts
import { goalsApi } from '@/lib/api/goals';
import { createClient } from '@/lib/supabase/client';

jest.mock('@/lib/supabase/client');

describe('Goals API', () => {
  it('should fetch user goals with correct query', async () => {
    const mockClient = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() =>
            Promise.resolve({
              data: [
                /* realistic goal data */
              ],
              error: null,
            })
          ),
        })),
      })),
    };
    (createClient as jest.Mock).mockReturnValue(mockClient);

    const goals = await goalsApi.getUserGoals('user-1');

    expect(mockClient.from).toHaveBeenCalledWith('goals');
    expect(goals).toEqual([
      /* expected processed data */
    ]);
  });
});
```

### Layer 3: Hook Layer (React Query)

Test hooks with controlled data, not API calls.

```typescript
// __tests__/hooks/useGoals.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useUserGoals } from '@/hooks/useGoals'

// Mock the API layer, not React Query
jest.mock('@/lib/api/goals', () => ({
  goalsApi: {
    getUserGoals: jest.fn()
  }
}))

describe('useUserGoals', () => {
  it('should return formatted goals data', async () => {
    const mockGoals = [/* realistic API response */]
    require('@/lib/api/goals').goalsApi.getUserGoals.mockResolvedValue(mockGoals)

    const wrapper = ({ children }) => (
      <QueryClientProvider client={new QueryClient()}>
        {children}
      </QueryClientProvider>
    )

    const { result } = renderHook(() => useUserGoals('user-1'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockGoals)
  })
})
```

### Layer 4: Component Layer (Behavior Testing)

Test component behavior with controlled hook returns.

```typescript
// __tests__/components/GoalsList.test.tsx
import { render, screen } from '@testing-library/react'
import { GoalsList } from '@/components/GoalsList'

// Mock the hook, not the API
jest.mock('@/hooks/useGoals', () => ({
  useUserGoals: jest.fn()
}))

describe('GoalsList', () => {
  it('should display goals when loaded', () => {
    const mockGoals = [
      {
        id: '1',
        display_name: 'Weekly Distance',
        current_progress: 25,
        target_value: 50
      }
    ]

    require('@/hooks/useGoals').useUserGoals.mockReturnValue({
      data: { goals: mockGoals },
      isLoading: false,
      isError: false
    })

    render(<GoalsList userId="user-1" />)

    expect(screen.getByText('Weekly Distance')).toBeInTheDocument()
    expect(screen.getByText('25 / 50')).toBeInTheDocument()
  })
})
```

## Key Principles

### 1. **Test Behavior, Not Implementation**

```typescript
// ❌ BAD: Testing how the API is called
expect(mockSupabase.from).toHaveBeenCalledWith('goals');
expect(mockSelect).toHaveBeenCalledWith('*, goal_type(*)');

// ✅ GOOD: Testing what the user sees
expect(screen.getByText('Weekly Distance Goal')).toBeInTheDocument();
expect(screen.getByText('25 / 50 km completed')).toBeInTheDocument();
```

### 2. **Use Realistic Mock Data**

Create a shared fixtures file:

```typescript
// __tests__/fixtures/goals.ts
export const mockGoalFixtures = {
  weeklyDistance: {
    id: '1',
    user_id: 'user-1',
    goal_type_id: 'weekly-distance',
    target_value: 50,
    target_unit: 'km',
    current_progress: 25,
    is_active: true,
    is_completed: false,
    goal_type: {
      id: 'weekly-distance',
      display_name: 'Weekly Distance',
      category: 'distance',
      unit: 'km',
    },
  },
};
```

### 3. **Mock at the Right Level**

- **MSW**: For integration tests, full user journeys
- **API Layer**: For testing data transformation logic
- **Hook Layer**: For testing React Query behavior
- **Component Layer**: For testing UI behavior

### 4. **Consistent Mock Setup**

```typescript
// __tests__/setup/test-utils.tsx
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
})

export const renderWithQuery = (component: ReactElement) => {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      {component}
    </QueryClientProvider>
  )
}
```

## Migration Strategy

1. **Start with component tests** - Mock hooks, not APIs
2. **Add MSW for integration tests** - Real network-level testing
3. **Refactor API layer tests** - Test business logic separately
4. **Remove deep Supabase mocks** - Too brittle and implementation-focused

## Tools to Add

```bash
npm install --save-dev msw @mswjs/data
```

This approach will make your tests:

- ✅ More reliable and less brittle
- ✅ Easier to maintain when APIs change
- ✅ Better at catching real bugs
- ✅ Faster to write and understand
