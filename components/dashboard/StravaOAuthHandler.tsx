'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useQueryClient } from '@tanstack/react-query';
import { STRAVA_CONNECTION_QUERY_KEY } from '@/hooks/strava/useStravaConnection';
import { STRAVA_TOKEN_QUERY_KEY } from '@/hooks/strava/useStravaToken';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export function StravaOAuthHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [authStatus, setAuthStatus] = useState<{
    status: 'idle' | 'processing' | 'success' | 'error';
    message?: string;
  }>({ status: 'idle' });

  const processedStatusRef = useRef<string | null>(null);
  const isProcessingRef = useRef(false);
  const hasValidatedTokenRef = useRef(false);

  useEffect(() => {
    if (!user || hasValidatedTokenRef.current) return;

    hasValidatedTokenRef.current = true;

    fetch('/api/auth/strava/token')
      .then(res => res.json())
      .catch(err => {
        console.warn('Token validation failed (non-blocking):', err);
      });
  }, [user]);

  const cleanUpUrl = useCallback(() => {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('strava');
    newUrl.searchParams.delete('reason');
    router.replace(newUrl.pathname + newUrl.search, { scroll: false });
  }, [router]);

  useEffect(() => {
    const stravaStatus = searchParams.get('strava');
    const reason = searchParams.get('reason');

    if (!stravaStatus) return;
    if (authStatus.status !== 'idle') return;

    if (processedStatusRef.current === `${stravaStatus}:${reason ?? ''}`) return;
    if (isProcessingRef.current) return;

    isProcessingRef.current = true;
    processedStatusRef.current = `${stravaStatus}:${reason ?? ''}`;

    if (stravaStatus === 'error') {
      setAuthStatus({
        status: 'error',
        message: reason ? `Authorization failed: ${reason}` : 'Authorization failed',
      });
      cleanUpUrl();
      setTimeout(() => {
        setAuthStatus({ status: 'idle' });
        isProcessingRef.current = false;
      }, 10000);
      return;
    }

    if (stravaStatus === 'connected' && user) {
      setAuthStatus({
        status: 'processing',
        message: 'Connected! Finalizing your dashboard...',
      });
      cleanUpUrl();

      (async () => {
        try {
          try {
            await fetch('/api/onboarding', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                strava_connected: true,
                current_step: 'complete',
              }),
            });
          } catch (error) {
            console.warn('Failed to update onboarding status:', error);
          }

          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: [STRAVA_CONNECTION_QUERY_KEY, user.id],
            }),
            queryClient.invalidateQueries({
              queryKey: [STRAVA_TOKEN_QUERY_KEY, user.id],
            }),
          ]);

          setAuthStatus({
            status: 'processing',
            message: 'Connected! Syncing your activities...',
          });

          try {
            const syncResponse = await fetch('/api/strava/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ syncType: 'quick' }),
            });

            if (syncResponse.ok) {
              const syncResult = await syncResponse.json();
              const newCount = syncResult.data?.newActivities || 0;
              setAuthStatus({
                status: 'success',
                message:
                  newCount > 0
                    ? `Connected! Synced ${newCount} activities.`
                    : 'Connected! Your activities are up to date.',
              });

              await queryClient.invalidateQueries({ queryKey: ['activities'] });
              await queryClient.invalidateQueries({
                queryKey: ['strava-sync'],
              });
            } else {
              setAuthStatus({
                status: 'success',
                message:
                  'Connected to Strava! You can sync activities from Settings.',
              });
            }
          } catch (_syncError) {
            setAuthStatus({
              status: 'success',
              message:
                'Connected to Strava! You can sync activities from Settings.',
            });
          }

          const fromOnboardingDemo = sessionStorage.getItem(
            'from_onboarding_demo'
          );
          if (fromOnboardingDemo === 'true') {
            sessionStorage.removeItem('from_onboarding_demo');
            router.push('/onboarding-demo?from_strava=true');
            return;
          }

          setTimeout(() => {
            setAuthStatus({ status: 'idle' });
            isProcessingRef.current = false;
          }, 5000);
        } catch (_error) {
          setAuthStatus({
            status: 'error',
            message: 'Failed to finalize Strava connection',
          });
          setTimeout(() => {
            setAuthStatus({ status: 'idle' });
            isProcessingRef.current = false;
          }, 10000);
        }
      })();
    }
  }, [searchParams, user, authStatus.status, queryClient, router, cleanUpUrl]);

  if (authStatus.status === 'idle') return null;

  return (
    <div className="mb-4">
      {authStatus.status === 'processing' && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>{authStatus.message}</AlertDescription>
        </Alert>
      )}

      {authStatus.status === 'success' && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{authStatus.message}</AlertDescription>
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
