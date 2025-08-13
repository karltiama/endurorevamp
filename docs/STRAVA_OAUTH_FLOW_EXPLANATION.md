# Strava OAuth Flow Explanation

## Overview

This document explains how the Strava OAuth integration works in your web app, breaking down the authentication flow step by step.

## The Dashboard Flow

### 1. Authentication Check

```typescript
const user = await requireAuth();
```

- Calls a server-side auth function that verifies the user is logged in
- Returns the user object from Supabase
- This runs on the server (no "use client" directive)

### 2. Layout Wrapper

```typescript
<DashboardLayout user={user}>
```

- Provides consistent layout structure (navigation, sidebar, etc.)
- Passes the authenticated user object down to child components
- All dashboard components receive `userId={user.id}` prop

## StravaOAuthHandler Component

### What It Does (NOT what it doesn't do)

**❌ NOT constantly listening** - Only triggers when OAuth parameters are present in URL

**✅ OAuth Callback Processor** - Handles the OAuth redirect response from Strava

### The OAuth Flow

#### 1. Initial Redirect (happens elsewhere)

- User clicks "Connect to Strava"
- Your app redirects to: `https://www.strava.com/oauth/authorize?client_id=YOUR_ID&redirect_uri=YOUR_CALLBACK_URL&response_type=code&scope=read,activity:read_all`
- The `redirect_uri` parameter tells Strava where to send the user back

#### 2. Strava Redirects Back

- Strava redirects user to your callback URL (e.g., `/dashboard?code=abc123`)
- This URL is configured in your Strava app settings

#### 3. StravaOAuthHandler Processes

- Detects the `code` parameter in the URL
- Exchanges the code for an access token
- Cleans up the URL

### URL Parameter Detection

```typescript
const code = searchParams.get('code');
const error = searchParams.get('error');
const errorDescription = searchParams.get('error_description');

// Only process if we have parameters and haven't processed yet
if (!code && !error) return;
if (authStatus.status !== 'idle') return;
```

### URL Cleanup

```typescript
const cleanUpUrl = useCallback(() => {
  const newUrl = new URL(window.location.href);
  newUrl.searchParams.delete('code');
  newUrl.searchParams.delete('error');
  newUrl.searchParams.delete('error_description');
  newUrl.searchParams.delete('state');
  newUrl.searchParams.delete('scope');
  router.replace(newUrl.pathname + newUrl.search, { scroll: false });
}, [router]);
```

## Where Callback URL is Set

### In Your Code (`lib/strava.ts`)

```typescript
export function getStravaAuthUrl(baseUrl?: string) {
  // Use provided base URL, environment variable, or default
  let redirectUri = process.env.NEXT_PUBLIC_STRAVA_REDIRECT_URI;
  if (!redirectUri && baseUrl) {
    redirectUri = `${baseUrl}/dashboard`; // ← This tells Strava where to redirect back
  } else if (!redirectUri) {
    // Fallback for development
    redirectUri = 'http://localhost:3000/dashboard'; // ← Default fallback
  }

  url.searchParams.set('redirect_uri', redirectUri);
  // ... other parameters
}
```

### Configuration Required

1. **Strava App Settings**: Set Authorization Callback URL to `/dashboard`
2. **Environment Variables**: `NEXT_PUBLIC_STRAVA_REDIRECT_URI=http://localhost:3000/dashboard`

## The Token Flow

### 1. Produces Access Token

```typescript
// Your API exchanges the code for tokens
const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
  method: 'POST',
  body: JSON.stringify({
    client_id: process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID,
    client_secret: process.env.STRAVA_CLIENT_SECRET,
    code, // ← The temporary code from Strava
    grant_type: 'authorization_code',
  }),
});

const authData = await tokenResponse.json();
// Returns: { access_token, refresh_token, expires_at, athlete: {...} }
```

### 2. Stores in Database

```typescript
await supabase.from('strava_tokens').upsert({
  user_id: user.id,
  access_token: authData.access_token, // ← The actual token
  refresh_token: authData.refresh_token, // ← For getting new tokens later
  expires_at: new Date(authData.expires_at * 1000).toISOString(), // ← When it expires
  expires_in: authData.expires_in,
  strava_athlete_id: authData.athlete.id,
  // ... other athlete data
});
```

### 3. Token Expires

- **Access tokens expire** (usually 6 hours for Strava)
- **Refresh tokens don't expire** (until user revokes access)
- **Your app automatically refreshes** expired tokens using the refresh token

## What the Token Enables

```typescript
// You can now make API calls on behalf of the user
const response = await fetch(
  'https://www.strava.com/api/v3/athlete/activities',
  {
    headers: {
      Authorization: `Bearer ${accessToken}`, // ← Use the stored token
    },
  }
);
```

## Token Lifecycle

1. **User authorizes** → You get access token (6 hours)
2. **Token expires** → Use refresh token to get new access token
3. **User revokes** → Refresh token stops working
4. **User reconnects** → Get new tokens

## Complete Flow Summary

1. **User clicks "Connect to Strava"** → Calls `getStravaAuthUrl()`
2. **Your app redirects to Strava** → `https://www.strava.com/oauth/authorize?client_id=YOUR_ID&redirect_uri=http://localhost:3000/dashboard&...`
3. **Strava redirects back** → `http://localhost:3000/dashboard?code=abc123`
4. **`StravaOAuthHandler` detects the code** → Processes the OAuth response
5. **Exchanges code for tokens** → Calls your API endpoint
6. **Stores tokens in database** → User is now connected

## Key Points

- **StravaOAuthHandler doesn't prompt Strava** - it just processes the callback
- **The redirect URI is set in your app** when you redirect TO Strava
- **Strava uses that URI** to send the user back with the authorization code
- **Your app must configure this URI** in both your code AND in Strava's developer portal
- **Access token is like a "permission slip"** that lets your app act as the user when calling Strava's API

## The Sequence

**Gather callback from Strava** → **Store tokens in database** → **Clean URL** → **Return success**

**Code** → **Access Token** → **Store in DB** → **Use to fetch user's Strava data on their behalf**
