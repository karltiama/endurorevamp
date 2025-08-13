# Reset to Recommended Workout Feature

## Overview

The "Reset to Recommended" feature allows users to clear their saved workout plan and return to the AI-generated recommended workout week. This is useful when users want to:

- Start fresh with a new recommended plan
- Undo custom modifications they've made
- Get updated recommendations based on their latest training data

## Implementation

### Frontend Components

#### Enhanced Workout Planning Dashboard

- **Location**: `components/planning/EnhancedWorkoutPlanningDashboard.tsx`
- **Feature**: Added "Reset to Recommended" button next to "Edit Plan" button
- **Behavior**:
  - Only shows when a workout plan exists
  - Shows loading state during reset operation
  - Automatically refetches data after reset

#### Hook Updates

- **Location**: `hooks/useEnhancedWorkoutPlanning.ts`
- **New Function**: `resetToRecommended()` in `useWorkoutPlanManager`
- **Behavior**:
  - Calls DELETE API endpoint
  - Invalidates React Query cache to refetch fresh data
  - Returns success/error status

### Backend API

#### DELETE Endpoint

- **Route**: `/api/workout-plans`
- **Method**: DELETE
- **Function**: Deletes the current week's saved workout plan
- **Database**: Removes active plan for current week from `workout_plans` table

#### Database Logic

- Calculates current week start date (Sunday)
- Deletes plan where `user_id`, `week_start`, and `is_active = true` match
- Returns success message on completion

## User Flow

1. **User has a saved workout plan** → "Reset to Recommended" button is visible
2. **User clicks button** → Button shows loading state (spinning icon)
3. **API call** → DELETE request to `/api/workout-plans`
4. **Database update** → Current week's plan is deleted
5. **Data refresh** → React Query invalidates cache and refetches
6. **UI update** → Shows fresh recommended plan (no longer saved)

## Testing

### Component Tests

- **File**: `__tests__/components/planning/WorkoutPlanningDashboard.test.tsx`
- **Coverage**:
  - Button renders when plan exists
  - Button calls reset function when clicked
  - Loading state works correctly
  - Button doesn't show when no plan exists

### API Tests

- **File**: `__tests__/api/workout-plans.test.ts`
- **Coverage**:
  - Successful plan deletion
  - Database error handling
  - Authentication error handling

## Technical Details

### React Query Integration

```typescript
// Invalidate queries after reset
await queryClient.invalidateQueries({ queryKey: ['workout-plans', userId] });
await queryClient.invalidateQueries({
  queryKey: ['enhanced-workout-planning', 'weekly-plan'],
});
```

### Database Query

```sql
DELETE FROM workout_plans
WHERE user_id = ?
  AND week_start = ?
  AND is_active = true
```

### Error Handling

- Database errors return 500 status
- Authentication errors return 500 status
- Network errors are caught and logged

## Future Enhancements

1. **Confirmation Dialog**: Add a confirmation modal before resetting
2. **Toast Notifications**: Show success/error messages to user
3. **Undo Functionality**: Allow users to restore recently deleted plans
4. **Bulk Reset**: Reset multiple weeks at once
5. **Reset History**: Track when plans were reset for analytics

## Related Files

- `components/planning/EnhancedWorkoutPlanningDashboard.tsx`
- `hooks/useEnhancedWorkoutPlanning.ts`
- `app/api/workout-plans/route.ts`
- `__tests__/components/planning/WorkoutPlanningDashboard.test.tsx`
- `__tests__/api/workout-plans.test.ts`
