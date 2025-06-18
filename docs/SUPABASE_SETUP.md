# Supabase Authentication Setup Guide

## 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up/sign in and create a new project
3. Wait for the project to be fully initialized
4. Go to **Settings** → **API** in your Supabase dashboard

## 2. Configure Environment Variables

Create a `.env.local` file in your project root with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth (optional - for Google sign-in)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

**Where to find these values:**
- `NEXT_PUBLIC_SUPABASE_URL`: Your project URL from the API settings
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your "anon public" key from the API settings

## 3. Set Up Google OAuth (Optional)

### Step 1: Create Google OAuth App
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `https://your-supabase-project.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for development)

### Step 2: Configure Supabase
1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Enable "Google" provider
3. Enter your Google Client ID and Client Secret
4. Save the configuration

## 4. Authentication Configuration

### Email/Password Setup
- Email/password authentication is enabled by default
- Users will receive email confirmations
- You can customize email templates in **Authentication** → **Email Templates**

### URL Configuration
Make sure these URLs are configured in **Authentication** → **URL Configuration**:
- Site URL: `http://localhost:3000` (development) / `https://yourdomain.com` (production)
- Redirect URLs: Add your auth callback URLs

## 5. Test Your Setup

1. Start your development server: `npm run dev`
2. Visit `http://localhost:3000/auth/signup` to test signup
3. Visit `http://localhost:3000/auth/login` to test login
4. Check that protected routes redirect to login when not authenticated

## 6. Database Schema (Coming Next)

Once authentication is working, you'll want to create tables for:
- User profiles
- Training goals
- Activities (from Strava)
- Custom training data

## Troubleshooting

**Common Issues:**
1. **"Invalid API key"** - Check your environment variables
2. **Google OAuth not working** - Verify redirect URIs match exactly
3. **Email not sending** - Check spam folder, or configure SMTP in production
4. **Redirect loops** - Check your middleware configuration

**Next Steps:**
1. Test basic auth flow (email signup/login)
2. Test Google OAuth
3. Set up user profile management
4. Create initial dashboard with user data
5. Begin Strava integration planning 