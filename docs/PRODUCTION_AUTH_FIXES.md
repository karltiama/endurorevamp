# 🚨 Production-Only Authentication Issues - Complete Fix Guide

## 🎯 **Problem Identified**

Your automatic logout issues **only occur in production** (`endurostats.vercel.app`) and not in development. This indicates **environment-specific configuration problems** rather than code issues.

## 🔍 **Root Causes (Production-Specific)**

### **1. Missing Environment Variables in Vercel**
The most common cause of production-only auth issues.

**Check in Vercel Dashboard:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `endurostats` project
3. Go to **Settings** → **Environment Variables**
4. Verify these are set:

```env
# Required for authentication
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Required for Strava OAuth
NEXT_PUBLIC_STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret

# Optional but recommended
NEXT_PUBLIC_STRAVA_REDIRECT_URI=https://endurostats.vercel.app/dashboard
```

### **2. Incorrect Supabase Configuration**
Production Supabase settings might differ from development.

**Check in Supabase Dashboard:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. Verify these URLs:

```
Site URL: https://endurostats.vercel.app
Redirect URLs: 
- https://endurostats.vercel.app/auth/callback
- https://endurostats.vercel.app/dashboard
```

### **3. Cookie Domain/Path Issues**
Production cookies might not be set correctly.

**Check in Browser DevTools:**
1. Open your live site
2. Go to **Application** → **Cookies**
3. Look for cookies starting with `sb-` (Supabase)
4. Verify domain is `endurostats.vercel.app`

### **4. HTTPS vs HTTP Protocol Mismatches**
Mixed content can break authentication.

**Check:**
- All URLs use `https://`
- No mixed HTTP/HTTPS content
- Supabase project uses HTTPS

## ✅ **Step-by-Step Fixes**

### **Step 1: Verify Vercel Environment Variables**

```bash
# In Vercel Dashboard, ensure these are set:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret
NEXT_PUBLIC_STRAVA_REDIRECT_URI=https://endurostats.vercel.app/dashboard
```

**Important:** After adding/updating environment variables, **redeploy your application**.

### **Step 2: Update Supabase URL Configuration**

In your Supabase project dashboard:

```
Site URL: https://endurostats.vercel.app
Redirect URLs:
- https://endurostats.vercel.app/auth/callback
- https://endurostats.vercel.app/dashboard
```

### **Step 3: Verify Strava App Configuration**

In [Strava API Settings](https://www.strava.com/settings/api):

```
Authorization Callback Domain: endurostats.vercel.app
Authorization Callback URL: https://endurostats.vercel.app/dashboard
```

### **Step 4: Add Production Debugging**

Add this component to your dashboard to debug production issues:

```tsx
// In your dashboard page
import { ProductionDebugger } from '@/components/ProductionDebugger'

// Add this somewhere in your dashboard
{process.env.NODE_ENV === 'production' && <ProductionDebugger />}
```

### **Step 5: Check Browser Console in Production**

1. Open your live site
2. Open DevTools (F12)
3. Go to **Console** tab
4. Look for authentication errors
5. Check **Network** tab for failed requests

## 🧪 **Testing Production Fixes**

### **Test 1: Environment Variable Check**
```bash
# In your production site console, run:
console.log('Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  hasStravaId: !!process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID
})
```

### **Test 2: Authentication Flow Test**
1. Clear all cookies and storage
2. Try to login
3. Check console for errors
4. Verify cookies are set correctly

### **Test 3: Strava Connection Test**
1. Try connecting to Strava
2. Check if OAuth redirect works
3. Verify tokens are stored

## 🔧 **Advanced Debugging**

### **Add Production Logging**

Update your `AuthProvider.tsx` to log more in production:

```typescript
// In your auth state change handler
console.log('🔐 Production auth state change:', {
  event,
  hasUser: !!session?.user,
  userId: session?.user?.id?.slice(0, 8) + '...',
  timestamp: new Date().toISOString(),
  url: window.location.href
})
```

### **Check Vercel Function Logs**

1. Go to Vercel Dashboard
2. Select your project
3. Go to **Functions** tab
4. Check for authentication-related errors

### **Verify Build Output**

```bash
# Build locally to check for issues
npm run build

# Check for environment variable warnings
# Look for "Environment variable X is not set" messages
```

## 🚨 **Common Production-Specific Issues**

### **Issue 1: Environment Variables Not Loading**
**Symptoms:** `undefined` values in production
**Fix:** Redeploy after setting environment variables

### **Issue 2: Cookie Domain Mismatch**
**Symptoms:** Authentication state not persisting
**Fix:** Check Supabase URL configuration

### **Issue 3: CORS Errors**
**Symptoms:** API calls failing in production
**Fix:** Verify Supabase CORS settings

### **Issue 4: Mixed Content**
**Symptoms:** HTTPS warnings, auth breaking
**Fix:** Ensure all URLs use HTTPS

## 📋 **Checklist for Production Deployment**

- [ ] Environment variables set in Vercel
- [ ] Supabase URL configuration updated
- [ ] Strava callback URLs correct
- [ ] Application redeployed after changes
- [ ] HTTPS used consistently
- [ ] Browser console checked for errors
- [ ] Authentication flow tested
- [ ] Cookies verified in production

## 🎯 **Quick Fix Commands**

```bash
# 1. Check current environment variables
vercel env ls

# 2. Add missing environment variable
vercel env add NEXT_PUBLIC_SUPABASE_URL

# 3. Redeploy with new environment variables
vercel --prod

# 4. Check function logs
vercel logs
```

## 🔍 **Monitoring Production**

### **Add Error Tracking**
Consider adding Sentry or similar for production error monitoring:

```bash
npm install @sentry/nextjs
```

### **Health Check Endpoint**
Create a simple health check to verify authentication:

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasSupabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL
  })
}
```

## 🚀 **Next Steps**

1. **Check Vercel environment variables** (most likely cause)
2. **Update Supabase URL configuration**
3. **Redeploy your application**
4. **Test authentication flow**
5. **Monitor browser console for errors**
6. **Use ProductionDebugger component**

The fixes we implemented earlier will help, but these production-specific issues need to be resolved in your deployment environment! 🎉
