import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Activity,
  Target,
  CloudSun,
  UserCircle,
  Sparkles,
  Smartphone,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
import AnimatedLevelUp from './AnimatedLevelUp';
import EnhancedPhoneMockup from './ui/EnhancedPhoneMockup';

type FeatureStatus = 'live' | 'planned';

const features: {
  title: string;
  description: string;
  icon: typeof Activity;
  iconColor: string;
  screenshot: string | null;
  alt: string;
  bullets: string[];
  status: FeatureStatus;
  usePhoneMockup?: boolean;
}[] = [
  {
    title: 'Strava Activity Analytics',
    description:
      'Import runs and rides from Strava and explore pace, distance, elevation, heart rate, and training metrics in one dashboard.',
    icon: Activity,
    iconColor: 'bg-green-100 text-green-600',
    screenshot: '/images/features/activity-analytics.png',
    alt: 'Activity analytics dashboard with performance metrics from synced Strava activities',
    bullets: [
      'Automatic Strava sync',
      'Activity history and detail views',
      'Personal bests and trend charts',
      'Route data when Strava provides it',
    ],
    status: 'live',
  },
  {
    title: 'Training Load Insights',
    description:
      'See weekly training stress, intensity patterns, and load trends computed from your synced activities.',
    icon: BarChart3,
    iconColor: 'bg-indigo-100 text-indigo-600',
    screenshot: '/images/features/training-load-dashboard.png',
    alt: 'Training load dashboard showing weekly stress and recovery context',
    bullets: [
      'Weekly training load (TSS-style)',
      'Intensity and load trends',
      'Dashboard summaries from your data',
      'Readiness context on the dashboard',
    ],
    status: 'live',
  },
  {
    title: 'Goals & Progress Tracking',
    description:
      'Set distance, pace, and consistency goals, then track progress as new activities sync from Strava.',
    icon: Target,
    iconColor: 'bg-purple-100 text-purple-600',
    screenshot: '/images/features/goal-tracking.png',
    alt: 'Goal tracking dashboard showing progress toward running goals',
    bullets: [
      'Goal types with automatic progress updates',
      'Dynamic goal suggestions from your history',
      'Achievements tied to goal milestones',
      'Weekly and monthly progress views',
    ],
    status: 'live',
  },
  {
    title: 'Onboarding & Training Profile',
    description:
      'Complete a guided setup flow, connect Strava, and configure training preferences and thresholds used across the app.',
    icon: UserCircle,
    iconColor: 'bg-blue-100 text-blue-600',
    screenshot: '/images/features/performance-trends.png',
    alt: 'Training profile and onboarding settings in the Enduro Stats dashboard',
    bullets: [
      'Step-by-step onboarding modal',
      'Training profile and preferences',
      'Threshold and zone configuration',
      'Strava connection during setup',
    ],
    status: 'live',
  },
  {
    title: 'Weather-Aware Workout Planning',
    description:
      'Generate weekly workout plans and daily recommendations with weather context when your location is configured.',
    icon: CloudSun,
    iconColor: 'bg-sky-100 text-sky-600',
    screenshot: '/images/features/training-load-dashboard.png',
    alt: 'Workout planning view with training recommendations',
    bullets: [
      'Rule-based weekly workout plans',
      "Today's workout recommendations",
      'OpenWeather context for your area',
      'Adjustments based on conditions',
    ],
    status: 'live',
  },
  {
    title: 'AI Weekly Training Debrief',
    description:
      'A planned feature to summarize your week in plain language. Not available in the app yet — listed here for transparency.',
    icon: Sparkles,
    iconColor: 'bg-violet-100 text-violet-600',
    screenshot: null,
    alt: 'Planned AI weekly training debrief feature',
    bullets: [
      'Weekly summary in plain language',
      'Highlights from your synced activities',
      'Training context, not medical advice',
      'Planned — not live today',
    ],
    status: 'planned',
  },
  {
    title: 'Mobile-Friendly Dashboard',
    description:
      'Use the same dashboards on phone, tablet, or desktop. The web app is responsive — no separate native app required.',
    icon: Smartphone,
    iconColor: 'bg-red-100 text-red-600',
    screenshot: '/images/features/mobile-dashboard.png',
    alt: 'Mobile-friendly dashboard layout on a smartphone',
    bullets: [
      'Responsive web layout',
      'Touch-friendly navigation',
      'Same features on mobile browsers',
      'No app store download required',
    ],
    status: 'live',
    usePhoneMockup: true,
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
            What the app does today
          </Badge>
          <div className="mb-6">
            <AnimatedLevelUp />
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Screenshots below come from the current Enduro Stats dashboard.
            Features marked &ldquo;Planned&rdquo; are on the roadmap and are
            not live yet.
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
                  {feature.bullets.map(item => (
                    <div key={item} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  {feature.status === 'planned' ? (
                    <Badge
                      variant="outline"
                      className="border-violet-200 text-violet-700 bg-violet-50"
                    >
                      Planned — not live yet
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-indigo-200 text-indigo-700"
                    >
                      Available today
                    </Badge>
                  )}
                </div>
              </div>

              <div
                className={`relative ${index % 2 === 1 ? 'lg:col-start-1' : ''}`}
              >
                {feature.usePhoneMockup ? (
                  <EnhancedPhoneMockup
                    src="/images/features/iphone-mockup.png"
                    alt="Smartphone showing the responsive Enduro Stats dashboard"
                  />
                ) : (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 shadow-xl border">
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
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

                      {feature.status === 'planned' ? (
                        <div className="relative bg-gradient-to-br from-violet-50 to-indigo-50 p-8 text-center">
                          <div className="max-w-md mx-auto">
                            <div className="w-full h-64 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-lg border-2 border-dashed border-violet-300 flex items-center justify-center">
                              <div className="text-center px-4">
                                <Sparkles className="h-12 w-12 text-violet-500 mx-auto mb-3" />
                                <p className="text-violet-800 font-medium">
                                  Planned feature
                                </p>
                                <p className="text-violet-600 text-sm mt-2">
                                  AI Weekly Training Debrief is on the roadmap
                                  and is not available in the app yet.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : feature.screenshot ? (
                        <div className="p-4">
                          <Image
                            src={feature.screenshot}
                            alt={feature.alt}
                            width={800}
                            height={500}
                            className="w-full h-auto rounded-lg shadow-lg"
                          />
                        </div>
                      ) : null}
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
