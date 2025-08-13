# Dashboard Strategy & Direction

## 🎯 Problem Statement

**Current State:** Basic dashboard with goal widgets + last activity analysis
**Issue:** No clear direction, overlaps with dedicated analytics pages, underutilizes rich training data

**Available Data We're Not Using:**

- Training Stress Score (TSS)
- Recovery time estimates
- Perceived exertion (RPE)
- Zone analysis data (power/HR/pace zones)
- Training load trends
- Intensity distribution

---

## 🧭 Dashboard Philosophy: "What Should I Do Today?"

Your main dashboard should answer the athlete's daily question:

> _"How am I doing, and what should I do next?"_

### 📊 Dashboard vs. Other Pages

| **Main Dashboard**      | **Analytics Page**   | **Training Page**         |
| ----------------------- | -------------------- | ------------------------- |
| Daily status & insights | Historical analysis  | Detailed training metrics |
| Next actions            | Activity deep-dives  | Training load planning    |
| Weekly overview         | Performance trends   | Zone distribution         |
| Recovery status         | Comparative analysis | Periodization             |

---

## 🏗️ Proposed Dashboard Layout

### **Section 1: Training Status (Top Priority)**

_"Am I ready to train today?"_

```
┌─────────────────────────────────────────────────────────┐
│ 🔋 Training Readiness                    📅 Today      │
│                                                         │
│ ● Recovery Score: 85%        ● TSS Balance: -120       │
│ ● Last RPE: 7/10            ● Sleep: 7.5hrs            │
│ ● Recommendation: EASY RUN                             │
└─────────────────────────────────────────────────────────┘
```

**Data Sources:**

- `recovery_time` field
- `perceived_exertion` from last activity
- `training_stress_score` trend
- Computed training load balance

### **Section 2: Weekly Training Load**

_"How is my training progressing this week?"_

```
┌─────────────────────────────────────────────────────────┐
│ 📈 This Week's Training Load                           │
│                                                         │
│ TSS: 450 / 500 target     ████████░░ 90%              │
│ Zone 2: 70% | Zone 4: 20% | Zone 5: 10%               │
│ 3 workouts | 2 easy days remaining                     │
└─────────────────────────────────────────────────────────┘
```

**Data Sources:**

- `training_stress_score` aggregated weekly
- `intensity_score` for zone distribution
- `power_zones`, `heart_rate_zones` data

### **Section 3: Goal Progress (Enhanced)**

_"Am I on track with my goals?"_

```
┌─────────────────────────────────────────────────────────┐
│ 🎯 Goal Progress                                       │
│                                                         │
│ Marathon Training    ████████░░ 80%  ON TRACK         │
│ Weekly Distance     ████████▓▓ 90%   AHEAD            │
│ Speed Work          ██░░░░░░░░ 20%   ⚠️ BEHIND          │
└─────────────────────────────────────────────────────────┘
```

**Enhancement:** Color-coded alerts, trend indicators, actionable insights

### **Section 4: Performance Insights**

_"How did my recent training go?"_

```
┌─────────────────────────────────────────────────────────┐
│ 🏃‍♂️ Recent Performance                                   │
│                                                         │
│ Last 7 days:  ▲ 2% pace improvement                   │
│ Training load: ▼ 5% decrease (good recovery)          │
│ Consistency:   🔥 5-day streak                         │
└─────────────────────────────────────────────────────────┘
```

**Data Sources:**

- `average_pace` trends
- `training_load_score` analysis
- Activity frequency patterns

### **Section 5: Quick Actions**

_"What should I do next?"_

```
┌─────────────────────────────────────────────────────────┐
│ ⚡ Recommended Actions                                  │
│                                                         │
│ [Schedule Recovery Run] [Log RPE] [Update Goals]       │
│ [Sync Activities]      [View Training Plan]           │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Implementation Strategy

### **Phase 1: Training Readiness Widget**

- Use `recovery_time`, `perceived_exertion`, `training_stress_score`
- Simple traffic light system (Red/Yellow/Green)
- Actionable recommendations

### **Phase 2: Weekly Training Load**

- Aggregate `training_stress_score` by week
- Show target vs. actual TSS
- Zone distribution from stored zone data

### **Phase 3: Enhanced Goal Progress**

- Keep current goal widgets but add:
  - Trend indicators (↑↓)
  - Risk alerts (behind schedule)
  - Next milestone countdown

### **Phase 4: Performance Insights**

- Recent trend analysis
- Comparative metrics
- Achievement highlights

### **Phase 5: Quick Actions**

- Context-aware action buttons
- Integration with other app sections
- Workflow shortcuts

---

## 📋 Specific Components to Build

### 1. **TrainingReadinessCard**

```typescript
interface TrainingReadiness {
  recoveryScore: number; // 0-100
  readinessLevel: 'low' | 'medium' | 'high';
  recommendation: string;
  lastRPE?: number;
  tssBalance: number; // Positive = fresh, negative = fatigued
}
```

### 2. **WeeklyTrainingLoadWidget**

```typescript
interface WeeklyTrainingLoad {
  currentTSS: number;
  targetTSS: number;
  zoneDistribution: {
    zone1: number;
    zone2: number;
    zone3: number;
    zone4: number;
    zone5: number;
  };
  workoutsCompleted: number;
  workoutsPlanned: number;
}
```

### 3. **PerformanceInsightsCard**

```typescript
interface PerformanceInsights {
  paceImprovement: {
    value: number;
    trend: 'up' | 'down' | 'stable';
    timeframe: string;
  };
  consistencyStreak: number;
  trainingLoadTrend: 'increasing' | 'decreasing' | 'stable';
  achievements: Achievement[];
}
```

---

## 🎯 Success Metrics

**User Engagement:**

- Time spent on dashboard (should increase)
- Click-through to action items
- Goal completion rates

**Data Utilization:**

- Percentage of advanced fields being displayed
- User interaction with training recommendations
- RPE entry frequency

**UX Quality:**

- Reduced navigation to find key information
- Faster decision-making ("What should I train today?")
- Increased user satisfaction scores

---

## 🔮 Future Enhancements

### **Smart Recommendations**

- AI-powered training suggestions based on TSS patterns
- Weather-aware workout recommendations
- Equipment-specific suggestions

### **Social Integration**

- Training partner coordination
- Challenge participation
- Achievement sharing

### **Predictive Analytics**

- Race performance predictions
- Injury risk assessment
- Optimal training load recommendations

---

## 🚀 Getting Started

1. **Audit Current Data Usage** - Run schema analysis to see what training data exists but isn't used
2. **Build TrainingReadinessCard** - Start with recovery time + RPE + TSS balance
3. **Create WeeklyTrainingLoadWidget** - Aggregate TSS data by week
4. **Enhance Goal Progress** - Add trend indicators and risk alerts
5. **Add Quick Actions** - Context-aware action buttons

This approach transforms your dashboard from a passive display into an **actionable training command center** that helps athletes make better daily training decisions.
