# Test Coverage Guide

## 📊 Current Coverage Status
- **Overall**: 25.74% statements, 19.64% branches
- **Components**: 35% (needs improvement)
- **Hooks**: ~40% (moderate)
- **API Routes**: 0% (critical gap)
- **Business Logic**: ~30% (needs focus)

## 🎯 Coverage Targets

### High Priority (90%+ target)
- [ ] **API Routes** (`app/api/**`)
- [ ] **Core Business Logic** (`lib/**`)
- [ ] **Authentication** (`lib/auth/`, `hooks/auth/`)
- [ ] **Strava Integration** (`lib/strava/`, `hooks/strava/`)
- [ ] **Goals System** (`lib/goals/`, `hooks/useGoals.ts`)

### Medium Priority (80%+ target)
- [ ] **Dashboard Components** (`components/dashboard/`)
- [ ] **UI Components** (`components/ui/`)
- [ ] **Hooks** (`hooks/`)
- [ ] **Providers** (`providers/`)

### Low Priority (70%+ target)
- [ ] **Analytics Components** (`components/analytics/`)
- [ ] **Debug Components** (`components/debug/`)
- [ ] **Onboarding** (`components/onboarding/`)

## 🧪 Test Categories

### 1. **Unit Tests** (Core Business Logic)
```typescript
// Example: lib/goals/orchestrator.test.ts
describe('GoalOrchestrator', () => {
  it('should calculate progress correctly', () => {
    // Test business logic
  })
  
  it('should handle edge cases', () => {
    // Test error conditions
  })
})
```

### 2. **Integration Tests** (API Routes)
```typescript
// Example: __tests__/api/goals.test.ts
describe('GET /api/goals', () => {
  it('should return user goals', async () => {
    // Test API endpoints
  })
})
```

### 3. **Component Tests** (UI Logic)
```typescript
// Example: __tests__/components/dashboard/KeyMetrics.test.tsx
describe('KeyMetrics', () => {
  it('should render metrics correctly', () => {
    // Test component rendering
  })
  
  it('should handle loading states', () => {
    // Test loading behavior
  })
})
```

### 4. **Hook Tests** (Custom Hooks)
```typescript
// Example: __tests__/hooks/useGoals.test.ts
describe('useGoals', () => {
  it('should fetch goals on mount', () => {
    // Test hook behavior
  })
})
```

## 📋 Test Coverage Checklist

### API Routes (0% → 85% target)
- [ ] `app/api/auth/strava/callback/route.ts`
- [ ] `app/api/auth/strava/token/route.ts`
- [ ] `app/api/goals/route.ts`
- [ ] `app/api/goals/[id]/route.ts`
- [ ] `app/api/strava/activities/route.ts`
- [ ] `app/api/strava/sync/route.ts`
- [ ] `app/api/training/zones/route.ts`

### Core Business Logic (30% → 90% target)
- [ ] `lib/goals/orchestrator.ts`
- [ ] `lib/goals/dynamic-suggestions.ts`
- [ ] `lib/goals/automatic-progress.ts`
- [ ] `lib/strava/sync-activities.ts`
- [ ] `lib/strava/auth.ts`
- [ ] `lib/training/training-load.ts`
- [ ] `lib/training/zone-analysis.ts`
- [ ] `lib/auth/server.ts`

### Components (35% → 80% target)
- [ ] `components/dashboard/KeyMetrics.tsx`
- [ ] `components/dashboard/SyncDashboard.tsx`
- [ ] `components/goals/GoalsProvider.tsx`
- [ ] `components/strava/ActivitiesDashboard.tsx`
- [ ] `components/onboarding/OnboardingModal.tsx`

### Hooks (40% → 90% target)
- [ ] `hooks/useGoals.ts`
- [ ] `hooks/useGoalsOrchestrator.ts`
- [ ] `hooks/use-strava-sync.ts`
- [ ] `hooks/useTrainingLoad.ts`
- [ ] `hooks/useUnitPreferences.ts`

## 🚀 Implementation Strategy

### Phase 1: Critical Path (Week 1)
1. **API Route Tests** - Start with authentication and goals
2. **Core Business Logic** - Focus on goals and Strava sync
3. **Critical Components** - Dashboard and sync components

### Phase 2: Feature Coverage (Week 2)
1. **Remaining API Routes** - Training, analytics endpoints
2. **UI Components** - Complete dashboard coverage
3. **Hooks** - All custom hooks

### Phase 3: Edge Cases (Week 3)
1. **Error Handling** - Test all error scenarios
2. **Edge Cases** - Boundary conditions
3. **Performance** - Load testing for critical paths

## 📈 Coverage Monitoring

### Daily Checks
```bash
# Run tests with coverage
npm test -- --coverage --watchAll=false

# Check specific areas
npm test -- --coverage --collectCoverageFrom="lib/**/*.ts"
npm test -- --coverage --collectCoverageFrom="components/**/*.tsx"
```

### Coverage Reports
- **HTML Report**: `coverage/lcov-report/index.html`
- **Console Summary**: Check percentages in test output
- **CI Integration**: Add coverage thresholds to GitHub Actions

## 🎯 Success Metrics

### Coverage Thresholds
```javascript
// jest.config.js
coverageThreshold: {
  global: {
    statements: 70,
    branches: 60,
    functions: 70,
    lines: 70
  },
  './lib/': {
    statements: 90,
    branches: 80,
    functions: 90,
    lines: 90
  },
  './app/api/': {
    statements: 85,
    branches: 75,
    functions: 85,
    lines: 85
  }
}
```

### Quality Gates
- [ ] All critical paths tested
- [ ] Error scenarios covered
- [ ] Edge cases handled
- [ ] Performance considerations
- [ ] Security implications tested

## 🔧 Tools & Commands

### Coverage Commands
```bash
# Full coverage report
npm test -- --coverage --watchAll=false

# Specific area coverage
npm test -- --coverage --collectCoverageFrom="lib/goals/**/*.ts"

# Coverage with thresholds
npm test -- --coverage --coverageThreshold='{"global":{"statements":70}}'
```

### Test Organization
```
__tests__/
├── api/                    # API route tests
├── components/             # Component tests
├── hooks/                  # Hook tests
├── lib/                    # Business logic tests
├── integration/            # Integration tests
└── e2e/                   # End-to-end tests
```

## 📝 Best Practices

### 1. **Test Structure**
```typescript
describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    // Mock setup
  })

  // Happy path
  it('should render correctly', () => {
    // Test main functionality
  })

  // Edge cases
  it('should handle empty data', () => {
    // Test edge cases
  })

  // Error scenarios
  it('should handle errors gracefully', () => {
    // Test error handling
  })
})
```

### 2. **Mock Strategy**
```typescript
// Mock external dependencies
jest.mock('@/lib/supabase/client')
jest.mock('@/hooks/useAuth')

// Mock API responses
const mockGoals = [{ id: '1', name: 'Test Goal' }]
jest.mocked(fetch).mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ success: true, goals: mockGoals })
})
```

### 3. **Test Data**
```typescript
// Use consistent test data
const mockUser = { id: 'user-1', email: 'test@example.com' }
const mockActivities = [
  { id: '1', distance: 5000, moving_time: 1800 }
]
```

## 🎯 Next Steps

1. **Start with API Routes** - Highest impact, lowest coverage
2. **Focus on Business Logic** - Core functionality
3. **Complete Component Coverage** - UI reliability
4. **Add Integration Tests** - End-to-end scenarios
5. **Monitor & Maintain** - Keep coverage high

## 📊 Progress Tracking

### Weekly Goals
- **Week 1**: API routes (0% → 50%)
- **Week 2**: Business logic (30% → 70%)
- **Week 3**: Components (35% → 60%)
- **Week 4**: Integration & E2E (0% → 30%)

### Success Criteria
- [ ] Overall coverage > 70%
- [ ] Critical paths > 90%
- [ ] No untested business logic
- [ ] All error scenarios covered 