import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Activity,
  BarChart3,
  Target,
  TrendingUp,
  Zap,
  Shield,
  Smartphone,
  Award,
  ChevronRight,
  Star,
  Menu,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AnimatedStats from "@/components/AnimatedStats"
import AnimatedChart from "@/components/AnimatedChart"
import AnimatedMetrics from "@/components/AnimatedMetrics"
import AnimatedLevelUp from "@/components/AnimatedLevelUp"
import AnimatedTestimonials from "@/components/AnimatedTestimonials"

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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-indigo-600" />
              <span className="text-2xl font-bold text-gray-900">Enduro Stats</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
                Features
              </Link>
              <Link href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">
                Reviews
              </Link>
              <Link href="#faq" className="text-gray-600 hover:text-gray-900 transition-colors">
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

      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-5 gap-8 lg:gap-16 items-center">
            <div className="space-y-8 lg:col-span-3">
              <div className="space-y-4">
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100">
                  <Zap className="w-3 h-3 mr-1" />
                  Powered by Strava Data
                </Badge>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Go Beyond the Basics – <span className="text-indigo-600">Know Your Run</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Transform your Strava data into actionable insights. Track training load, analyze performance trends,
                  and achieve your running goals with personalized analytics.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup">
                  <Button
                    size="lg"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 text-lg font-semibold"
                  >
                    <Activity className="mr-2 h-5 w-5" />
                    Get Started For Free
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" size="lg" className="px-8 py-4 text-lg bg-transparent">
                    Sign In
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-500 justify-center">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-1" />
                  Secure OAuth
                </div>
                <div className="flex items-center">
                  <Smartphone className="h-4 w-4 mr-1" />
                  Mobile Friendly
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-1 fill-current text-yellow-400" />
                  4.9/5 Rating
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
      </section>

      {/* Value Proposition */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 shadow-xl border">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  {/* Dashboard Header */}
                  <div className="bg-indigo-600 text-white p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Training Analytics Dashboard</h3>
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Dashboard Content */}
                  <div className="p-6 space-y-6">
                    {/* Key Metrics Row */}
                    <AnimatedMetrics />
                    
                    {/* Chart Placeholder */}
                    <AnimatedChart />
                    
                    {/* Recent Activity */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Recent Activities</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <Activity className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">Morning Run</div>
                              <div className="text-sm text-gray-500">5.2 miles • 9:30/mile</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">+2.3%</div>
                            <div className="text-xs text-green-600">vs last week</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-white rounded-lg shadow-lg p-3 border">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">Live Data</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center">
                More than Miles. <span className="text-indigo-600">Real Performance Insights.</span>
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed text-center">
                While Strava shows you what happened, Enduro Stats shows you why it matters. Get the deep analytics and
                personalized insights that serious runners need to improve.
              </p>
              <div className="space-y-4 text-center">
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">Advanced training load analysis</span>
                </div>
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-gray-700">Performance trend visualization</span>
                </div>
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Target className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-gray-700">Smart goal tracking & insights</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <AnimatedLevelUp />
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed specifically for serious runners who want to optimize their training.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle className="text-xl">Training Load Analysis</CardTitle>
                <CardDescription className="text-gray-600">
                  Track your training stress and recovery with advanced load metrics and trend analysis.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Performance Trends</CardTitle>
                <CardDescription className="text-gray-600">
                  Visualize pace, heart rate, and cadence trends over weeks, months, and years.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-xl">VO2 Max Estimation</CardTitle>
                <CardDescription className="text-gray-600">
                  Get accurate fitness estimates and track your aerobic capacity improvements over time.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Goal Tracking</CardTitle>
                <CardDescription className="text-gray-600">
                  Set and monitor progress toward distance, pace, and consistency goals with smart insights.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-yellow-600" />
                </div>
                <CardTitle className="text-xl">Achievements & Streaks</CardTitle>
                <CardDescription className="text-gray-600">
                  Earn badges, track running streaks, and celebrate milestones with gamified progress.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Smartphone className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-xl">Mobile Dashboard</CardTitle>
                <CardDescription className="text-gray-600">
                  Access your insights anywhere with a responsive, mobile-optimized interface.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedTestimonials />
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 bg-gradient-to-br from-indigo-50 to-blue-50 border-t border-indigo-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Ready to Unlock Your Running Potential?</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of runners who&apos;ve transformed their training with data-driven insights.
            </p>
            <Link href="/auth/signup">
              <Button size="lg" className="bg-indigo-600 text-white hover:bg-indigo-700 px-8 py-4 text-lg font-semibold shadow-lg">
                <Activity className="mr-2 h-5 w-5" />
                Get Started - It&apos;s Free
              </Button>
            </Link>
            <p className="text-gray-500 text-sm mt-4">No credit card required • Connect your Strava account</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
              <p className="text-xl text-gray-600">Everything you need to know about Enduro Stats</p>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="bg-white rounded-lg border-0 shadow-sm">
                <AccordionTrigger className="px-6 py-4 text-left font-semibold hover:no-underline">
                  How does Enduro Stats connect to my Strava account?
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-gray-600">
                  We use Strava&apos;s secure OAuth system to connect to your account. You&apos;ll be redirected to Strava to
                  authorize access, and we only read your activity data - we never post or modify anything on your
                  behalf.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bg-white rounded-lg border-0 shadow-sm">
                <AccordionTrigger className="px-6 py-4 text-left font-semibold hover:no-underline">
                  What data do you analyze from my runs?
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-gray-600">
                  We analyze pace, distance, elevation, heart rate (if available), cadence, and training frequency to
                  provide insights on training load, performance trends, and goal progress. All analysis is done
                  securely and privately.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bg-white rounded-lg border-0 shadow-sm">
                <AccordionTrigger className="px-6 py-4 text-left font-semibold hover:no-underline">
                  Is there a free trial?
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-gray-600">
                  Yes! We offer a 14-day free trial with full access to all features. No credit card required to start.
                  After the trial, plans start at $9.99/month.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="bg-white rounded-lg border-0 shadow-sm">
                <AccordionTrigger className="px-6 py-4 text-left font-semibold hover:no-underline">
                  Can I use Enduro Stats on my phone?
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-gray-600">
                  Our web app is fully responsive and optimized for mobile devices. You can access all your insights and
                  dashboards from any smartphone or tablet.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="bg-white rounded-lg border-0 shadow-sm">
                <AccordionTrigger className="px-6 py-4 text-left font-semibold hover:no-underline">
                  How accurate are the VO2 Max estimations?
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-gray-600">
                  Our VO2 Max estimations use scientifically-backed algorithms based on your pace, heart rate, and other
                  metrics. While not as precise as lab testing, they provide reliable trends and relative improvements
                  over time.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

    </div>
  )
}
