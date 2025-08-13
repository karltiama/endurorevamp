# 🔐 Supabase Security Fixes Guide

## Overview

This guide addresses the RLS (Row Level Security) and function security issues that Supabase was warning you about. The fixes ensure your database is secure and follows best practices for multi-user applications.

## 🚨 Security Issues Identified

### 1. **Function Search Path Mutable Vulnerabilities**

- **Issue**: SQL functions without `SECURITY DEFINER` and fixed `search_path`
- **Risk**: Potential for search path manipulation attacks
- **Functions Affected**: `update_updated_at_column`, `calculate_weekly_metrics`, `calculate_pace_from_speed`, `extract_time_components`

### 2. **Incomplete RLS Policies**

- **Issue**: Some tables had RLS enabled but missing comprehensive policies
- **Risk**: Data access control gaps
- **Tables Affected**: All main tables needed policy updates

### 3. **Table Accessibility Issues**

- **Issue**: Some tables existed but weren't accessible due to RLS configuration
- **Risk**: Application functionality breaks
- **Tables Affected**: `athlete_profiles`, `sync_state`, goal-related tables

## 🛠️ How to Apply the Fixes

### Step 1: Run the Security Fix Script

1. **Open your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Create a new query**
4. **Copy and paste the contents of `sql/fix-security-issues.sql`**
5. **Execute the script**

```sql
-- The script will:
-- ✅ Fix all function security vulnerabilities
-- ✅ Update all RLS policies
-- ✅ Create any missing tables
-- ✅ Add proper indexes
-- ✅ Verify the fixes worked
```

### Step 2: Verify the Fixes

1. **Run the verification script**
2. **Copy and paste the contents of `sql/test-security-fixes.sql`**
3. **Execute and review results**

Expected output:

```
✅ SECURED - All functions should show as secured
✅ RLS_ENABLED - All tables should have RLS enabled
✅ Policy counts should be 4+ per table (select/insert/update/delete)
```

## 🔍 What Each Fix Does

### Function Security Fixes

**Before:**

```sql
-- Vulnerable function
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**After:**

```sql
-- Secured function
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER          -- ✅ Run with definer's privileges
SET search_path = public   -- ✅ Fix search path
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;
```

### RLS Policy Updates

**Before:**

```sql
-- Generic policy
CREATE POLICY "Users can access own data" ON activities
    FOR ALL USING (auth.uid() = user_id);
```

**After:**

```sql
-- Specific policies for each operation
CREATE POLICY "activities_select_policy" ON activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "activities_insert_policy" ON activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "activities_update_policy" ON activities
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "activities_delete_policy" ON activities
    FOR DELETE USING (auth.uid() = user_id);
```

## 📋 Security Checklist

After applying the fixes, verify:

- [ ] **All functions show as "SECURED"** in the verification script
- [ ] **All tables show as "RLS_ENABLED"**
- [ ] **Each table has 4+ policies** (select/insert/update/delete)
- [ ] **No "REMAINING VULNERABILITIES"** in the test results
- [ ] **Your app still works** - test key functionality
- [ ] **Users can only see their own data** - test with multiple accounts

## 🔄 Ongoing Security Maintenance

### 1. **New Functions**

When creating new functions, always include:

```sql
CREATE FUNCTION your_function()
RETURNS ...
LANGUAGE plpgsql
SECURITY DEFINER          -- ✅ Always include
SET search_path = public   -- ✅ Always include
AS $$
-- Your function code
$$;
```

### 2. **New Tables**

When creating new tables, always:

```sql
-- Enable RLS
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Create all needed policies
CREATE POLICY "your_table_select_policy" ON your_table
    FOR SELECT USING (auth.uid() = user_id);
-- ... repeat for INSERT, UPDATE, DELETE
```

### 3. **Regular Security Audits**

- Run `sql/test-security-fixes.sql` monthly
- Check Supabase security warnings regularly
- Monitor for new security best practices

## 🚀 Performance Impact

These security fixes have **minimal performance impact**:

- **RLS policies**: Add microseconds to queries (worth it for security)
- **Function security**: No performance impact
- **Indexes**: Already optimized for your query patterns

## 🎯 What This Fixes in Your App

### Before the Fix:

- ⚠️ Supabase security warnings
- ⚠️ Some tables inaccessible
- ⚠️ Potential data leakage between users
- ⚠️ Function vulnerabilities

### After the Fix:

- ✅ No security warnings
- ✅ All tables accessible
- ✅ Users can only see their own data
- ✅ Functions secured against attacks
- ✅ Production-ready security

## 🔧 Troubleshooting

### Issue: "Function does not exist"

**Solution**: Some functions might not exist yet. The script uses `CREATE OR REPLACE` so it's safe to run.

### Issue: "Policy already exists"

**Solution**: The script drops existing policies first, then recreates them.

### Issue: "Table does not exist"

**Solution**: The script creates missing tables with `IF NOT EXISTS`.

### Issue: App stops working after fixes

**Solution**:

1. Check your authentication is working
2. Verify `auth.uid()` is not null in your app
3. Run the verification script to see what's wrong

## 📞 Support

If you encounter issues:

1. **Check the verification script results**
2. **Look for error messages in Supabase logs**
3. **Verify your authentication is working**
4. **Test with a simple query first**

## 🎉 Success!

After applying these fixes, your Supabase database will be:

- **Secure** - No more security warnings
- **Performant** - Optimized for your app
- **Maintainable** - Clear policies and documentation
- **Production-ready** - Enterprise-grade security

Your Next.js app with Strava integration is now ready for production with proper security measures in place!
