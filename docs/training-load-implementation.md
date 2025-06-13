# Training Load Implementation

## Overview

We've implemented a comprehensive training load analysis system that uses **TRIMP** (Training Impulse) and **TSS** (Training Stress Score) methodologies to quantify training stress and provide actionable insights. The system normalizes all training load to a 100-point scale for easy interpretation.

## Key Features

### 📊 Training Load Calculation Methods

1. **TRIMP (Training Impulse)**
   - Heart rate-based calculation using Banister's formula
   - Exponential weighting for intensity zones
   - Sport-specific multipliers for different activities
   - Accounts for duration and heart rate reserve

2. **TSS (Training Stress Score)**
   - Power-based calculation (preferred when available)
   - Heart rate-based fallback for activities without power
   - Normalized to Functional Threshold Power (FTP)
   - Duration and intensity factor considerations

3. **Normalized Load (0-100 scale)**
   - Combines TRIMP and TSS intelligently
   - Weighted average when both metrics available
   - Sport-specific intensity adjustments
   - Easy-to-understand scoring system

### 🎯 Performance Metrics

- **Fitness (CTL)**: Chronic Training Load - 42-day exponentially weighted average
- **Fatigue (ATL)**: Acute Training Load - 7-day exponentially weighted average  
- **Form (TSB)**: Training Stress Balance = CTL - ATL
- **Ramp Rate**: Weekly change in fitness level
- **Training Status**: Peak, Build, Maintain, or Recover phases

## Technical Implementation

### Core Components

1. **`lib/training/training-load.ts`**
   - `TrainingLoadCalculator` class with all calculation methods
   - `estimateAthleteThresholds()` function for automatic threshold detection
   - Sport-specific multiplier constants
   - Interfaces for all data types

2. **`hooks/useTrainingLoad.ts`**
   - React Query hook for data fetching and processing
   - `useTrainingLoad()` - Main hook for training load data
   - `useTrainingLoadRange()` - Date-specific analysis
   - `useTrainingLoadTrends()` - Historical trend analysis

3. **`components/training/TrainingLoadChart.tsx`**
   - Comprehensive visualization component
   - Multiple tabs: Overview, Trends, Details
   - Interactive charts using Recharts
   - Data quality indicators and recommendations

4. **`components/training/TrainingLoadChartClient.tsx`**
   - Client wrapper component for server/client separation
   - Handles authentication and loading states

### Calculation Details

#### TRIMP Formula
```typescript
// Heart rate reserve ratio
const hrReserve = (avgHR - restHR) / (maxHR - restHR)

// Exponential intensity factor
const intensityFactor = hrRatio * 1.92

// Base TRIMP
const trimp = duration * hrRatio * (0.64 * Math.exp(intensityFactor))

// Apply sport multiplier
const finalTrimp = trimp * sportMultiplier
```

#### TSS Formula (Power-based)
```typescript
// Intensity Factor relative to FTP
const intensityFactor = avgPower / functionalThresholdPower

// TSS calculation
const tss = (duration_seconds * normalizedPower * intensityFactor) / (ftp * 3600) * 100
```

#### TSS Formula (HR-based)
```typescript
// Intensity Factor relative to LTHR
const intensityFactor = avgHR / lactateThresholdHR

// HR-based TSS approximation  
const tss = duration_hours * intensityFactor² * 100
```

### Sport-Specific Multipliers

The system applies different intensity multipliers based on activity type:

```typescript
const SPORT_MULTIPLIERS = {
  'Run': 1.0,           // Baseline
  'Ride': 0.85,         // Cycling typically lower intensity
  'VirtualRide': 0.85,
  'Swim': 1.1,          // Swimming often higher intensity
  'Hike': 0.7,
  'Walk': 0.5,
  'Workout': 0.9,
  'WeightTraining': 0.8,
  'Yoga': 0.6,
  // ... additional sports
}
```

### Automatic Threshold Estimation

When user thresholds aren't available, the system estimates:

- **Max Heart Rate**: 95th percentile of recorded max HRs
- **Resting Heart Rate**: 5th percentile of average HRs
- **FTP**: 90th percentile of weighted average watts (activities > 20min)
- **LTHR**: 85% of estimated max heart rate

## UI Components

### Training Load Chart Features

1. **Overview Tab**
   - Current fitness, fatigue, and form metrics
   - Training status indicator with color coding
   - Personalized recommendations
   - Last 30 days load visualization

2. **Trends Tab**
   - 90-day fitness/fatigue/form trends
   - Daily training load distribution
   - Interactive charts with hover details

3. **Details Tab**
   - Estimated athlete thresholds
   - Explanation of metrics and terminology
   - Data quality assessment

### Data Quality Indicators

The system assesses data quality based on:
- **Excellent**: ≥80% HR coverage + ≥20% power data + ≥20 activities
- **Good**: ≥60% HR coverage + ≥15 activities OR ≥40% power + ≥10 activities  
- **Fair**: ≥30% HR coverage OR ≥10 activities
- **Poor**: ≥10% HR coverage OR ≥5 activities
- **None**: Insufficient data

## Integration Points

### Dashboard Integration

The training load chart is integrated into `/dashboard/training` page:

```typescript
// app/dashboard/training/page.tsx
<Suspense fallback={<TrainingLoadSkeleton />}>
  <TrainingLoadChartClient />
</Suspense>
```

### Data Flow

1. **Server Component**: Handles authentication and page structure
2. **Client Wrapper**: Fetches user authentication state
3. **Training Load Hook**: Processes activities into training load metrics
4. **Chart Component**: Renders visualization and insights

## Testing

Comprehensive test suite in `__tests__/lib/training/training-load.test.ts`:

- TRIMP calculation accuracy
- TSS calculation (power and HR-based)
- Sport-specific multiplier application
- Threshold estimation algorithms
- Data processing and filtering
- Metric calculation validation

## Performance Considerations

- **React Query Caching**: 5-minute stale time for training load data
- **Activity Filtering**: Only processes activities > 5 minutes
- **Batch Processing**: Efficient calculation of multiple metrics
- **Threshold Estimation**: Uses all available data for accurate estimates

## Future Enhancements

1. **Custom Threshold Setting**: Allow users to manually set FTP, max HR, etc.
2. **Training Plan Integration**: Compare actual vs. planned training load
3. **Peak Detection**: Automatic identification of peak performance periods
4. **Recovery Recommendations**: AI-powered training suggestions
5. **Comparative Analysis**: Compare against similar athletes
6. **Export Functionality**: Download training load data and charts

## Scientific Basis

This implementation is based on established sports science research:

- **Banister TRIMP**: Widely used in endurance sports training
- **TSS Methodology**: Developed by Dr. Andrew Coggan for power-based training
- **CTL/ATL/TSB Model**: Performance Management Chart methodology
- **Sport Coefficients**: Derived from metabolic equivalent research

The system provides professional-grade training analysis comparable to tools like TrainingPeaks, Golden Cheetah, and WKO5, while being integrated seamlessly into your Strava-based dashboard.

## Code Quality

- **TypeScript**: Full type safety and IntelliSense support
- **React Query**: Robust data fetching and caching
- **Server/Client Separation**: Follows Next.js App Router best practices
- **Component Architecture**: Reusable, testable components
- **Error Handling**: Graceful degradation and user feedback
- **Loading States**: Skeleton components for better UX 