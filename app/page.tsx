import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Activity,
  BarChart3,
  Target,
  TrendingUp,
  Zap,
  Shield,
  Smartphone,
  ChevronRight,
  Menu,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AnimatedStats from '@/components/AnimatedStats';
import EnhancedFeaturesSection from '@/components/EnhancedFeaturesSection';

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is already logged in, redirect to dashboard
  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-indigo-600" />
              <span className="text-2xl font-bold text-gray-900">
                Enduro Stats
              </span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                href="#features"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                How it works
              </Link>
              <Link
                href="#faq"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                FAQ
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
            </nav>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Start with blue/indigo */}
      <section className="relative bg-gradient-to-b from-blue-50 via-indigo-100 to-indigo-50">
        {/* Hero Content */}
        <div className="py-12 sm:py-16 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-5 gap-8 lg:gap-16 items-center">
              <div className="space-y-8 lg:col-span-3">
                <div className="space-y-4">
                  <Badge
                    variant="secondary"
                    className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100"
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    Powered by Strava Data
                  </Badge>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight text-center">
                    Strava-powered training analytics{' '}
                    <span className="text-indigo-600">you can trust</span>
                  </h1>
                  <p className="text-lg sm:text-xl text-gray-600 leading-relaxed text-center">
                    Connect Strava, sync your activities, and explore training
                    load, goals, onboarding, and weather-aware workout planning
                    — built from your own data.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/auth/signup" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold"
                    >
                      <Activity className="mr-2 h-4 sm:h-5 w-4 sm:w-5" />
                      Get Started
                    </Button>
                  </Link>
                  <Link href="/auth/login" className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg bg-transparent"
                    >
                      Sign In
                      <ChevronRight className="ml-2 h-4 sm:h-5 w-4 sm:w-5" />
                    </Button>
                  </Link>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-sm text-gray-500 justify-center">
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 mr-1" />
                    Secure OAuth
                  </div>
                  <div className="flex items-center">
                    <Smartphone className="h-4 w-4 mr-1" />
                    Mobile Friendly
                  </div>
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 mr-1" />
                    Read-only Strava access
                  </div>
                </div>
              </div>

              <div className="relative flex justify-center lg:col-span-2">
                <div className="bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-2xl p-6 lg:p-8 shadow-xl relative">
                  <Image
                    src="/images/hero/runner-illustration.svg"
                    alt="Enduro Stats Dashboard"
                    width={700}
                    height={700}
                    className="rounded-lg shadow-2xl w-full h-auto"
                    priority
                  />
                  <AnimatedStats />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* More than Miles Section - blends from hero to features */}
        <section className="bg-gradient-to-b from-indigo-50 via-white to-indigo-50">
          <div className="py-12 sm:py-16 lg:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                <div className="relative">
                  <div className="w-full">
                    {/* Dashboard Screenshot - Full Outer Container */}
                    <Image
                      src="/images/dashboard-screenshot.png"
                      alt="Enduro Stats Dashboard showing training analytics, metrics, and insights"
                      width={1200}
                      height={900}
                      className="w-full h-auto rounded-2xl shadow-xl"
                      priority
                    />
                  </div>

                  {/* Floating Elements */}
                  <div className="absolute -top-4 -right-4 bg-white rounded-lg shadow-lg p-3 border">
                    <span className="text-sm font-medium text-gray-700">
                      Example dashboard
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center">
                    Your Strava data,{' '}
                    <span className="text-indigo-600">
                      organized for training decisions
                    </span>
                  </h2>
                  <p className="text-xl text-gray-600 leading-relaxed text-center">
                    Enduro Stats adds dashboards for load, trends, goals, and
                    planning on top of the activities you already record in
                    Strava — without posting or changing anything on your behalf.
                  </p>
                  <div className="space-y-4 text-center">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-gray-700">
                        Advanced training load analysis
                      </span>
                    </div>
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-gray-700">
                        Performance trend visualization
                      </span>
                    </div>
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Target className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="text-gray-700">
                        Goals, onboarding, and weather-aware planning
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Features Section */}
        <EnhancedFeaturesSection />
      </section>

      {/* How It Works and CTA Section - Transition from white to blue */}
      <section className="relative bg-gradient-to-b from-white via-blue-50 to-blue-100">
        {/* How It Works */}
        <div id="how-it-works" className="py-12 sm:py-16 lg:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                How It Works
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Three steps from your Strava account to a clear picture of your
                training.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 mx-auto bg-indigo-100 rounded-full flex items-center justify-center">
                  <Shield className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  1. Connect Strava
                </h3>
                <p className="text-gray-600">
                  Sign in and authorize read-only access through Strava&apos;s
                  secure OAuth. We never post or change anything on your account.
                </p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  2. Sync your activities
                </h3>
                <p className="text-gray-600">
                  Complete onboarding, connect Strava, and set up your training
                  profile. Activities sync automatically so your dashboard stays
                  current.
                </p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-12 h-12 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  3. See your insights
                </h3>
                <p className="text-gray-600">
                  Explore training load, trends, goals, workout planning, and
                  weather context — all computed from your synced Strava data.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Banner Content - seamlessly integrated */}
        <div className="py-12 sm:py-14 lg:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="mb-6">
                <div className="inline-flex items-center bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                  <Zap className="w-4 h-4 mr-2" />
                  Understand your training
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                  Ready to Make Sense of Your Strava Data?
                </h2>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                  Connect your Strava account and discover what your running data
                  reveals about your training load, trends, and progress.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
                <Link href="/auth/signup" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-indigo-600 text-white hover:bg-indigo-700 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
                  >
                    <Activity className="mr-2 h-4 sm:h-5 w-4 sm:w-5" />
                    Get Started
                  </Button>
                </Link>
                <Link href="#features" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  >
                    See All Features
                    <ChevronRight className="ml-2 h-4 sm:h-5 w-4 sm:w-5" />
                  </Button>
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 text-green-500 mr-1" />
                  <span>Secure &amp; private</span>
                </div>
                <div className="flex items-center">
                  <Activity className="h-4 w-4 text-blue-500 mr-1" />
                  <span>Read-only Strava integration</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section - Final transition from blue to light gray */}
      <section
        id="faq"
        className="py-20 bg-gradient-to-b from-blue-100 via-blue-50 to-gray-50"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-gray-600">
                Everything you need to know about Enduro Stats
              </p>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem
                value="item-1"
                className="bg-white rounded-lg border-0 shadow-sm"
              >
                <AccordionTrigger className="px-6 py-4 text-left font-semibold hover:no-underline">
                  How does Enduro Stats connect to my Strava account?
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-gray-600">
                  We use Strava&apos;s secure OAuth system to connect to your
                  account. You&apos;ll be redirected to Strava to authorize
                  access, and we only read your activity data - we never post or
                  modify anything on your behalf.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-2"
                className="bg-white rounded-lg border-0 shadow-sm"
              >
                <AccordionTrigger className="px-6 py-4 text-left font-semibold hover:no-underline">
                  What data do you analyze from my runs?
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-gray-600">
                  We analyze distance, pace, elevation, moving time, heart rate
                  and power when Strava provides them, plus derived metrics like
                  training load and goal progress. All analysis stays private to
                  your account.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-3"
                className="bg-white rounded-lg border-0 shadow-sm"
              >
                <AccordionTrigger className="px-6 py-4 text-left font-semibold hover:no-underline">
                  Do I need a Strava account?
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-gray-600">
                  Yes. Enduro Stats builds your dashboard from your Strava
                  activity history, so you&apos;ll connect your existing Strava
                  account to get started.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-4"
                className="bg-white rounded-lg border-0 shadow-sm"
              >
                <AccordionTrigger className="px-6 py-4 text-left font-semibold hover:no-underline">
                  Can I use Enduro Stats on my phone?
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-gray-600">
                  Our web app is fully responsive and optimized for mobile
                  devices. You can access all your insights and dashboards from
                  any smartphone or tablet.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-5"
                className="bg-white rounded-lg border-0 shadow-sm"
              >
                <AccordionTrigger className="px-6 py-4 text-left font-semibold hover:no-underline">
                  What metrics does Enduro Stats calculate?
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-gray-600">
                  Enduro Stats computes training load (TSS-style), heart rate and
                  power zone analysis where data exists, weekly distance and
                  consistency trends, personal bests, goal progress, and
                  rule-based workout recommendations with optional weather
                  context.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem
                value="item-6"
                className="bg-white rounded-lg border-0 shadow-sm"
              >
                <AccordionTrigger className="px-6 py-4 text-left font-semibold hover:no-underline">
                  Is AI coaching available?
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-gray-600">
                  Not yet. An AI Weekly Training Debrief is planned for a future
                  release. Today&apos;s app uses rule-based analytics and
                  workout planning from your synced Strava data.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>
    </div>
  );
}
