import { Button } from "@/components/ui/button"
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
  ChevronRight,
  Star,
  Menu,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AnimatedStats from "@/components/AnimatedStats"
import AnimatedTestimonials from "@/components/AnimatedTestimonials"
import EnhancedFeaturesSection from "@/components/EnhancedFeaturesSection"

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

      {/* Hero Section - Start with blue/indigo */}
      <section className="relative bg-gradient-to-b from-blue-50 via-indigo-100 to-indigo-50">
        {/* Hero Content */}
        <div className="py-12 sm:py-16 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-5 gap-8 lg:gap-16 items-center">
              <div className="space-y-8 lg:col-span-3">
                <div className="space-y-4">
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100">
                    <Zap className="w-3 h-3 mr-1" />
                    Powered by Strava Data
                  </Badge>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight text-center">
                    Go Beyond the Basics – <span className="text-indigo-600">Know Your Run</span>
                  </h1>
                  <p className="text-lg sm:text-xl text-gray-600 leading-relaxed text-center">
                    Transform your Strava data into actionable insights. Track training load, analyze performance trends,
                    and achieve your running goals with personalized analytics.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/auth/signup" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold"
                    >
                      <Activity className="mr-2 h-4 sm:h-5 w-4 sm:w-5" />
                      Get Started For Free
                    </Button>
                  </Link>
                  <Link href="/auth/login" className="w-full sm:w-auto">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg bg-transparent">
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
          </div>
        </section>

        {/* Enhanced Features Section */}
        <EnhancedFeaturesSection />
      </section>

      {/* Testimonials and CTA Section - Transition from white to blue */}
      <section className="relative bg-gradient-to-b from-white via-blue-50 to-blue-100">
        {/* Testimonial Content */}
        <div id="testimonials" className="py-12 sm:py-16 lg:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* Testimonials Title */}
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">What Runners Are Saying</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Join thousands of runners who have transformed their training with Enduro Stats
              </p>
            </div>
            
            <AnimatedTestimonials />
          </div>
        </div>

        {/* CTA Banner Content - seamlessly integrated */}
        <div className="py-12 sm:py-14 lg:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              {/* Enhanced headline */}
              <div className="mb-6">
                <div className="inline-flex items-center bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                  <Zap className="w-4 h-4 mr-2" />
                  Start training smarter today
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                  Ready to Unlock Your Running Potential?
                </h2>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                  Transform your training with data-driven insights. Connect your Strava account and discover what your running data reveals about your performance.
                </p>
              </div>

              {/* Enhanced CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
                <Link href="/auth/signup" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-indigo-600 text-white hover:bg-indigo-700 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                    <Activity className="mr-2 h-4 sm:h-5 w-4 sm:w-5" />
                    Start Your Free Trial
                  </Button>
                </Link>
                <Link href="#features" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                    See All Features
                    <ChevronRight className="ml-2 h-4 sm:h-5 w-4 sm:w-5" />
                  </Button>
                </Link>
              </div>

              {/* Honest trust signals */}
              <div className="space-y-3">
                <p className="text-gray-500 text-sm">
                  ✓ 14-day free trial • ✓ No credit card required • ✓ Cancel anytime
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 text-green-500 mr-1" />
                    <span>Secure & Private</span>
                  </div>
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 text-blue-500 mr-1" />
                    <span>Official Strava Integration</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section - Final transition from blue to light gray */}
      <section id="faq" className="py-20 bg-gradient-to-b from-blue-100 via-blue-50 to-gray-50">
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
