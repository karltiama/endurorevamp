'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useStravaAuth } from '@/hooks/use-strava-auth';
import { useQueryClient } from '@tanstack/react-query';
import { STRAVA_CONNECTION_QUERY_KEY } from '@/hooks/strava/useStravaConnection';
import { STRAVA_TOKEN_QUERY_KEY } from '@/hooks/strava/useStravaToken';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

/**
 * Silent OAuth handler for the main dashboard
 * Processes Strava OAuth callbacks without interfering with dashboard data loading
 */
export function StravaOAuthHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { mutate: exchangeToken, isPending: isAuthing } = useStravaAuth();
  const [authStatus, setAuthStatus] = useState<{
    status: 'idle' | 'processing' | 'success' | 'error';
    message?: string;
  }>({ status: 'idle' });

  const cleanUpUrl = useCallback(() => {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('code');
    newUrl.searchParams.delete('error');
    newUrl.searchParams.delete('error_description');
    newUrl.searchParams.delete('state');
    newUrl.searchParams.delete('scope');
    router.replace(newUrl.pathname + newUrl.search, { scroll: false });
  }, [router]);

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Only process if we have parameters and haven't processed yet
    if (!code && !error) return;
    if (authStatus.status !== 'idle') return;

    console.log('🔍 Dashboard OAuth handler triggered:', { code: !!code, error, errorDescription });

    // Handle OAuth errors from Strava
    if (error) {
      console.error('❌ OAuth error from Strava:', { error, errorDescription });
      setAuthStatus({
        status: 'error',
        message: errorDescription || (error === 'access_denied' ? 'Access denied by user' : 'Authorization failed')
      });
      
      // Clean up URL parameters
      cleanUpUrl();
      return;
    }

    // Handle successful OAuth code
    if (code && user && !isAuthing) {
      console.log('🔄 Processing OAuth code on dashboard...');
      setAuthStatus({ status: 'processing', message: 'Connecting to Strava...' });
      
      // Clean URL parameters immediately to prevent re-processing
      cleanUpUrl();
      
      exchangeToken(code, {
        onSuccess: async (data) => {
          console.log('✅ Successfully connected to Strava on dashboard:', data);
          setAuthStatus({ status: 'success', message: 'Successfully connected to Strava!' });
          
          // Update cache immediately
          queryClient.setQueryData(
            [STRAVA_CONNECTION_QUERY_KEY, user.id],
            {
              connected: true,
              athlete: data.athlete ? {
                id: data.athlete.id,
                firstname: data.athlete.firstname,
                lastname: data.athlete.lastname,
                profile: data.athlete.profile,
              } : undefined,
            }
          );
          
          // Invalidate queries to ensure fresh data
          await Promise.all([
            queryClient.invalidateQueries({ 
              queryKey: [STRAVA_CONNECTION_QUERY_KEY, user.id] 
            }),
            queryClient.invalidateQueries({ 
              queryKey: [STRAVA_TOKEN_QUERY_KEY, user.id] 
            })
          ]);
          
          // Clear success message after delay
          setTimeout(() => {
            setAuthStatus({ status: 'idle' });
          }, 5000);
        },
        onError: (error) => {
          console.error('❌ Failed to connect to Strava on dashboard:', error);
          
          let errorMessage = 'Failed to connect to Strava';
          if (error instanceof Error) {
            if (error.message.includes('401')) {
              errorMessage = 'Invalid authorization code. Please try connecting again.';
            } else if (error.message.includes('403')) {
              errorMessage = 'Access forbidden. Please check your Strava permissions.';
            } else if (error.message.includes('429')) {
              errorMessage = 'Too many requests. Please wait a moment and try again.';
            } else if (error.message.includes('500')) {
              errorMessage = 'Server error. Please try again later.';
            } else {
              errorMessage = error.message;
            }
          }
          
          setAuthStatus({ status: 'error', message: errorMessage });
          
          // Clear error after delay
          setTimeout(() => {
            setAuthStatus({ status: 'idle' });
          }, 10000);
        }
      });
    }
  }, [searchParams, user, isAuthing, authStatus.status, exchangeToken, queryClient, router, cleanUpUrl]);

  // Don't render anything if we're not processing
  if (authStatus.status === 'idle') return null;

  return (
    <div className="mb-4">
      {authStatus.status === 'processing' && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            {authStatus.message}
          </AlertDescription>
        </Alert>
      )}
      
      {authStatus.status === 'success' && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            {authStatus.message}
          </AlertDescription>
        </Alert>
      )}
      
      {authStatus.status === 'error' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Connection Error:</strong> {authStatus.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
} 