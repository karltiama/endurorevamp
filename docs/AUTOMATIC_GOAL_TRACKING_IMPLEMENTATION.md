# Automatic Goal Tracking Implementation

## Overview

Your goals are now **automatically connected to your Strava activity data**! This implementation ensures that goal progress updates in real-time whenever you complete activities, without any manual intervention.

## 🎯 What's Now Automatically Tracked

### Quantifiable Goals (Auto-Updated)

These goals calculate progress automatically from your Strava activities:

1. **Distance Goals**
   - `total_distance`: Weekly/monthly distance targets (e.g., "Run 50km this week")
   - `max_distance`: Longest single run goals (e.g., "Run 15km in one session")

2. **Pace Goals**
   - `average_pace`: Pace improvement targets (e.g., "5K pace under 4:30/km")
   - Calculated from activities within specific distance ranges

3. **Frequency Goals**
   - `run_count`: Running consistency (e.g., "Run 4 times per week")
   - Each completed activity counts toward the target

4. **Time-Based Goals**
   - `total_time`: Time on feet targets (e.g., "6 hours of running per week")
   - `max_duration`: Longest run duration (e.g., "Run for 90+ minutes")

5. **Elevation Goals**
   - `total_elevation`: Weekly elevation gain (e.g., "Climb 500m this week")
   - `elevation_per_km`: Hill training consistency

### Manual Goals (Require Special Data)

These still need manual updates or special equipment:

- Heart rate zone training (requires HR monitor data)
- Race time goals (manual entry after races)
- Weight loss goals (non-activity based)

## 🔧 Technical Implementation

### Core Components

#### 1. `AutomaticGoalProgress` Class (`lib/goals/automatic-progress.ts`)

Central service handling all automatic calculations:

```typescript
// Called automatically after each activity sync
await AutomaticGoalProgress.updateProgressFromActivity(userId, activity);

// Available for manual recalculation
await AutomaticGoalProgress.recalculateAllProgress(userId);

// Analyze which goals can be auto-tracked
const stats = await AutomaticGoalProgress.getQuantifiableGoals(userId);
```

#### 2. Sync Integration (`lib/strava/sync-activities.ts`)

Automatic goal updates are now part of the activity sync process:

```typescript
// After successful activity storage
try {
  await AutomaticGoalProgress.updateProgressFromActivity(userId, activityData);
  console.log(`🎯 Updated goal progress for activity ${activity.id}`);
} catch (goalError) {
  // Non-critical - sync continues even if goal update fails
}
```

#### 3. Database Function (`sql/onboarding_goals.sql`)

Uses your existing `update_goal_progress_from_activity()` function to:

- Loop through all active goals for the user
- Calculate appropriate contributions based on metric type
- Update progress and best results
- Mark goals as completed when targets are reached

#### 4. UI Components

- **Goals Page**: Enhanced with automatic tracking tab
- **AutomaticGoalTracker**: New component showing auto vs manual goals
- **Real-time Progress**: Updates immediately after sync

## 📊 Data Flow

```
Strava Activity → Activity Sync → Goal Progress Update → UI Refresh
     ↓               ↓                    ↓              ↓
  Raw metrics → Store in DB → Calculate contributions → Show progress
```

### Specific Calculations

**Distance Goals**: `activity.distance / 1000` (convert meters to km)
**Pace Goals**: `activity.moving_time / (activity.distance / 1000)` (seconds per km)
**Frequency Goals**: `+1` for each completed activity
**Time Goals**: `activity.moving_time / 3600` (convert seconds to hours)
**Elevation Goals**: `activity.total_elevation_gain` (meters)

## 🎨 User Experience

### Before (Manual)

- User runs 5km
- Activity syncs to database
- Goal progress remains unchanged
- User must manually update goal progress
- Easy to forget or make mistakes

### After (Automatic) ✨

- User runs 5km
- Activity syncs to database
- **Goal progress updates automatically**
- Weekly distance goal: +5km
- Frequency goal: +1 run
- Pace goal: Updated if it's a PR
- User sees immediate progress in UI

## 🔍 Debugging & Management

### Auto-Tracking Dashboard

New "Auto Tracking" tab in goals page shows:

- Total goals vs auto-tracked percentage
- Which goals are automatically updated
- Which goals require manual input
- Last update timestamps
- Recalculate button for data corrections

### Progress Verification

The system tracks:

- When each goal was last updated
- Which activities contributed to each goal
- Detailed progress history in `goal_progress` table

### Data Integrity

- Progress updates are **non-critical** - if they fail, activity sync continues
- Full recalculation available if data gets out of sync
- Activity data is the source of truth

## 🚀 Benefits

1. **Zero Manual Effort**: Goals update automatically with every run
2. **Real-time Feedback**: See progress immediately after activities sync
3. **Accurate Tracking**: No human error in progress calculation
4. **Smart Categorization**: System knows which goals can vs can't be automated
5. **Fault Tolerant**: Goal failures don't break activity sync

## 🔮 Future Enhancements

Potential additions when data becomes available:

- Heart rate zone automatic tracking (requires HR data in activities)
- Training load calculations
- Performance trend analysis
- Automatic goal suggestions based on progress patterns

## ✅ Testing Your Implementation

1. **Create a quantifiable goal** (e.g., "Run 20km this week")
2. **Complete a Strava activity** and sync it
3. **Check the Goals page** - progress should update automatically
4. **Visit the "Auto Tracking" tab** to see the system status
5. **Use "Recalculate All Progress"** if needed to rebuild from existing activities

## 🔧 Troubleshooting

**Progress not updating?**

- Check the sync logs for goal update messages
- Use the "Recalculate All Progress" button
- Verify the goal type is in the auto-trackable list

**Wrong progress values?**

- Use recalculation to rebuild from source data
- Check if goal time period (weekly/monthly) is correct
- Verify activity data quality in the database

Your goals are now truly connected to your running data! 🏃‍♂️🎯
