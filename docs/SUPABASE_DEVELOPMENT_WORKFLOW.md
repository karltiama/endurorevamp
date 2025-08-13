# Supabase Development Workflow Guide

## Overview

This guide explains the proper way to develop with Supabase, moving from manual SQL execution to a version-controlled, professional development workflow.

## Current vs. Proper Workflow

### ❌ Current Manual Approach

- Writing SQL directly in Supabase dashboard
- No version control for schema changes
- No local development environment
- Hard to track changes
- Difficult to collaborate
- No rollback capability

### ✅ Proper Development Workflow

- Local development with Supabase CLI
- Version-controlled migrations
- Local database for development
- Proper deployment pipeline
- Easy rollbacks
- Team collaboration

## Setup Instructions

### 1. Install Supabase CLI

**Windows:**

```bash
# Option 1: Download from GitHub
# Visit: https://github.com/supabase/cli/releases
# Download supabase_windows_amd64.exe and add to PATH

# Option 2: Using Scoop (if installed)
scoop install supabase

# Option 3: Using Chocolatey (if installed)
choco install supabase
```

**macOS:**

```bash
brew install supabase/tap/supabase
```

**Linux:**

```bash
curl -fsSL https://supabase.com/install.sh | sh
```

### 2. Link to Your Supabase Project

```bash
# Get your project reference from Supabase dashboard
supabase link --project-ref YOUR_PROJECT_REF
```

### 3. Initialize Local Development

```bash
# Start local Supabase instance
supabase start

# This will:
# - Start local PostgreSQL database
# - Start local API server
# - Start local Studio (dashboard)
# - Start local Auth server
```

## Development Workflow

### 1. Local Development

```bash
# Start local environment
supabase start

# Your local URLs will be:
# - Database: postgresql://postgres:postgres@127.0.0.1:54322/postgres
# - API: http://127.0.0.1:54321
# - Studio: http://127.0.0.1:54323
# - Auth: http://127.0.0.1:54324
```

### 2. Creating Migrations

Instead of writing SQL manually in the dashboard:

```bash
# Create a new migration
supabase migration new create_users_table

# This creates: supabase/migrations/TIMESTAMP_create_users_table.sql
```

Edit the migration file:

```sql
-- supabase/migrations/TIMESTAMP_create_users_table.sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Applying Migrations

```bash
# Apply migrations to local database
supabase db reset

# Apply migrations to remote database
supabase db push
```

### 4. Database Schema Changes

**❌ Don't do this:**

- Manually create tables in Supabase dashboard
- Write SQL directly in the SQL editor

**✅ Do this instead:**

```bash
# 1. Create migration
supabase migration new add_user_profile

# 2. Edit migration file
# 3. Test locally
supabase db reset
# 4. Deploy to production
supabase db push
```

### 5. Seeding Data

```bash
# Create seed file
supabase db seed

# This creates: supabase/seed.sql
```

### 6. Database Diff

```bash
# Generate migration from schema changes
supabase db diff --schema public -f migration_name
```

## Environment Configuration

### Local Development

```bash
# Copy your remote schema to local
supabase db pull

# Start local services
supabase start
```

### Environment Variables

Update your `.env.local`:

```env
# For local development
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key

# For production
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
```

## Best Practices

### 1. Always Use Migrations

- Never make schema changes directly in production
- Always test migrations locally first
- Use descriptive migration names

### 2. Version Control

```bash
# Commit migrations with your code
git add supabase/migrations/
git commit -m "Add user profile table"
```

### 3. Testing

```bash
# Test migrations locally
supabase db reset

# Run your application tests
npm test
```

### 4. Deployment

```bash
# Deploy to production
supabase db push

# Or use GitHub Actions for automated deployment
```

## Common Commands

```bash
# Start local development
supabase start

# Stop local development
supabase stop

# View logs
supabase logs

# Create new migration
supabase migration new migration_name

# Apply migrations locally
supabase db reset

# Apply migrations to remote
supabase db push

# Pull remote schema
supabase db pull

# Generate diff
supabase db diff

# Seed database
supabase db seed
```

## Migration Examples

### Creating Tables

```sql
-- supabase/migrations/TIMESTAMP_create_activities.sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  strava_activity_id BIGINT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  distance DECIMAL(10,2),
  moving_time INTEGER,
  elapsed_time INTEGER,
  total_elevation_gain DECIMAL(8,2),
  activity_type TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_start_date ON activities(start_date);
```

### Adding Columns

```sql
-- supabase/migrations/TIMESTAMP_add_activity_notes.sql
ALTER TABLE activities
ADD COLUMN notes TEXT,
ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5);
```

### Creating Functions

```sql
-- supabase/migrations/TIMESTAMP_create_activity_stats_function.sql
CREATE OR REPLACE FUNCTION get_user_activity_stats(user_uuid UUID)
RETURNS TABLE (
  total_activities BIGINT,
  total_distance DECIMAL(10,2),
  total_time INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    COALESCE(SUM(distance), 0),
    COALESCE(SUM(moving_time), 0)
  FROM activities
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;
```

## Troubleshooting

### Common Issues

1. **Port conflicts:**

```bash
# Check what's using the ports
netstat -ano | findstr :54321
netstat -ano | findstr :54322
```

2. **Migration conflicts:**

```bash
# Reset local database
supabase db reset

# Pull latest schema
supabase db pull
```

3. **Environment variables:**

```bash
# Verify your .env.local has correct local URLs
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
```

## Next Steps

1. Install Supabase CLI
2. Link your project: `supabase link --project-ref YOUR_REF`
3. Start local development: `supabase start`
4. Create your first migration: `supabase migration new initial_schema`
5. Update your environment variables for local development
6. Test your application locally
7. Deploy changes: `supabase db push`

## Benefits of This Approach

- **Version Control**: All schema changes are tracked in Git
- **Local Development**: Test changes locally before production
- **Rollbacks**: Easy to revert schema changes
- **Collaboration**: Team members can see and apply schema changes
- **CI/CD**: Automated database deployments
- **Testing**: Test migrations before applying to production
- **Documentation**: Migration files serve as documentation
