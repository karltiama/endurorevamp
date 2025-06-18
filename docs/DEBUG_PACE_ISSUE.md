# Debug: Pace String Issue

## Problem
Error: `"invalid input syntax for type numeric: \"07:04 /km\""`

This indicates that a pace string is being passed to a numeric database field.

## Why This Happens With New Activities Only

1. **Strava API Changes**: Newer activities might include additional fields
2. **Different Activity Types**: Some activity types return pace data
3. **API Response Evolution**: Strava may have added pace fields to newer activities

## Investigation Steps

### Step 1: Check Logs
Look in the browser console when running the sync for these log messages:

```
🔍 Raw activity data from Strava: { ... }
⚠️ Found pace string in field 'field_name': "07:04 /km"
🔍 Processed activity data for database: { ... }
❌ ERROR: Pace string found in processed data field 'field_name': "07:04 /km"
```

### Step 2: Identify the Field
The logs will tell you which field contains the pace string. Common suspects:
- `average_pace` (if Strava started returning this directly)
- `best_efforts` fields
- Custom pace fields in newer API versions

### Step 3: Fix the Field Mapping
Once identified, ensure that field is either:
1. Properly converted using `safeNumber()` 
2. Excluded from the database mapping
3. Mapped to the correct computed field

## Quick Fix Applied
The updated sync code now:
1. ✅ Logs all incoming data to identify pace strings
2. ✅ Converts pace strings to seconds per km
3. ✅ Filters out any remaining pace strings before database insert
4. ✅ Provides detailed error logging

## Next Steps
1. Run the sync and check the console logs
2. Identify which field contains "07:04 /km"
3. Update the field mapping accordingly 