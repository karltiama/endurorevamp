import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  TrendingUp,
  Activity,
  Target,
  Award,
  Smartphone,
  Zap,
  Calendar,
  Heart,
  MapPin,
  Clock,
  Trophy,
} from "lucide-react"
import Image from "next/image"

const features = [
  {
    title: "Training Load Analysis",
    description: "Track your training stress and recovery with advanced load metrics and trend analysis.",
    icon: BarChart3,
    iconColor: "bg-indigo-100 text-indigo-600",
    screenshot: "/images/features/training-load-dashboard.png",
    alt: "Training Load Dashboard showing weekly training stress and recovery metrics",
    features: ["Weekly training stress", "Recovery tracking", "Load balance analysis", "Trend visualization"]
  },
  {
    title: "Performance Trends",
    description: "Visualize pace, heart rate, and cadence trends over weeks, months, and years.",
    icon: TrendingUp,
    iconColor: "bg-blue-100 text-blue-600",
    screenshot: "/images/features/performance-trends.png",
    alt: "Performance trends chart showing pace and heart rate improvements over time",
    features: ["Pace progression", "Heart rate zones", "Cadence analysis", "Long-term trends"]
  },
  {
    title: "Activity Analytics",
    description: "Deep dive into your runs with detailed metrics and performance insights.",
    icon: Activity,
    iconColor: "bg-green-100 text-green-600",
    screenshot: "/images/features/activity-analytics.png",
    alt: "Activity analytics dashboard with detailed run metrics and charts",
    features: ["Detailed run analysis", "Performance metrics", "Route visualization", "Comparative insights"]
  },
  {
    title: "Smart Goal Tracking",
    description: "Set and monitor progress toward distance, pace, and consistency goals with smart insights.",
    icon: Target,
    iconColor: "bg-purple-100 text-purple-600",
    screenshot: "/images/features/goal-tracking.png",
    alt: "Goal tracking dashboard showing progress toward running goals",
    features: ["Progress tracking", "Smart suggestions", "Milestone alerts", "Adaptive goals"]
  },
  {
    title: "Achievements & Streaks",
    description: "Earn badges, track running streaks, and celebrate milestones with gamified progress.",
    icon: Award,
    iconColor: "bg-yellow-100 text-yellow-600",
    screenshot: "/images/features/achievements.png",
    alt: "Achievements dashboard showing badges, streaks, and milestones",
    features: ["Running streaks", "Achievement badges", "Milestone tracking", "Progress celebrations"]
  },
  {
    title: "Mobile Dashboard",
    description: "Access your insights anywhere with a responsive, mobile-optimized interface.",
    icon: Smartphone,
    iconColor: "bg-red-100 text-red-600",
    screenshot: "/images/features/mobile-dashboard.png",
    alt: "Mobile dashboard showing responsive design on smartphone",
    features: ["Mobile optimized", "Touch friendly", "Offline access", "Push notifications"]
  }
]

export default function EnhancedFeaturesSection() {
  return (
    <section id="features" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 mb-4">
            <Zap className="w-3 h-3 mr-1" />
            Real Features, Real Results
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            See Your Running Data Come to Life
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            These aren't mockups - they're actual screenshots from your Enduro Stats dashboard. 
            Experience the real features that serious runners use every day.
          </p>
        </div>

        <div className="space-y-16">
          {features.map((feature, index) => (
            <div key={feature.title} className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-center ${
              index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''
            }`}>
              {/* Feature Card */}
              <div className={`space-y-6 ${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${feature.iconColor}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{feature.title}</h3>
                </div>
                
                <p className="text-lg text-gray-600 leading-relaxed">
                  {feature.description}
                </p>

                <div className="space-y-3">
                  {feature.features.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Badge variant="outline" className="border-indigo-200 text-indigo-700">
                    Live Feature
                  </Badge>
                </div>
              </div>

              {/* Screenshot */}
              <div className={`relative ${index % 2 === 1 ? 'lg:col-start-1' : ''}`}>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 shadow-xl border">
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Mock Browser Header */}
                    <div className="bg-gray-100 p-3 flex items-center space-x-2">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      </div>
                      <div className="flex-1 mx-4">
                        <div className="bg-white rounded px-3 py-1 text-sm text-gray-500 text-center">
                          endurostats.com
                        </div>
                      </div>
                    </div>
                    
                    {/* Screenshot Placeholder */}
                    <div className="relative bg-gray-50 p-8 text-center">
                      <div className="max-w-md mx-auto">
                        <div className="w-full h-64 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg border-2 border-dashed border-indigo-200 flex items-center justify-center">
                          <div className="text-center">
                            <BarChart3 className="h-12 w-12 text-indigo-400 mx-auto mb-3" />
                            <p className="text-indigo-600 font-medium">Screenshot Placeholder</p>
                            <p className="text-indigo-400 text-sm">Add actual dashboard screenshots here</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-2 -right-2 bg-white rounded-lg shadow-lg p-2 border">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-gray-700">Live</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16 pt-12 border-t border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to See These Features in Action?
          </h3>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            Connect your Strava account and start exploring your running data with these powerful analytics tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/auth/signup" className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
              <Activity className="mr-2 h-5 w-5" />
              Start Free Trial
            </a>
            <a href="/dashboard" className="inline-flex items-center px-6 py-3 border border-indigo-200 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-50 transition-colors">
              View Demo
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
