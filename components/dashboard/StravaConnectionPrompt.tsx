'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Zap, TrendingUp, ArrowRight } from 'lucide-react';
import { getStravaAuthUrl } from '@/lib/strava';

interface StravaConnectionPromptProps {
  variant?: 'full' | 'compact';
}

export function StravaConnectionPrompt({ 
  variant = 'full' 
}: StravaConnectionPromptProps) {
  const handleConnect = () => {
    const stravaUrl = getStravaAuthUrl();
    if (stravaUrl && stravaUrl !== '#') {
      window.location.href = stravaUrl;
    } else {
      console.error('Failed to generate Strava OAuth URL');
    }
  };

  if (variant === 'compact') {
    return (
      <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-lg p-6">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
              <Activity className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">
              Connect Strava to Get Started
            </h3>
            <p className="text-sm text-gray-600">
              Sync your activities to unlock personalized training insights
            </p>
          </div>
          <Button 
            onClick={handleConnect}
            className="bg-orange-600 hover:bg-orange-700 text-white flex-shrink-0"
          >
            Connect Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-2 border-orange-200">
      <CardContent className="p-8">
        <div className="text-center max-w-2xl mx-auto">
          {/* Hero Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full mb-6">
            <Activity className="h-10 w-10 text-white" />
          </div>

          {/* Headline */}
          <h2 className="text-3xl font-bold mb-3">
            Ready to Start Your Training Journey?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Connect your Strava account to unlock personalized insights, training
            recommendations, and progress tracking.
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-3">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Automatic Sync</h3>
              <p className="text-sm text-gray-600">
                Activities sync automatically from Strava
              </p>
            </div>

            <div className="flex flex-col items-center p-4 bg-green-50 rounded-lg">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-3">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Training Insights</h3>
              <p className="text-sm text-gray-600">
                Get personalized readiness and load metrics
              </p>
            </div>

            <div className="flex flex-col items-center p-4 bg-purple-50 rounded-lg">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mb-3">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Progress Tracking</h3>
              <p className="text-sm text-gray-600">
                Track goals and monitor your improvement
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleConnect}
            size="lg"
            className="bg-orange-600 hover:bg-orange-700 text-white text-lg px-8 py-6 h-auto"
          >
            <Activity className="mr-2 h-5 w-5" />
            Connect Strava Account
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          {/* Privacy Note */}
          <p className="text-xs text-gray-500 mt-6">
            🔒 We only access your activity data. Your privacy is our priority.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
