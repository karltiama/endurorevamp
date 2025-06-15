-- User Goals Schema for Onboarding
-- This schema supports multiple goal types and flexible progress tracking

-- Goal categories/types that users can choose from
CREATE TABLE goal_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- e.g., 'weekly_distance', 'race_preparation', 'fitness_improvement'
    display_name TEXT NOT NULL, -- e.g., 'Weekly Distance Goal', 'Race Preparation'
    description TEXT,
    unit TEXT, -- e.g., 'km', 'miles', 'hours', 'race_date'
    category TEXT NOT NULL, -- e.g., 'distance', 'time', 'event', 'general'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User's selected goals during onboarding
CREATE TABLE user_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_type_id UUID NOT NULL REFERENCES goal_types(id),
    
    -- Goal target values (flexible JSON structure)
    target_value NUMERIC, -- e.g., 50 (km per week), 21.1 (half marathon distance)
    target_unit TEXT, -- e.g., 'km', 'miles', 'race_date'
    target_date DATE, -- for race preparation or deadline goals
    
    -- Additional goal metadata
    goal_data JSONB DEFAULT '{}', -- flexible storage for goal-specific data
    
    -- Goal status
    is_active BOOLEAN DEFAULT true,
    is_completed BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 1, -- 1 = highest priority
    
    -- Progress tracking
    current_progress NUMERIC DEFAULT 0,
    progress_unit TEXT,
    last_progress_update TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    UNIQUE(user_id, goal_type_id, is_active) -- User can have one active goal per type
);

-- Goal progress entries for detailed tracking
CREATE TABLE goal_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_goal_id UUID NOT NULL REFERENCES user_goals(id) ON DELETE CASCADE,
    
    -- Progress data
    progress_value NUMERIC NOT NULL,
    progress_unit TEXT NOT NULL,
    progress_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Context (could be from Strava activities)
    source TEXT DEFAULT 'manual', -- 'manual', 'strava', 'import'
    source_id TEXT, -- e.g., Strava activity ID
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User onboarding status
CREATE TABLE user_onboarding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Onboarding steps completion
    goals_completed BOOLEAN DEFAULT false,
    strava_connected BOOLEAN DEFAULT false,
    profile_completed BOOLEAN DEFAULT false,
    first_sync_completed BOOLEAN DEFAULT false,
    
    -- Onboarding metadata
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    current_step TEXT DEFAULT 'goals', -- 'goals', 'strava', 'profile', 'sync', 'complete'
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX idx_user_goals_active ON user_goals(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_goal_progress_user_goal ON goal_progress(user_goal_id);
CREATE INDEX idx_goal_progress_date ON goal_progress(progress_date);
CREATE INDEX idx_user_onboarding_user_id ON user_onboarding(user_id);

-- Row Level Security (RLS) policies
ALTER TABLE goal_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;

-- Goal types are public (read-only for authenticated users)
CREATE POLICY "Goal types are viewable by authenticated users" ON goal_types
    FOR SELECT USING (auth.role() = 'authenticated');

-- Users can only access their own goals
CREATE POLICY "Users can view their own goals" ON user_goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" ON user_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" ON user_goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" ON user_goals
    FOR DELETE USING (auth.uid() = user_id);

-- Users can only access their own progress
CREATE POLICY "Users can view their own progress" ON goal_progress
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM user_goals WHERE id = user_goal_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own progress" ON goal_progress
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM user_goals WHERE id = user_goal_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own progress" ON goal_progress
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM user_goals WHERE id = user_goal_id AND user_id = auth.uid()
    ));

-- Users can only access their own onboarding data
CREATE POLICY "Users can view their own onboarding" ON user_onboarding
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding" ON user_onboarding
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding" ON user_onboarding
    FOR UPDATE USING (auth.uid() = user_id);

-- Insert default goal types
INSERT INTO goal_types (name, display_name, description, unit, category) VALUES
    ('weekly_distance', 'Weekly Distance Goal', 'Set a target distance to run each week', 'km', 'distance'),
    ('monthly_distance', 'Monthly Distance Goal', 'Set a target distance to run each month', 'km', 'distance'),
    ('race_preparation', 'Race Preparation', 'Prepare for an upcoming race', 'race_date', 'event'),
    ('fitness_improvement', 'General Fitness', 'Improve overall running fitness', 'general', 'general'),
    ('weight_loss', 'Weight Management', 'Use running to support weight management goals', 'kg', 'health'),
    ('consistency', 'Running Consistency', 'Build a consistent running habit', 'runs_per_week', 'habit'),
    ('speed_improvement', 'Speed Improvement', 'Improve running pace and speed', 'pace', 'performance'),
    ('endurance_building', 'Endurance Building', 'Build long-distance running endurance', 'distance', 'performance');

-- Function to update goal progress from activities
CREATE OR REPLACE FUNCTION update_goal_progress_from_activity(
    p_user_id UUID,
    p_activity_distance NUMERIC,
    p_activity_date DATE,
    p_activity_id TEXT
) RETURNS void AS $$
DECLARE
    goal_record RECORD;
BEGIN
    -- Update weekly distance goals
    FOR goal_record IN 
        SELECT ug.id, ug.target_value, ug.current_progress
        FROM user_goals ug
        JOIN goal_types gt ON ug.goal_type_id = gt.id
        WHERE ug.user_id = p_user_id 
        AND gt.name = 'weekly_distance' 
        AND ug.is_active = true
    LOOP
        -- Insert progress record
        INSERT INTO goal_progress (user_goal_id, progress_value, progress_unit, progress_date, source, source_id)
        VALUES (goal_record.id, p_activity_distance, 'km', p_activity_date, 'strava', p_activity_id);
        
        -- Update current progress (sum of current week)
        UPDATE user_goals 
        SET current_progress = (
            SELECT COALESCE(SUM(gp.progress_value), 0)
            FROM goal_progress gp
            WHERE gp.user_goal_id = goal_record.id
            AND gp.progress_date >= date_trunc('week', CURRENT_DATE)
            AND gp.progress_date < date_trunc('week', CURRENT_DATE) + interval '1 week'
        ),
        last_progress_update = now(),
        updated_at = now()
        WHERE id = goal_record.id;
    END LOOP;
    
    -- Similar logic for monthly goals would go here
    -- ... (abbreviated for brevity)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_goals_updated_at BEFORE UPDATE ON user_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goal_progress_updated_at BEFORE UPDATE ON goal_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_onboarding_updated_at BEFORE UPDATE ON user_onboarding
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 