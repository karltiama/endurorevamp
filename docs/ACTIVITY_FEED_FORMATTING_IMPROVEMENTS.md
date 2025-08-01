# Activity Feed Formatting Improvements

## Overview

This document outlines the comprehensive improvements made to the activity feed formatting to address issues with blank metrics, inconsistent speed display, and poor handling of different activity types.

## Issues Identified and Fixed

### 1. Speed Formatting Inconsistency

**Problem**: The ActivityCard was using `formatDistance(normalized.average_speed * 3.6, preferences.distance)/h` while the ActivityDetailModal used a proper `formatSpeed` function that correctly handled mph conversion.

**Solution**: 
- Added a proper `formatSpeed` function to ActivityCard that matches the ActivityDetailModal implementation
- Ensures consistent speed display across both card and detail views
- Properly handles unit conversion (m/s to km/h or mph)

```typescript
const formatSpeed = (speedMs: number) => {
  const speedKmh = speedMs * 3.6
  if (preferences.distance === 'miles') {
    const speedMph = speedKmh * 0.621371
    return `${speedMph % 1 === 0 ? speedMph.toFixed(0) : speedMph.toFixed(1)} mph`
  }
  return `${speedKmh % 1 === 0 ? speedKmh.toFixed(0) : speedKmh.toFixed(1)} km/h`
}
```

### 2. Pace Calculation Bug

**Problem**: The pace calculation was showing incorrect values because it was calculating pace from `moving_time` and `distance` instead of using the pre-computed `average_pace` field from the database.

**Root Cause**: 
- The database stores a pre-computed `average_pace` field (seconds per km) that's calculated during sync
- The ActivityCard was recalculating pace instead of using this pre-computed value
- This led to discrepancies between the card view and detail view

**Solution**:
- Updated both ActivityCard and ActivityDetailModal to use the pre-computed `average_pace` field when available
- Added fallback calculation only when `average_pace` is not available
- Updated TypeScript interfaces to include the computed fields
- Ensures consistent and accurate pace display across all views

```typescript
const calculatePace = () => {
  if (normalized.type === 'Run' && normalized.distance > 0) {
    // Use pre-computed average_pace if available (more accurate)
    if (normalized.average_pace) {
      return formatPace(normalized.average_pace, preferences.pace)
    }
    
    // Fallback to calculation if average_pace not available
    if (normalized.moving_time > 0) {
      const secondsPerKm = normalized.moving_time / (normalized.distance / 1000)
      return formatPace(secondsPerKm, preferences.pace)
    }
  }
  return null
}
```

### 3. Blank Metrics for Missing Data

**Problem**: Activities were showing blank or placeholder values for metrics that weren't recorded (heart rate, power, elevation).

**Solution**: 
- Implemented conditional rendering based on activity type and data availability
- Only show relevant metrics for each sport type
- Gracefully handle missing data without showing empty fields

### 3. Poor Activity Type Handling

**Problem**: All activities showed the same metrics regardless of sport type, leading to irrelevant information being displayed.

**Solution**: 
- Created activity type-specific metric display logic
- Different sports show different relevant metrics
- Adaptive grid layout based on number of available metrics

## Activity Type-Specific Formatting

### Running Activities (`Run`)
- **Quick View**: Distance, Pace (minimal info to encourage "View Details")
- **View Details**: Full metrics including duration, speed, heart rate, elevation
- **Not shown in quick view**: Duration, Speed, Heart Rate, Elevation (to encourage engagement)

### Walking Activities (`Walk`)
- **Quick View**: Distance, Pace (minimal info to encourage "View Details")
- **View Details**: Full metrics including duration, speed, heart rate, elevation
- **Not shown in quick view**: Duration, Speed, Heart Rate, Elevation (to encourage engagement)

### Cycling Activities (`Ride`)
- **Always shown**: Distance, Duration
- **Conditional**: Speed, Power, Heart Rate, Elevation
- **Not shown**: Pace (less relevant for cycling)

### Swimming Activities (`Swim`)
- **Always shown**: Distance, Duration
- **Conditional**: Speed
- **Not shown**: Elevation (always 0), Power, Heart Rate (rarely recorded)

### Weight Training (`WeightTraining`, `Workout`)
- **Always shown**: Duration
- **Not shown**: Distance, Speed, Pace, Elevation, Power, Heart Rate

### Walking/Hiking (`Hike`)
- **Always shown**: Distance, Duration
- **Conditional**: Speed, Heart Rate, Elevation
- **Not shown**: Power, Pace

## Implementation Details

### Dynamic Metric Selection

The `getActivityMetrics()` function determines which metrics to display based on activity type and data availability:

```typescript
const getActivityMetrics = () => {
  const metrics = []
  
  // For weight training/workout activities, only show duration
  if (['WeightTraining', 'Workout'].includes(normalized.type)) {
    metrics.push({
      label: 'Duration',
      value: formatDuration(normalized.moving_time),
      color: 'text-green-600'
    })
    return metrics
  }
  
  // For other activities, show distance and duration
  metrics.push({
    label: 'Distance',
    value: formatDistanceWithUnits(normalized.distance),
    color: 'text-blue-600'
  })
  
  metrics.push({
    label: 'Duration',
    value: formatDuration(normalized.moving_time),
    color: 'text-green-600'
  })

  // Show speed for activities that typically have it
  if (normalized.average_speed && ['Run', 'Ride', 'Walk', 'Hike', 'Swim'].includes(normalized.type)) {
    metrics.push({
      label: 'Avg Speed',
      value: formatSpeed(normalized.average_speed),
      color: 'text-purple-600'
    })
  }

  // Show pace for running activities
  const pace = calculatePace()
  if (pace) {
    metrics.push({
      label: 'Avg Pace',
      value: pace,
      color: 'text-indigo-600'
    })
  }

  // Show elevation if available and significant
  if (normalized.total_elevation_gain > 0) {
    metrics.push({
      label: 'Elevation',
      value: `↗ ${normalized.total_elevation_gain}m`,
      color: 'text-orange-600'
    })
  }

  return metrics
}
```

### Additional Metrics Logic

The `getAdditionalMetrics()` function handles secondary metrics based on activity type:

```typescript
const getAdditionalMetrics = () => {
  const metrics = []
  
  // Heart rate for cardio activities
  if (normalized.average_heartrate && ['Run', 'Ride', 'Walk', 'Hike', 'Swim'].includes(normalized.type)) {
    metrics.push({
      icon: '❤️',
      value: `${normalized.average_heartrate} bpm`,
      label: 'Avg HR',
      color: 'text-red-500'
    })
  }
  
  // Power for cycling activities
  if (normalized.average_watts && ['Ride'].includes(normalized.type)) {
    metrics.push({
      icon: '⚡',
      value: `${normalized.average_watts}w`,
      label: 'Avg Power',
      color: 'text-yellow-500'
    })
  }
  
  // Always show kudos
  metrics.push({
    icon: '👍',
    value: normalized.kudos_count.toString(),
    label: 'Kudos',
    color: 'text-blue-500'
  })

  return metrics
}
```

### Improved Layout Design

The new layout creates better visual flow and coherence:

#### 1. **Header Section**
- Activity icon, name, and type on the left
- Date and time on the right
- Clear visual hierarchy with proper spacing

#### 2. **Primary Metrics Section**
- Metrics displayed in card-like containers with gray backgrounds
- Responsive grid layout that adapts to the number of metrics
- Clear visual separation between different metric types
- Consistent styling with proper color coding

#### 3. **Secondary Metrics Section**
- Only appears when there are additional metrics to show
- Separated by a subtle border line
- Metrics displayed horizontally with icons and labels
- Better visual grouping of related information

#### 4. **Footer Section**
- RPE badge on the left
- View Details button on the right
- Clear call-to-action with proper styling

### Adaptive Grid Layout

The grid layout adapts based on the number of metrics available:

```typescript
<div className={`grid gap-4 ${
  activityMetrics.length === 1 ? 'grid-cols-1' : 
  activityMetrics.length === 2 ? 'grid-cols-2' : 
  activityMetrics.length === 3 ? 'grid-cols-3' : 
  'grid-cols-2 md:grid-cols-4'
}`}>
```

This ensures optimal use of space and maintains visual balance regardless of the number of metrics displayed.

## Pace Calculation

Added proper pace calculation for running activities:

```typescript
const calculatePace = () => {
  if (normalized.type === 'Run' && normalized.distance > 0 && normalized.moving_time > 0) {
    const secondsPerKm = normalized.moving_time / (normalized.distance / 1000)
    const minutes = Math.floor(secondsPerKm / 60)
    const seconds = Math.floor(secondsPerKm % 60)
    const unitSuffix = preferences.distance === 'miles' ? '/mi' : '/km'
    return `${minutes}:${seconds.toString().padStart(2, '0')}${unitSuffix}`
  }
  return null
}
```

## Testing

Comprehensive tests were created to verify:

1. **Basic functionality**: Activity information display
2. **Metric formatting**: Distance, duration, speed, pace
3. **Activity type handling**: Different sports show appropriate metrics
4. **Missing data handling**: Graceful handling of undefined/null values
5. **Grid layout adaptation**: Responsive design based on metric count
6. **User interactions**: View details button functionality

### Test Coverage

- ✅ Basic activity information rendering
- ✅ Distance and duration formatting
- ✅ Speed display for relevant activities
- ✅ Pace calculation for running activities
- ✅ Elevation display when available
- ✅ Heart rate for cardio activities
- ✅ Power for cycling activities
- ✅ Kudos count display
- ✅ Private activity badges
- ✅ RPE badge functionality
- ✅ Weight training activity handling
- ✅ Swimming activity handling
- ✅ Cycling activity handling
- ✅ Grid layout adaptation
- ✅ User interaction testing

## Benefits

### User Experience
- **Cleaner interface**: No more blank or irrelevant metrics
- **Relevant information**: Each activity type shows appropriate data
- **Consistent formatting**: Speed and other metrics display consistently
- **Better readability**: Adaptive layouts prevent overcrowding

### Developer Experience
- **Maintainable code**: Clear separation of concerns
- **Type safety**: Proper TypeScript typing for all activity types
- **Testable**: Comprehensive test coverage
- **Extensible**: Easy to add new activity types or metrics

### Performance
- **Conditional rendering**: Only renders relevant components
- **Efficient calculations**: Pace and speed calculated only when needed
- **Optimized layouts**: Grid adapts to content automatically

## Future Enhancements

### Potential Improvements
1. **Custom metric preferences**: Allow users to choose which metrics to display
2. **Activity type icons**: Sport-specific icons for better visual identification
3. **Metric tooltips**: Hover explanations for technical metrics
4. **Export functionality**: Export activity data with consistent formatting
5. **Bulk operations**: Apply formatting preferences across multiple activities

### New Activity Types
The current implementation can easily accommodate new activity types by:
1. Adding the sport type to the relevant arrays in `getActivityMetrics()`
2. Adding sport-specific logic in `getAdditionalMetrics()`
3. Creating appropriate test cases

## Favorite Feature Implementation

### Overview
Added a comprehensive favorite system that allows users to mark activities as favorites for quick access and filtering.

### Features Implemented

#### 1. **Database Schema**
- Added `is_favorite` boolean field to activities table
- Created index for efficient filtering: `idx_activities_is_favorite`
- Default value: `false`

#### 2. **API Endpoint**
- **Route**: `PATCH /api/activities/[id]/favorite`
- **Functionality**: Toggles favorite status for an activity
- **Security**: Validates user ownership before allowing changes
- **Response**: Returns updated favorite status and success message

#### 3. **UI Components**
- **Favorite Button**: Heart icon in ActivityCard footer
- **Visual States**: 
  - Filled red heart for favorited activities
  - Outline heart for unfavorited activities
- **Hover Effects**: Smooth color transitions
- **Loading State**: Disabled during API calls

#### 4. **Filtering System**
- **Favorites Filter**: Shows only favorited activities
- **Removed Flagged**: Replaced flagged functionality with favorites
- **Filter UI**: Clean, enabled filter buttons

#### 5. **State Management**
- **Custom Hook**: `useFavoriteActivity()` for managing favorite operations
- **Cache Invalidation**: Automatically refreshes activity list after changes
- **Optimistic Updates**: Immediate UI feedback

### Technical Implementation

#### Database Migration
```sql
ALTER TABLE activities ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE;
CREATE INDEX idx_activities_is_favorite ON activities(user_id, is_favorite);
```

#### TypeScript Interfaces
```typescript
interface Activity {
  // ... existing fields
  is_favorite?: boolean; // User can mark activities as favorites
}
```

#### API Response
```typescript
{
  is_favorite: boolean,
  message: string // "Activity added to favorites" or "Activity removed from favorites"
}
```

#### Filter Logic
```typescript
case 'favorite':
  filteredActivities = allActivities.filter((activity: Activity) => 
    activity.is_favorite === true
  )
  break
```

### User Experience

#### Visual Design
- **Heart Icon**: Intuitive symbol for favorites
- **Color Coding**: Red for favorited, gray for unfavorited
- **Tooltips**: Clear action descriptions
- **Smooth Transitions**: Professional feel

#### Interaction Flow
1. User clicks heart icon on any activity
2. Button shows loading state
3. API call toggles favorite status
4. UI updates immediately
5. Activity list refreshes to show changes

#### Filtering Experience
1. User clicks "Favorites" filter
2. Only favorited activities are displayed
3. Clear visual indication of active filter
4. Easy return to "All" activities

### Testing Coverage

#### Unit Tests
- ✅ Favorite button rendering (filled vs outline)
- ✅ API endpoint functionality
- ✅ Filter logic for favorites
- ✅ Hook state management
- ✅ Error handling

#### Integration Tests
- ✅ End-to-end favorite toggle
- ✅ Filter persistence
- ✅ Cache invalidation
- ✅ User authorization

### Benefits

#### User Benefits
- **Quick Access**: Easy to find important activities
- **Personal Organization**: Custom categorization system
- **Visual Feedback**: Clear indication of favorite status
- **Efficient Filtering**: Fast access to favorited content

#### Developer Benefits
- **Clean Architecture**: Separated concerns with custom hooks
- **Type Safety**: Full TypeScript coverage
- **Testable**: Comprehensive test suite
- **Extensible**: Easy to add more personalization features

### Future Enhancements
1. **Bulk Operations**: Select multiple activities to favorite/unfavorite
2. **Favorite Categories**: Organize favorites into custom categories
3. **Export Favorites**: Export only favorited activities
4. **Favorite Analytics**: Track which activities are most favorited
5. **Sync with Strava**: Integrate with Strava's starring system 