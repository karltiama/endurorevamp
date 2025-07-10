# AI Prompt: Build Training Dashboard Layout

## Context & Background

I'm building an endurance training web app using **Next.js 14 (App Router), TypeScript, React Query, Tailwind CSS, and shadcn/ui components**. Currently my dashboard is basic and lacks direction - just 3 goal widgets and a "last activity deep dive." I need to transform it into an actionable training command center.

## Current Tech Stack
- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui (Card, Badge, Progress, Button, Tabs, etc.)
- **State:** React Query for data fetching
- **Icons:** Lucide React

## Available Data (Rich Training Metrics)
My database contains advanced training data that I'm not utilizing:

```typescript
// Available fields in activities table
interface Activity {
  // Basic fields
  id: string
  user_id: string
  strava_activity_id: number
  name: string
  sport_type: string
  start_date: string
  distance: number
  moving_time: number
  elapsed_time: number
  
  // Performance metrics
  average_speed: number
  average_heartrate: number
  max_heartrate: number
  average_watts: number
  max_watts: number
  
  // Advanced training data (UNDERUTILIZED)
  training_stress_score: number        // TSS
  perceived_exertion: number           // RPE 1-10
  recovery_time: number                // Hours
  intensity_score: number
  training_load_score: number
  normalized_power: number
  
  // Zone data (stored as JSON)
  power_zones: object
  heart_rate_zones: object
  pace_zones: object
  
  // Computed fields
  week_number: number
  average_pace: number
  efficiency_score: number
  elevation_per_km: number
}
```

## Dashboard Philosophy: "What Should I Do Today?"

Transform the dashboard to answer the athlete's daily question: *"How am I doing, and what should I do next?"*

**Dashboard Purpose:** Daily status + actionable insights (not historical analysis)

## Required Dashboard Layout (5 Sections)

### 1. **Training Readiness Card** (TOP PRIORITY)
**Purpose:** "Am I ready to train today?"

**Requirements:**
- Recovery score (0-100%) based on:
  - Days since last workout
  - Last RPE (perceived_exertion field)
  - TSS balance (positive = fresh, negative = fatigued)
  - Recovery time from last activity
- Traffic light readiness level (High/Medium/Low)
- Daily recommendation (e.g., "Ready for intervals", "Try easy run", "Consider rest day")
- Visual: Progress bar, color-coded badges, clear metrics

**Data Sources:** `recovery_time`, `perceived_exertion`, `training_stress_score`

### 2. **Weekly Training Load Widget**
**Purpose:** "How is my training progressing this week?"

**Requirements:**
- Current vs target weekly TSS with progress bar
- Zone distribution (Zone 1-5 percentages) from `power_zones`/`heart_rate_zones`
- Workouts completed this week count
- Mini chart showing TSS accumulation
- Visual: Horizontal progress bars, zone distribution pie chart or bars

**Data Sources:** Aggregate `training_stress_score` by week, zone data

### 3. **Enhanced Goal Progress** (Keep existing but enhance)
**Purpose:** "Am I on track with my goals?"

**Requirements:**
- Keep current 3-goal widget system
- Add trend indicators (↑↓ arrows)
- Add risk alerts (⚠️ for behind schedule)
- Add "days remaining" countdown
- Color-coded status (green/yellow/red)

**Enhancement of existing component, not replacement**

### 4. **Performance Insights Card**
**Purpose:** "How did my recent training go?"

**Requirements:**
- Recent pace improvement percentage (last 7 vs previous 7 days)
- Training load trend (increasing/decreasing/stable)
- Consistency streak (consecutive training days)
- Recent achievements or PRs
- Visual: Trend arrows, streak fire icon, small charts

**Data Sources:** `average_pace` trends, activity frequency, `training_load_score`

### 5. **Quick Actions Section**
**Purpose:** "What should I do next?"

**Requirements:**
- Context-aware action buttons:
  - "Log RPE" (if recent activity missing RPE)
  - "Plan Workout" 
  - "Sync Activities"
  - "Update Goals"
  - "View Training Plan"
- Buttons should be contextual based on user state

## Technical Requirements

### Component Structure
```typescript
// Main dashboard page layout
export default function DashboardPage() {
  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <DashboardHeader />
        
        {/* Training Status - TOP PRIORITY */}
        <TrainingReadinessCard userId={user.id} />
        
        {/* Training Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WeeklyTrainingLoadWidget userId={user.id} />
          <PerformanceInsightsCard userId={user.id} />
        </div>
        
        {/* Enhanced Goals */}
        <EnhancedGoalProgress userId={user.id} />
        
        {/* Quick Actions */}
        <QuickActionsSection userId={user.id} />
      </div>
    </DashboardLayout>
  )
}
```

### Data Fetching Pattern
```typescript
// Use existing hook pattern
const { data: activities, isLoading } = useUserActivities(userId)

// Calculate metrics in useMemo for performance
const trainingMetrics = useMemo(() => {
  // Process activities for TSS, RPE, trends
}, [activities])
```

### Design System
- **Colors:** Green (good/high), Yellow (moderate/medium), Red (low/warning)
- **Cards:** shadcn/ui Card components with proper spacing
- **Progress:** Use Progress component for all progress bars
- **Typography:** Clear hierarchy, readable metrics
- **Responsive:** Mobile-first, stack on small screens

## Specific Implementation Details

### Training Readiness Algorithm
```typescript
// Recovery score calculation
const calculateRecoveryScore = (factors: {
  daysSinceLastWorkout: number
  lastRPE?: number
  tssBalance: number  // weeklyTarget - weeklyActual
  recoveryTimeRemaining?: number
}) => {
  let score = 50 // Base
  
  // Days since workout (recovery benefit)
  score += Math.min(30, daysSinceLastWorkout * 8)
  
  // RPE impact (high RPE = need recovery)
  if (lastRPE) score -= (lastRPE - 5) * 5
  
  // TSS balance
  if (tssBalance < -100) score -= 20 // Heavy fatigue
  else if (tssBalance > 50) score += 10 // Well rested
  
  return Math.max(0, Math.min(100, score))
}
```

### TSS Weekly Calculation
```typescript
// Get current week's TSS
const getWeeklyTSS = (activities: Activity[]) => {
  const startOfWeek = startOfWeek(new Date())
  const weekActivities = activities.filter(a => 
    isAfter(new Date(a.start_date), startOfWeek)
  )
  
  return weekActivities.reduce((sum, activity) => 
    sum + (activity.training_stress_score || 0), 0
  )
}
```

## What I Need You To Build

**Create the complete dashboard layout** with all 5 sections, including:

1. **Full TypeScript React components** for each section
2. **Proper data processing logic** using the available fields
3. **Responsive Tailwind CSS styling** 
4. **Loading states and error handling**
5. **Clean, professional UI** using shadcn/ui components

**Focus on:**
- Making the training data actionable and meaningful
- Clear visual hierarchy and easy scanning
- Mobile responsiveness
- TypeScript type safety
- Performance (useMemo for calculations)

**Style:** Modern, clean, data-focused. Think fitness/training app aesthetic with clear metrics and actionable insights.

## Current Component References
I have these existing components that can be enhanced or replaced:
- `KeyMetrics` (current goal widgets - enhance this)
- `LastActivityDeepDive` (detailed analysis - could be simplified or moved)
- `DashboardLayout` (keep as wrapper)

Build me a complete, production-ready dashboard that transforms my basic widget display into a true training command center! 