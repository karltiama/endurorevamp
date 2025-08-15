'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(
    null
  );
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
      }
      // Don't set loading to false here as we're redirecting
    } catch {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordLoading(true);
    setForgotPasswordError(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send password reset email');
      }

      setForgotPasswordSuccess(true);
    } catch (err) {
      setForgotPasswordError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const resetForgotPassword = () => {
    setForgotPasswordEmail('');
    setForgotPasswordError(null);
    setForgotPasswordSuccess(false);
  };

  const goBackToLogin = () => {
    setShowForgotPassword(false);
    setForgotPasswordEmail('');
    setForgotPasswordError(null);
    setForgotPasswordSuccess(false);
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-sm sm:max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Forgot your password?
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your email address and we&apos;ll send you a link to reset
              your password
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg shadow-sm p-6 sm:p-8 space-y-6">
            {forgotPasswordSuccess ? (
              <>
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md text-sm">
                  <p>
                    We&apos;ve sent a password reset link to{' '}
                    <strong>{forgotPasswordEmail}</strong>. Please check your
                    email and click the link to reset your password.
                  </p>
                </div>

                <div className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Didn&apos;t receive the email? Check your spam folder or try
                    again.
                  </p>
                  <button
                    onClick={resetForgotPassword}
                    className="text-sm text-primary hover:text-primary/80 underline-offset-4 hover:underline transition-colors"
                  >
                    Try again
                  </button>
                </div>
              </>
            ) : (
              <>
                {forgotPasswordError && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
                    {forgotPasswordError}
                  </div>
                )}

                <form className="space-y-4" onSubmit={handleForgotPassword}>
                  <div className="space-y-1">
                    <label
                      htmlFor="forgot-email"
                      className="text-sm font-medium text-foreground"
                    >
                      Email address
                    </label>
                    <input
                      id="forgot-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={forgotPasswordEmail}
                      onChange={e => setForgotPasswordEmail(e.target.value)}
                      className="w-full px-3 py-2.5 border border-input bg-background rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                      placeholder="you@example.com"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={forgotPasswordLoading}
                    className="w-full flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {forgotPasswordLoading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      'Send reset link'
                    )}
                  </button>
                </form>
              </>
            )}

            <div className="text-center">
              <button
                onClick={goBackToLogin}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-sm sm:max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg shadow-sm p-6 sm:p-8 space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Google Sign In */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-md text-sm font-medium text-foreground bg-background hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground uppercase tracking-wider">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form className="space-y-4" onSubmit={handleEmailLogin}>
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-input bg-background rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-input bg-background rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                placeholder="Enter your password"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-primary hover:text-primary/80 underline-offset-4 hover:underline transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="text-center">
            <span className="text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <a
                href="/auth/signup"
                className="font-medium text-primary hover:text-primary/80 underline-offset-4 hover:underline transition-colors"
              >
                Sign up
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
