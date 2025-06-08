-- Migration to add Strava OAuth tokens table
-- This stores encrypted tokens for each user

-- Strava OAuth tokens table
CREATE TABLE public.strava_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- OAuth tokens (these should be encrypted in production)
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type VARCHAR(50) DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ NOT NULL,
  expires_in INTEGER NOT NULL,
  
  -- Strava athlete info from token exchange
  strava_athlete_id BIGINT NOT NULL,
  athlete_firstname VARCHAR(100),
  athlete_lastname VARCHAR(100),
  athlete_profile TEXT,
  
  -- Scopes granted
  scope TEXT, -- e.g., "read,activity:read_all"
  
  -- Tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient lookups
CREATE INDEX idx_strava_tokens_user_id ON public.strava_tokens(user_id);
CREATE INDEX idx_strava_tokens_strava_athlete_id ON public.strava_tokens(strava_athlete_id);
CREATE INDEX idx_strava_tokens_expires_at ON public.strava_tokens(expires_at);

-- Row Level Security (RLS)
ALTER TABLE public.strava_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own tokens
CREATE POLICY "Users can access own strava tokens" ON public.strava_tokens
  FOR ALL USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_strava_tokens_updated_at 
  BEFORE UPDATE ON public.strava_tokens 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 