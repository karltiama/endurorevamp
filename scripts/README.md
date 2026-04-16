# Scripts Directory

This directory contains utility scripts and debug tools for development and maintenance.

## 📁 Directory Structure

```
scripts/
├── README.md                    # This file
├── setup-supabase.ps1          # PowerShell script for Supabase setup
├── test-sync-debug.js          # Node.js script to test Strava sync endpoints
└── debug/                      # Debug tools and utilities
    ├── debug-callback.html     # HTML debug tool for Strava OAuth callbacks
    └── debug-database-check.js # Browser console script for database debugging
```

## 🛠️ Scripts Overview

### `setup-supabase.ps1`

**Purpose**: PowerShell script to set up Supabase development environment
**Usage**: Run in PowerShell with appropriate permissions
**Dependencies**: Supabase CLI, Docker

### `test-sync-debug.js`

**Purpose**: Node.js script to test Strava sync API endpoints
**Usage**: `node scripts/test-sync-debug.js`
**Dependencies**: `node-fetch` package
**Note**: Requires Next.js dev server to be running on localhost:3000

### `normalize-strava-expires-at.js`

**Purpose**: One-time data safety script to detect and normalize legacy numeric `expires_at` values in `strava_tokens` to ISO timestamps.
**Usage (dry run)**: `node scripts/normalize-strava-expires-at.js`
**Usage (apply writes)**: `node scripts/normalize-strava-expires-at.js --apply`
**Dependencies**: `@supabase/supabase-js`
**Environment variables**:

- `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY`

**Safety**: Defaults to dry run and prints planned updates before any write.

### `debug/debug-callback.html`

**Purpose**: HTML debug tool for testing Strava OAuth callback scenarios
**Usage**: Open in browser to test various OAuth flows
**Features**:

- Success scenario testing
- Error scenario testing
- OAuth flow validation

### `debug/debug-database-check.js`

**Purpose**: Browser console script for debugging database state and sync issues
**Usage**: Copy and paste into browser console on dashboard page
**Features**:

- Database activity verification
- Sync status checking
- React Query cache inspection
- Force sync testing

## 🚀 Quick Start

1. **Test Sync Endpoints**:

   ```bash
   node scripts/test-sync-debug.js
   ```

2. **Check/Normalize Legacy Strava Expiry Data**:

   ```bash
   node scripts/normalize-strava-expires-at.js
   node scripts/normalize-strava-expires-at.js --apply
   ```

3. **Debug OAuth Flow**:
   - Open `scripts/debug/debug-callback.html` in browser
   - Ensure Next.js dev server is running

4. **Debug Database Issues**:
   - Go to `/dashboard` in your app
   - Open browser console
   - Copy and paste content from `scripts/debug/debug-database-check.js`

## 📝 Development Notes

- All debug scripts are for development/testing only
- These scripts should not be deployed to production
- Update scripts when API endpoints or data structures change
- Consider adding new debug tools for common development tasks

## 🔧 Adding New Scripts

When adding new scripts:

1. **Place in appropriate subdirectory**:
   - General utilities → `scripts/`
   - Debug tools → `scripts/debug/`
   - Build tools → `scripts/build/`

2. **Update this README** with:
   - Purpose and usage
   - Dependencies
   - Example commands

3. **Follow naming conventions**:
   - Use descriptive names
   - Include file extensions
   - Use kebab-case for multi-word names
