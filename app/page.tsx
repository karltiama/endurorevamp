import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is already logged in, redirect to dashboard
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
          {/* Hero Section */}
          <div className="max-w-3xl space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block">Elevate Your</span>
                <span className="block text-indigo-600">Endurance Training</span>
              </h1>
              <p className="max-w-2xl mx-auto text-base text-gray-500 sm:text-lg md:text-xl">
                Transform your Strava data into actionable insights. Set smarter goals, track progress, and unlock your athletic potential with advanced training analytics.
              </p>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors md:py-4 md:text-lg md:px-10"
              >
                Get Started Free
              </Link>
              <Link
                href="/auth/login"
                className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 transition-colors md:py-4 md:text-lg md:px-10"
              >
                Sign In
              </Link>
            </div>

            <p className="text-sm text-gray-500">
              Connect your Strava account after signing up
            </p>
          </div>

          {/* Features Preview */}
          <div className="mt-20 w-full max-w-4xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mx-auto">
                  📊
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-900">Smart Analytics</h3>
                  <p className="text-base text-gray-500">
                    Get insights beyond basic Strava metrics
                  </p>
                </div>
              </div>
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mx-auto">
                  🎯
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-900">Goal Tracking</h3>
                  <p className="text-base text-gray-500">
                    Set and track meaningful training objectives
                  </p>
                </div>
              </div>
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mx-auto">
                  📈
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-900">Progress Insights</h3>
                  <p className="text-base text-gray-500">
                    Understand your training patterns and improvements
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
