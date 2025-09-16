'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function TestPasswordResetPage() {
  const [email, setEmail] = useState('');
  const [testUrl, setTestUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateTestResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/test/password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate test link');
      }

      setTestUrl(data.testResetUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Test Password Reset
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Generate test password reset links without sending emails
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg shadow-sm p-6 sm:p-8 space-y-6">
          <form onSubmit={generateTestResetLink} className="space-y-4">
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                Test Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-input bg-background rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                placeholder="Enter test email address"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Generating...' : 'Generate Test Reset Link'}
            </button>
          </form>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {testUrl && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md text-sm">
                <p className="font-medium">Test Reset Link Generated!</p>
                <p className="mt-1">
                  Click the link below to test the password reset flow:
                </p>
              </div>

              <div className="space-y-2">
                <Link
                  href={testUrl}
                  className="block w-full text-center px-4 py-3 border border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-md transition-colors"
                >
                  Test Password Reset Flow
                </Link>

                <div className="text-xs text-muted-foreground break-all">
                  <strong>Test URL:</strong> {testUrl}
                </div>
              </div>
            </div>
          )}

          <div className="text-center">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
