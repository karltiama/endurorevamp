import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Target,
  Award,
  Smartphone,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
import AnimatedLevelUp from './AnimatedLevelUp';
import EnhancedPhoneMockup from './ui/EnhancedPhoneMockup';

const features = [
  {
    title: 'Training Load Analysis',
    description:
      'Track your training stress and recovery with advanced load metrics and trend analysis.',
    icon: BarChart3,
    iconColor: 'bg-indigo-100 text-indigo-600',
    screenshot: '/images/features/training-load-dashboard.png',
    alt: 'Training Load Dashboard showing weekly training stress and recovery metrics',
    features: [
      'Weekly training stress',
      'Recovery tracking',
      'Load balance analysis',
      'Trend visualization',
    ],
  },
  {
    title: 'Performance Trends',
    description:
      'Visualize pace, heart rate, and cadence trends over weeks, months, and years.',
    icon: TrendingUp,
    iconColor: 'bg-blue-100 text-blue-600',
    screenshot: '/images/features/performance-trends.png',
    alt: 'Performance trends chart showing pace and heart rate improvements over time',
    features: [
      'Pace progression',
      'Heart rate zones',
      'Cadence analysis',
      'Long-term trends',
    ],
  },
  {
    title: 'Activity Analytics',
    description:
      'Dive deep into your performance with detailed analytics, route visualization, and trend analysis.',
    icon: Activity,
    iconColor: 'bg-green-100 text-green-600',
    screenshot: '/images/features/activity-analytics.png',
    alt: 'Activity Analytics Dashboard showing performance metrics and route data',
    features: [
      'Performance tracking',
      'Route visualization (Coming Soon)',
      'Trend analysis',
      'Detailed insights',
    ],
  },
  {
    title: 'Smart Goal Tracking',
    description:
      'Set and monitor progress toward distance, pace, and consistency goals with smart insights.',
    icon: Target,
    iconColor: 'bg-purple-100 text-purple-600',
    screenshot: '/images/features/goal-tracking.png',
    alt: 'Goal tracking dashboard showing progress toward running goals',
    features: [
      'Progress tracking',
      'Smart suggestions',
      'Milestone alerts',
      'Adaptive goals',
    ],
  },
  {
    title: 'Achievements & Streaks',
    description:
      'Earn badges, track running streaks, and celebrate milestones with gamified progress.',
    icon: Award,
    iconColor: 'bg-yellow-100 text-yellow-600',
    screenshot: null, // Coming soon - no screenshot yet
    alt: 'Achievements dashboard showing badges, streaks, and milestones',
    features: [
      'Running streaks',
      'Achievement badges',
      'Milestone tracking',
      'Progress celebrations',
    ],
    comingSoon: true,
    isLive: false,
  },
  {
    title: 'Mobile Dashboard',
    description:
      'Access your insights anywhere with a responsive, mobile-optimized interface.',
    icon: Smartphone,
    iconColor: 'bg-red-100 text-red-600',
    screenshot: '/images/features/mobile-dashboard.png',
    alt: 'Mobile dashboard showing responsive design on smartphone',
    features: [
      'Mobile optimized',
      'Touch friendly',
      'Offline access',
      'Push notifications',
    ],
    isLive: false,
  },
];

export default function EnhancedFeaturesSection() {
  return (
    <section
      id="features"
      className="py-20 bg-gradient-to-b from-indigo-50 via-gray-50 to-white"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge
            variant="secondary"
            className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 mb-4"
          >
            <Zap className="w-3 h-3 mr-1" />
            Real Features, Real Results
          </Badge>
          <div className="mb-6">
            <AnimatedLevelUp />
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            These aren&apos;t mockups - they&apos;re actual screenshots from
            your Enduro Stats dashboard. Experience the real features that
            serious runners use every day.
          </p>
        </div>

        <div className="space-y-16">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-center ${
                index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''
              }`}
            >
              {/* Feature Card */}
              <div
                className={`space-y-6 ${index % 2 === 1 ? 'lg:col-start-2' : ''}`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${feature.iconColor}`}
                  >
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {feature.title}
                  </h3>
                </div>

                <p className="text-lg text-gray-600 leading-relaxed">
                  {feature.description}
                </p>

                <div className="space-y-3">
                  {feature.features.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="flex items-center space-x-3"
                    >
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  {feature.comingSoon ? (
                    <Badge
                      variant="outline"
                      className="border-yellow-200 text-yellow-700 bg-yellow-50"
                    >
                      Coming Soon
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-indigo-200 text-indigo-700"
                    >
                      Live Feature
                    </Badge>
                  )}
                </div>
              </div>

              {/* Screenshot */}
              <div
                className={`relative ${index % 2 === 1 ? 'lg:col-start-1' : ''}`}
              >
                {feature.title === 'Mobile Dashboard' ? (
                  // Mobile dashboard - use professional iPhone mockup with enhanced styling
                  <EnhancedPhoneMockup
                    src="/images/features/iphone-mockup.png"
                    alt="iPhone mockup showing mobile dashboard interface"
                  />
                ) : (
                  // Other features - with browser container
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

                      {/* Real Screenshot, Coming Soon, or Placeholder */}
                      {feature.comingSoon ? (
                        <div className="relative bg-gradient-to-br from-yellow-50 to-orange-50 p-8 text-center">
                          <div className="max-w-md mx-auto">
                            <div className="w-full h-64 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg border-2 border-dashed border-yellow-300 flex items-center justify-center">
                              <div className="text-center">
                                <Award className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                                <p className="text-yellow-700 font-medium">
                                  Coming Soon!
                                </p>
                                <p className="text-yellow-600 text-sm">
                                  Launching in the next few days
                                </p>
                                <div className="mt-3">
                                  <Badge
                                    variant="outline"
                                    className="border-yellow-300 text-yellow-700 bg-yellow-100"
                                  >
                                    🚀 In Development
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : feature.screenshot ? (
                        <div className="p-4">
                          <Image
                            src={feature.screenshot}
                            alt={feature.alt}
                            width={
                              feature.title === 'Activity Analytics' ? 800 : 600
                            }
                            height={
                              feature.title === 'Activity Analytics' ? 500 : 400
                            }
                            className={`w-full h-auto ${feature.title === 'Activity Analytics' ? 'rounded-lg shadow-lg' : ''}`}
                          />
                        </div>
                      ) : (
                        <div className="relative bg-gray-50 p-8 text-center">
                          <div className="max-w-md mx-auto">
                            <div className="w-full h-64 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg border-2 border-dashed border-indigo-200 flex items-center justify-center">
                              <div className="text-center">
                                <BarChart3 className="h-12 w-12 text-indigo-400 mx-auto mb-3" />
                                <p className="text-indigo-600 font-medium">
                                  Screenshot Placeholder
                                </p>
                                <p className="text-indigo-400 text-sm">
                                  Add actual dashboard screenshots here
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Floating Elements */}
                {feature.isLive && (
                  <div className="absolute -top-2 -right-2 bg-white rounded-lg shadow-lg p-2 border">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-gray-700">
                        Live
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
