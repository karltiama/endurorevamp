# Data Strategy & Schema Evolution Plan

## 🎯 Current State Analysis

### Data Fields Currently Being Used

Based on codebase analysis, here's what you're **actually using** vs what you're **storing**:

#### **ACTIVELY USED** (High Priority)
```sql
-- Core identification
user_id, strava_activity_id, name, sport_type

-- Basic metrics (used in dashboards)
distance, moving_time, elapsed_time, start_date, start_date_local

-- Performance (used in analytics)
average_speed, max_speed, average_heartrate, max_heartrate

-- Social metrics (used in UI)
kudos_count, comment_count, achievement_count

-- Characteristics (used for filtering)
trainer, commute, manual, private
```

#### **PARTIALLY USED** (Medium Priority)
```sql
-- Power metrics (only for cycling)
average_watts, max_watts, weighted_average_watts, kilojoules

-- Elevation (activity cards)
total_elevation_gain

-- Time zones (data consistency)
timezone

-- Social counts (some components)
athlete_count, photo_count, pr_count
```

#### **STORED BUT NOT USED** (Low Priority)
```sql
-- Legacy compatibility
activity_type

-- Advanced metrics
average_cadence, device_name, device_watts

-- Location data
start_latlng, end_latlng

-- Additional data
calories, description, gear_id

-- Metadata
last_synced_at, created_at, updated_at
```

## 🚀 Future Feature Requirements

### Phase 1: Current MVP (Next 2-4 weeks)
- ✅ Activity sync & display
- ✅ Basic metrics dashboard
- 🔄 Goal tracking system
- 🔄 Weekly/monthly analytics

**Required Fields:** Core + Basic metrics + Performance

### Phase 2: Enhanced Analytics (1-3 months)
- Training load analysis
- Zone-based metrics
- Progressive overload tracking
- Equipment/gear analysis

**Additional Fields Needed:**
```sql
-- Training zones
max_heartrate, average_watts, max_watts
gear_id, device_name

-- Advanced metrics
average_cadence, kilojoules
```

### Phase 3: Advanced Features (3-6 months)
- Route mapping & segments
- Social features & challenges
- Weather integration
- Performance predictions

**Additional Fields Needed:**
```sql
-- Location & mapping
start_latlng, end_latlng

-- Social & community
athlete_count, photo_count, pr_count

-- Environmental
weather_data (future addition)
```

## 🏗️ Schema Evolution Strategy

### Approach: **Iterative Core-First Design**

Instead of storing everything "just in case", follow this pattern:

#### 1. **Core Schema (Now)**
```sql
CREATE TABLE activities (
  -- Identity (required)
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  strava_activity_id BIGINT NOT NULL,
  
  -- Core data (always used)
  name VARCHAR(255) NOT NULL,
  sport_type VARCHAR(50) NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  start_date_local TIMESTAMPTZ NOT NULL,
  
  -- Basic metrics (dashboard critical)
  distance FLOAT, -- meters
  moving_time INTEGER, -- seconds
  elapsed_time INTEGER, -- seconds
  
  -- Performance (analytics critical)
  average_speed FLOAT,
  average_heartrate INTEGER,
  
  -- Sync tracking
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, strava_activity_id)
);
```

#### 2. **Extended Metrics Table (Phase 2)**
```sql
CREATE TABLE activity_metrics (
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  
  -- Power data
  average_watts FLOAT,
  max_watts FLOAT,
  weighted_average_watts FLOAT,
  kilojoules FLOAT,
  
  -- Advanced metrics
  max_speed FLOAT,
  max_heartrate INTEGER,
  average_cadence FLOAT,
  total_elevation_gain FLOAT,
  
  -- Equipment
  device_name VARCHAR(100),
  gear_id VARCHAR(50),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. **Social & Location Data (Phase 3)**
```sql
CREATE TABLE activity_social (
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  kudos_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  achievement_count INTEGER DEFAULT 0,
  pr_count INTEGER DEFAULT 0,
  athlete_count INTEGER DEFAULT 0,
  photo_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE activity_location (
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  start_latlng POINT,
  end_latlng POINT,
  timezone VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔄 Migration Strategy

### Option A: **Clean Slate Approach** (Recommended)
1. **Backup current data**
2. **Create new minimal schema**
3. **Migrate only essential data**
4. **Add extended tables as needed**

### Option B: **Gradual Migration**
1. **Keep current schema**
2. **Add new tables alongside**
3. **Gradually move features to new structure**
4. **Deprecate old fields over time**

## 📋 Implementation Plan

### Week 1: Schema Audit & Core Design
- [ ] Run database schema checker
- [ ] Identify actual vs expected schema mismatches
- [ ] Design minimal core schema
- [ ] Create migration scripts

### Week 2: Core Migration
- [ ] Create new activities table (minimal)
- [ ] Migrate essential data
- [ ] Update sync code to use core fields only
- [ ] Test with current features

### Week 3: Extended Features
- [ ] Add activity_metrics table
- [ ] Implement power/advanced metrics sync
- [ ] Update analytics components

### Week 4: Optimization
- [ ] Add social/location tables if needed
- [ ] Optimize queries and indexes
- [ ] Clean up unused fields/code

## 🎯 Benefits of This Approach

### **Immediate Wins**
- ✅ Faster sync (less data to process)
- ✅ Clearer data models
- ✅ Easier debugging
- ✅ Better performance

### **Long-term Benefits**
- 🚀 Scalable schema evolution
- 🧹 Reduced technical debt
- 🔧 Easier maintenance
- 📊 Better analytics possibilities

## 🔍 Next Steps

1. **Run the DatabaseSchemaChecker** to see current reality
2. **Choose migration approach** (A or B)
3. **Create core schema migration**
4. **Update sync code to match**
5. **Test with minimal viable dataset**

## 📊 Data Priority Matrix

| Field | Current Use | Future Need | Migration Priority |
|-------|-------------|-------------|-------------------|
| `user_id, strava_activity_id` | ✅ Critical | ✅ Critical | 🔴 Phase 1 |
| `name, sport_type, distance` | ✅ Dashboard | ✅ Core features | 🔴 Phase 1 |
| `moving_time, start_date` | ✅ Analytics | ✅ Core features | 🔴 Phase 1 |
| `average_speed, average_heartrate` | ✅ Components | ✅ Training analysis | 🟡 Phase 1-2 |
| `max_watts, kilojoules` | ❌ Unused | ✅ Cycling features | 🟡 Phase 2 |
| `kudos_count, comment_count` | ✅ UI display | ✅ Social features | 🟢 Phase 2-3 |
| `start_latlng, end_latlng` | ❌ Unused | ✅ Route mapping | 🟢 Phase 3 |
| `gear_id, device_name` | ❌ Unused | ✅ Equipment tracking | 🟢 Phase 3 |

---

**Key Principle:** *Store what you use, plan what you need, defer what you might want.* 