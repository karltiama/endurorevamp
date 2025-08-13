# Schema Evolution Strategy

## 🎯 Core Principle: "Schema as Code"

Your database schema should be as version-controlled and systematic as your application code.

## 📊 Current Schema Health Assessment

### ✅ What's Working Well

- **Clear separation of concerns**: Each table has one responsibility
- **Proper normalization**: goal_types → user_goals → goal_progress
- **Flexible storage**: JSONB for evolving data structures
- **Activity tracking**: Comprehensive Strava data capture

### 🚨 Areas for Improvement

- **Missing documentation**: Schema relationships not clearly documented
- **Evolution anxiety**: No clear process for making changes
- **Testing gaps**: Schema changes not systematically tested

## 🛠️ The Schema Evolution Framework

### Phase 1: Documentation & Visualization

```bash
# 1. Always maintain this schema diagram
# Location: docs/schema-diagram.mermaid

# 2. Document each table's purpose
# Location: docs/SCHEMA_REFERENCE.md

# 3. Track all relationships
# Location: docs/TABLE_RELATIONSHIPS.md
```

### Phase 2: Change Process

```bash
# 1. Plan the change
docs/schema-changes/[YYYY-MM-DD]-[change-name].md

# 2. Write the migration
sql/migrations/[timestamp]-[change-name].sql

# 3. Test the migration
__tests__/database/migrations/[change-name].test.ts

# 4. Update documentation
docs/SCHEMA_REFERENCE.md
```

### Phase 3: Validation System

```typescript
// Database schema validation in CI/CD
// __tests__/database/schema-validation.test.ts

describe('Schema Consistency', () => {
  it('maintains all foreign key relationships', async () => {
    // Test that all FK constraints exist
  });

  it('has indexes on all foreign keys', async () => {
    // Test performance indexes
  });

  it('user_goals properly links to goal_types', async () => {
    // Test specific relationships
  });
});
```

## 📋 Schema Change Checklist

When adding/modifying tables, ask these questions:

### 🔍 Design Questions

- [ ] **Single Responsibility**: Does this table do ONE thing well?
- [ ] **Proper Normalization**: Are we avoiding data duplication?
- [ ] **Future-Proof**: Can this evolve without breaking existing data?
- [ ] **Performance**: Do we have indexes on foreign keys and query patterns?

### 🔗 Relationship Questions

- [ ] **Clear Ownership**: Who "owns" this data? (Usually tied to users)
- [ ] **Cascade Behavior**: What happens when parent records are deleted?
- [ ] **Referential Integrity**: Are all foreign keys properly constrained?

### 📚 Documentation Questions

- [ ] **Purpose Documented**: Why does this table exist?
- [ ] **Sample Data**: Do we have realistic test data?
- [ ] **API Impact**: How do schema changes affect our TypeScript types?

## 🎯 Your Current Goals Schema: Analysis

### The Good News 🎉

Your goals schema is actually **very well designed**:

```sql
-- This is a textbook example of good normalization:
goal_types (templates)
  → user_goals (user instances)
    → goal_progress (detailed tracking)
```

### Why It Feels Complex 🤔

1. **It's solving a complex problem** (flexible goal tracking)
2. **Multiple data sources** (Strava + user preferences)
3. **Rich relationships** (many-to-many through user_goals)
4. **Temporal data** (goals change over time)

## 🚀 Practical Next Steps

### 1. Create Schema Documentation

```markdown
# Goal System Architecture

## Tables Overview

- `goal_types`: Pre-defined goal templates (Weekly Distance, 5K Pace, etc.)
- `user_goals`: User's specific goal instances with targets
- `goal_progress`: How each activity contributes to goals
- `user_onboarding`: UX state for goal setup process

## Key Relationships

- Users create multiple goals from goal types
- Activities automatically update goal progress via triggers
- Onboarding tracks which goals are selected for dashboard
```

### 2. Add Schema Testing

```typescript
// Test goal relationships work correctly
it('creates goal progress when activity is added', async () => {
  const user = await createTestUser();
  const goal = await createTestGoal(user.id, 'weekly_distance', { target: 25 });
  const activity = await createTestActivity(user.id, { distance: 5000 });

  const progress = await getGoalProgress(goal.id);
  expect(progress.contribution_amount).toBe(5); // 5km contributed
});
```

### 3. Schema Migration Strategy

```sql
-- Example: Adding dashboard preferences to existing goals
-- sql/migrations/2025-06-18-add-dashboard-preferences.sql

-- Step 1: Add new columns with defaults
ALTER TABLE user_goals
ADD COLUMN show_on_dashboard BOOLEAN DEFAULT false,
ADD COLUMN dashboard_priority INTEGER;

-- Step 2: Update existing data (if needed)
UPDATE user_goals
SET show_on_dashboard = true,
    dashboard_priority = priority
WHERE priority <= 3;

-- Step 3: Add constraints
CREATE INDEX idx_user_goals_dashboard
ON user_goals(user_id, show_on_dashboard, dashboard_priority)
WHERE show_on_dashboard = true;
```

## 🎭 Managing Schema Anxiety

### The Truth About Schema Evolution

- **It's always messy at first** - that's normal!
- **Relationships multiply** - each feature adds complexity
- **Perfect design is impossible** - plan for change, not perfection

### Your Schema Maturity Journey

1. **Naive Stage**: One big table with everything
2. **Learning Stage**: Over-normalize everything ← (You're here!)
3. **Practical Stage**: Balance normalization with pragmatism
4. **Expert Stage**: Design for change and performance

### Tools to Reduce Complexity

```typescript
// 1. Type-safe schema with TypeScript
export interface UserGoal {
  id: string;
  user_id: string;
  goal_type: GoalType; // Relationship clearly typed
  target_value?: number;
  // ... other fields
}

// 2. Schema validation with Zod
const UserGoalSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  goal_type_id: z.string().uuid(),
  // ... validates structure
});

// 3. Database query builders
const userGoals = await db
  .select()
  .from(user_goals)
  .leftJoin(goal_types, eq(user_goals.goal_type_id, goal_types.id))
  .where(eq(user_goals.user_id, userId));
```

## 💡 Key Insight

Your schema complexity is **proportional to your domain complexity**. Goals, activities, progress tracking, and user onboarding are inherently complex concepts. The schema reflects that - and that's good!

## 🎯 Action Plan

1. **Document your current schema** (30 minutes)
2. **Add relationship tests** (1 hour)
3. **Create migration process** (30 minutes)
4. **Stop worrying about complexity** - you're doing great! 🎉

Remember: **Complex domains require complex schemas**. Your job isn't to make it simple - it's to make it manageable and well-documented.
