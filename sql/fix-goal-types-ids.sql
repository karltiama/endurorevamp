-- Fix goal_types to use names as IDs instead of UUIDs
-- This makes the code simpler and more maintainable

-- First, update the goal_types table to use name as the primary key
ALTER TABLE goal_types DROP CONSTRAINT IF EXISTS goal_types_pkey;
ALTER TABLE goal_types ADD PRIMARY KEY (name);

-- Update user_goals to reference goal_types by name instead of UUID
ALTER TABLE user_goals DROP CONSTRAINT IF EXISTS user_goals_goal_type_id_fkey;
ALTER TABLE user_goals ALTER COLUMN goal_type_id TYPE VARCHAR(50);
ALTER TABLE user_goals ADD CONSTRAINT user_goals_goal_type_id_fkey 
  FOREIGN KEY (goal_type_id) REFERENCES goal_types(name) ON DELETE CASCADE;

-- Update the goal_types table to remove the UUID id column
ALTER TABLE goal_types DROP COLUMN id;

-- Verify the changes work
SELECT name, display_name, category, metric_type, unit 
FROM goal_types 
ORDER BY category, name; 