# 🗺️ Mapbox Setup Guide

## Overview
This guide explains how to set up Mapbox for displaying interactive activity routes in your EnduroRevamp app.

## Prerequisites
- A Mapbox account (free tier available)
- Access to your project's environment variables

## Step 1: Create a Mapbox Account
1. Go to [Mapbox](https://www.mapbox.com/) and sign up for a free account
2. Verify your email address
3. Navigate to your account dashboard

## Step 2: Get Your Access Token
1. In your Mapbox dashboard, go to **Account** → **Access tokens**
2. Copy your **Default public token** (starts with `pk.`)
3. This token will be used for client-side map rendering

## Step 3: Add Token to Environment
Add the following to your `.env.local` file:

```bash
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_mapbox_token_here
```

## Step 4: Database Migration
Run the route data migration to add route fields to your activities table:

```sql
-- Run this SQL in your Supabase SQL editor
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS summary_polyline TEXT,
ADD COLUMN IF NOT EXISTS polyline TEXT,
ADD COLUMN IF NOT EXISTS start_latlng TEXT,
ADD COLUMN IF NOT EXISTS end_latlng TEXT,
ADD COLUMN IF NOT EXISTS map_id TEXT;
```

## Step 5: Sync Activities
After setting up the database, sync your activities to populate route data:

1. Go to your dashboard settings
2. Click "Sync Activities" to fetch route data from Strava
3. New activities will include route information

## Features
- **Interactive Route Display**: Zoom, pan, and explore your activity routes
- **Start/End Markers**: Green start point, red end point
- **Route Line**: Blue line showing your exact path
- **Responsive Design**: Works on desktop and mobile
- **Fallback Support**: Shows start/end points even without detailed route

## Usage
The route map automatically appears in activity detail modals when:
- Activity has route data from Strava
- Mapbox token is configured
- User clicks "View Details" on an activity card

## Troubleshooting

### Map Not Showing
- Check that `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` is set in `.env.local`
- Verify the token is valid in your Mapbox dashboard
- Ensure you've synced activities after adding route fields

### No Route Data
- Route data comes from Strava - ensure activities have GPS data
- Indoor activities typically don't have route data
- Some older activities may not have route information

### Performance Issues
- Mapbox free tier includes 50,000 map loads per month
- Consider upgrading if you exceed the limit
- Route data is cached to reduce API calls

## Cost
- **Free Tier**: 50,000 map loads/month (sufficient for development)
- **Paid Plans**: Start at $5/month for additional usage
- **Route Data**: Stored in your database, no additional cost

## Security
- The Mapbox token is public (client-side) and safe to expose
- Route data is stored in your database and respects user privacy
- No sensitive location data is sent to Mapbox 