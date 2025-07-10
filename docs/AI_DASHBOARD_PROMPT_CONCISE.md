# Concise AI Prompt: Training Dashboard

## Task
Build a complete training dashboard layout for a Next.js 14 + TypeScript + shadcn/ui endurance training app.

## Current Problem
Basic dashboard (3 goal widgets + last activity analysis) underutilizes rich training data and lacks direction.

## Goal
Transform into actionable training command center answering: *"What should I do today?"*

## Available Data (Underutilized)
```typescript
interface Activity {
  // Basic: id, name, sport_type, start_date, distance, moving_time
  // Advanced (UNUSED): 
  training_stress_score: number    // TSS
  perceived_exertion: number       // RPE 1-10  
  recovery_time: number           // Hours
  intensity_score: number
  power_zones: object            // JSON zone data
  heart_rate_zones: object
  average_pace: number
}
```

## Required Components (Build All 5)

### 1. TrainingReadinessCard (TOP PRIORITY)
- Recovery score 0-100% (days since workout + RPE + TSS balance)
- Readiness level (High/Medium/Low) with color coding
- Daily recommendation ("Ready for intervals" / "Try easy run")
- Progress bar + badges + quick action buttons

### 2. WeeklyTrainingLoadWidget  
- Current vs target weekly TSS with progress bar
- Zone distribution percentages 
- Workouts completed count
- Mini TSS accumulation chart

### 3. EnhancedGoalProgress
- Keep existing 3-goal system, ADD:
- Trend indicators (↑↓)
- Risk alerts (⚠️ behind schedule)
- Days remaining countdown

### 4. PerformanceInsightsCard
- Recent pace improvement % (last 7 vs previous 7 days)
- Training load trend (↗️↘️)
- Consistency streak (🔥 X days)
- Recent achievements

### 5. QuickActionsSection
- Context-aware buttons: "Log RPE", "Plan Workout", "Sync Activities"

## Technical Stack
- **Components:** shadcn/ui (Card, Progress, Badge, Button)
- **Styling:** Tailwind CSS
- **Data:** React Query with `useUserActivities(userId)` hook
- **Performance:** useMemo for calculations

## Key Calculations
```typescript
// Recovery Score Algorithm
const recoveryScore = 50 
  + Math.min(30, daysSinceWorkout * 8)
  - (lastRPE - 5) * 5  
  + (tssBalance > 50 ? 10 : tssBalance < -100 ? -20 : 0)

// Weekly TSS
const weeklyTSS = thisWeekActivities.reduce((sum, a) => 
  sum + (a.training_stress_score || 0), 0)
```

## Layout Structure
```jsx
<DashboardLayout>
  <TrainingReadinessCard />
  <div className="grid lg:grid-cols-2 gap-6">
    <WeeklyTrainingLoadWidget />
    <PerformanceInsightsCard />
  </div>
  <EnhancedGoalProgress />
  <QuickActionsSection />
</DashboardLayout>
```

## Design Requirements
- **Colors:** Green (high), Yellow (medium), Red (low)
- **Mobile-responsive:** Stack components on small screens
- **Loading states:** Skeleton placeholders
- **TypeScript:** Full type safety
- **Modern aesthetic:** Clean, data-focused training app style

Build complete, production-ready components with proper data processing, error handling, and responsive design. 