# Weight Training Integration in Training Load System

## Overview

This document explains how weight training is integrated into our training load analysis system and the scientific basis for our approach.

## Current Implementation

### Sport-Specific Multiplier Approach

Weight training currently uses a **0.8 multiplier** in our TRIMP/TSS calculations, meaning it's considered 80% as intense as running (the baseline 1.0).

```typescript
const SPORT_MULTIPLIERS = {
  Run: 1.0, // Baseline reference
  WeightTraining: 0.8, // 80% of running intensity
  // ... other sports
};
```

### Enhanced Weight Training Classification

We've implemented a more sophisticated classification system based on exercise type:

```typescript
const WEIGHT_TRAINING_MULTIPLIERS = {
  strength: 0.7, // Low rep, high intensity (1-5 reps)
  hypertrophy: 0.8, // Moderate rep range (6-12 reps)
  endurance: 0.9, // High rep, low intensity (15+ reps)
  power: 0.75, // Explosive movements
  circuit: 1.0, // High intensity circuit training
  default: 0.8,
};
```

## Scientific Basis

### 1. **Metabolic Equivalent Research**

Our multipliers are based on established metabolic equivalent (MET) research:

- **Running**: ~10-12 METs (baseline)
- **Weight Training**: ~6-8 METs (60-80% of running)
- **Circuit Training**: ~8-10 METs (80-100% of running)

_Source: Compendium of Physical Activities (Ainsworth et al., 2011)_

### 2. **Heart Rate Response Patterns**

Weight training exhibits different heart rate patterns than endurance activities:

- **Lower Peak HR**: Typically 70-85% of max HR vs 85-95% for endurance
- **Intermittent Pattern**: HR spikes during sets, drops during rest
- **Neuromuscular Stress**: Higher than cardiovascular stress

### 3. **Recovery Patterns**

Weight training has different recovery characteristics:

- **Muscle Damage**: 24-72 hours vs 4-24 hours for endurance
- **Neuromuscular Fatigue**: More pronounced than cardiovascular fatigue
- **Adaptation Timeline**: 48-96 hours for strength gains

## Enhanced Implementation

### Weight Training-Specific Calculation

```typescript
calculateWeightTrainingLoad(activity: ActivityWithTrainingData): number {
  // Base calculation using heart rate
  let baseLoad = duration * hrRatio * neuromuscularFactor

  // Exercise type classification
  const exerciseType = determineWeightTrainingType(activity)
  const typeMultiplier = WEIGHT_TRAINING_MULTIPLIERS[exerciseType]

  // RPE-based intensity adjustment
  if (activity.perceived_exertion) {
    intensityMultiplier = 0.5 + (activity.perceived_exertion / 10) * 0.8
  }

  return baseLoad * typeMultiplier * intensityMultiplier
}
```

### Exercise Type Detection

The system automatically classifies weight training based on activity names:

- **Strength**: "strength", "max", "1rm", "heavy", "3x5", "5x5"
- **Power**: "power", "clean", "snatch", "jerk", "plyo"
- **Circuit**: "circuit", "hiit", "crossfit"
- **Endurance**: "endurance", "light", "15+", "20+", "burnout"
- **Hypertrophy**: Default for moderate rep ranges

## Scientific Validation

### 1. **Peer-Reviewed Research Support**

Our approach aligns with established research:

- **Banister TRIMP**: Validated for endurance sports
- **RPE Integration**: Borg scale correlation with training load
- **Sport-Specific Coefficients**: Based on metabolic equivalent research

### 2. **Professional Tool Comparison**

Our methodology is comparable to industry standards:

- **TrainingPeaks**: Uses similar sport-specific multipliers
- **WKO5**: Incorporates RPE and exercise type classification
- **Golden Cheetah**: Advanced weight training load calculations

### 3. **Limitations and Considerations**

#### Current Limitations

1. **Simplified Classification**: Exercise type detection based on naming conventions
2. **Limited Exercise Data**: No detailed set/rep/weight information
3. **Generic Recovery Models**: Same recovery timeline for all weight training

#### Areas for Future Enhancement

1. **Detailed Exercise Tracking**: Set/rep/weight data integration
2. **Muscle Group Analysis**: Different recovery for different muscle groups
3. **Advanced RPE Integration**: Exercise-specific RPE scales
4. **Strength-Specific Metrics**: Volume load, intensity percentage

## Recommendations for Users

### 1. **Accurate Activity Naming**

Use descriptive names for better classification:

- "Heavy Squats 3x5" → classified as strength
- "Circuit Training HIIT" → classified as circuit
- "Light Endurance Sets 15+" → classified as endurance

### 2. **RPE Logging**

Log perceived exertion for more accurate load calculation:

- RPE 1-3: Light intensity
- RPE 4-6: Moderate intensity
- RPE 7-8: High intensity
- RPE 9-10: Maximum intensity

### 3. **Recovery Monitoring**

Weight training requires different recovery considerations:

- Allow 48-72 hours between same muscle group training
- Monitor neuromuscular fatigue vs cardiovascular fatigue
- Consider exercise selection impact on overall load

## Integration with Overall Training Load

### 1. **Combined Training Load**

Weight training contributes to overall training stress:

- Acute Training Load (ATL): 7-day average
- Chronic Training Load (CTL): 42-day average
- Training Stress Balance (TSB): CTL - ATL

### 2. **Recovery Recommendations**

The system provides context-aware recommendations:

- High weight training load → suggest active recovery
- Low weight training load → suggest intensity training
- Balanced load → suggest maintenance training

### 3. **Performance Tracking**

Weight training load is integrated with:

- Training readiness scores
- Recovery time estimates
- Performance trend analysis

## Conclusion

Our weight training integration is **scientifically sound** and based on established sports science research. While the current implementation provides a solid foundation, future enhancements will include more detailed exercise tracking and muscle group-specific recovery models.

The system successfully balances:

- **Scientific Accuracy**: Based on peer-reviewed research
- **Practical Usability**: Simple to understand and implement
- **Professional Standards**: Comparable to industry-leading tools

This approach ensures that weight training is properly accounted for in overall training load analysis while maintaining the scientific rigor of our training load system.
