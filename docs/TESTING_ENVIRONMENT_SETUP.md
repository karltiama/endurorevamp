# Testing Environment Setup Guide

## 🎯 Problem Solved: Environment Variables in Tests

Your tests now properly handle environment variables without committing sensitive data!

## 📁 File Structure

```
endurorevamp/
├── .env.local                    # ❌ Not committed (your real credentials)
├── .env.test.local              # ❌ Not committed (copy of .env.local for tests)
├── jest.config.js               # ✅ Configured for testing
├── jest.setup.js               # ✅ Loads environment variables
└── __tests__/
    └── database/
        ├── simple-schema-check.test.ts    # ✅ Simple validation
        └── schema-validation.test.ts      # ✅ Comprehensive validation
```

## 🔧 How It Works

### 1. Environment Variable Loading
```javascript
// jest.setup.js automatically loads .env.test.local
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.test.local' })
```

### 2. Graceful Fallbacks
```javascript
// Tests skip when no real credentials available
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.log('⚠️  Skipping - no database credentials')
  return
}
```

### 3. Real vs Mock Credentials
- **Real credentials**: `.env.test.local` → schema validation works
- **Mock credentials**: `jest.setup.js` → component tests work

## 🚀 How to Run Schema Validation

### **Option 1: Quick Check (Recommended)**
```bash
npm test __tests__/database/simple-schema-check.test.ts
```

### **Option 2: Comprehensive Check**
```bash
npm test __tests__/database/schema-validation.test.ts
```

### **Option 3: All Tests**
```bash
npm test  # Runs all tests (schema tests gracefully skip if no credentials)
```

## 🎮 Current Results

When you run the tests, you'll see:

### ✅ With Real Credentials (`.env.test.local` exists)
```
✅ Using real database for schema validation
✅ Table 'activities' accessible
✅ Table 'goal_types' accessible  
✅ Goal relationships work
✅ Dashboard feature ready
```

### ⚠️ Without Real Credentials (using mocks)
```
⚠️ No real database credentials - skipping all tests
Skipping - no database connection
Tests: 3 passed (all gracefully skipped)
```

## 🔐 Security Best Practices

### ✅ What's Protected
- `.env.local` ← Your real production credentials (never committed)
- `.env.test.local` ← Copy of real credentials for testing (never committed)
- `.gitignore` has `.env*` pattern ← Protects all .env files

### ✅ What's Safe
- `jest.setup.js` ← Mock credentials only (safe to commit)
- Test files ← No hardcoded credentials (safe to commit)

## 🛠️ Setup Instructions for New Developers

### 1. Clone the repo
```bash
git clone <your-repo>
cd endurorevamp
npm install
```

### 2. Get environment variables
Ask a team member for the `.env.local` file content, or set up your own Supabase project.

### 3. Create test environment
```bash
copy .env.local .env.test.local  # Windows
# OR
cp .env.local .env.test.local    # Mac/Linux
```

### 4. Run tests
```bash
npm test __tests__/database/simple-schema-check.test.ts
```

## 🚨 Troubleshooting

### Problem: "Cannot read properties of undefined (reading 'from')"
**Solution**: Your `.env.test.local` file is missing or doesn't have the right variables.

```bash
# Check if file exists
ls -la .env.test.local

# Create it from .env.local
copy .env.local .env.test.local
```

### Problem: "Using mock Supabase credentials"
**Solution**: This is normal when you don't have real credentials. Tests will pass but skip schema validation.

### Problem: Schema tests failing
**Solution**: Your database might not have the goal tables set up yet.

```sql
-- Run this in your Supabase SQL editor:
-- Check what tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

## 📊 What Each Test Validates

### `simple-schema-check.test.ts`
- ✅ All required tables exist and are accessible
- ✅ Goal relationships work (goal_types ← user_goals)
- ✅ Dashboard feature readiness (goal_data supports new fields)

### `schema-validation.test.ts` (Advanced)
- ✅ Foreign key relationships
- ✅ Data integrity constraints  
- ✅ Performance indexes
- ✅ Complete data flow validation

## 🎯 Next Steps

1. **For Development**: Use `simple-schema-check.test.ts` regularly
2. **For CI/CD**: Set up environment variables in GitHub Actions
3. **For Production**: Consider separate test database

## 💡 Pro Tips

### Run Schema Check Before Big Changes
```bash
npm test __tests__/database/simple-schema-check.test.ts
```

### Quick Health Check in Code
```typescript
import { quickSchemaCheck } from '__tests__/database/simple-schema-check.test'

// In your app (development only)
if (process.env.NODE_ENV === 'development') {
  await quickSchemaCheck()
}
```

### CI/CD Environment Variables
For GitHub Actions, add these secrets:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## ✅ Success Checklist

- [ ] `.env.test.local` file exists
- [ ] Tests run without errors
- [ ] Schema validation passes (if you have the goals tables)
- [ ] No sensitive data in git commits
- [ ] Team members can run tests after setup

Your testing environment is now production-ready! 🎉 