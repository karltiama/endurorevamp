import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Eye, Lock, Users, Activity } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy - EnduroRevamp',
  description: 'Learn how EnduroRevamp collects, uses, and protects your personal information and fitness data.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to App
          </Button>
        </Link>
        
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
        </div>
        <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="space-y-6">
        {/* Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="w-5 h-5" />
              <span>Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              EnduroRevamp (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our fitness application and related services.
            </p>
            <p>
              By using EnduroRevamp, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our application.
            </p>
          </CardContent>
        </Card>

        {/* Information We Collect */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Information We Collect</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Personal Information</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Name and email address (when you create an account)</li>
                <li>Profile information (age, weight, height, fitness goals)</li>
                <li>Training preferences and settings</li>
                <li>Communication preferences</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Fitness Data (via Strava)</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Activity data (runs, rides, workouts)</li>
                <li>Performance metrics (distance, pace, heart rate, etc.)</li>
                <li>Training load and intensity data</li>
                <li>Personal records and achievements</li>
                <li>Gear and equipment information</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Location Data</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>GPS coordinates (with your explicit permission)</li>
                <li>Manual location inputs (home, work, gym)</li>
                <li>Saved locations for weather and planning</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Usage Data</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>App usage patterns and preferences</li>
                <li>Feature interactions and settings</li>
                <li>Error logs and performance data</li>
                <li>Device information and browser type</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* How We Use Your Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>How We Use Your Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Core Functionality</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Provide personalized fitness insights</li>
                  <li>Generate training recommendations</li>
                  <li>Track progress and achievements</li>
                  <li>Calculate training load and recovery</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Enhanced Features</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Weather-based workout planning</li>
                  <li>Goal setting and progress tracking</li>
                  <li>Performance analytics and trends</li>
                  <li>Personalized coaching suggestions</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Sharing and Third Parties */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="w-5 h-5" />
              <span>Data Sharing and Third Parties</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Strava Integration</h3>
              <p className="text-gray-600 mb-2">
                We integrate with Strava to access your fitness data. This integration is governed by:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Strava&apos;s own privacy policy and terms of service</li>
                <li>OAuth 2.0 authentication for secure access</li>
                <li>Your explicit consent when connecting your Strava account</li>
                <li>Ability to revoke access at any time</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Weather Services</h3>
              <p className="text-gray-600 mb-2">
                We use weather APIs to provide location-based recommendations:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Only coordinates are shared (no personal information)</li>
                <li>Weather data is cached locally for performance</li>
                <li>No tracking of your movements or location history</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">What We Don&apos;t Share</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>We do not sell your personal information</li>
                <li>We do not share data with advertisers</li>
                <li>We do not track your location for marketing purposes</li>
                <li>We do not share your fitness data with third parties (except as required for core functionality)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Data Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Data Security</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Security Measures</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>End-to-end encryption for data transmission</li>
                  <li>Secure authentication via OAuth 2.0</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and user permissions</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Data Storage</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Secure cloud storage with encryption at rest</li>
                  <li>Local storage for sensitive data (location)</li>
                  <li>Regular backups and disaster recovery</li>
                  <li>Compliance with industry security standards</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Your Rights and Choices</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Data Access</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>View and download your personal data</li>
                  <li>Request correction of inaccurate information</li>
                  <li>Access your activity and performance data</li>
                  <li>Review your privacy settings</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Data Control</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Delete your account and all associated data</li>
                  <li>Revoke Strava integration access</li>
                  <li>Control location permissions</li>
                  <li>Opt out of certain data collection</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Children's Privacy */}
        <Card>
          <CardHeader>
            <CardTitle>Children&apos;s Privacy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              EnduroRevamp is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
            </p>
          </CardContent>
        </Card>

        {/* Changes to Policy */}
        <Card>
          <CardHeader>
            <CardTitle>Changes to This Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="space-y-2">
              <p><strong>Email:</strong> privacy@endurorevamp.com</p>
              <p><strong>Support:</strong> Use the in-app support feature</p>
              <p><strong>Data Requests:</strong> Contact us for data access or deletion</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />
      
      <div className="text-center text-sm text-gray-500">
        <p>This privacy policy is effective as of {new Date().toLocaleDateString()}</p>
        <p className="mt-2">
          For location-specific privacy information, see our{' '}
          <Link href="/docs/LOCATION_PRIVACY_POLICY.md" className="text-blue-600 hover:underline">
            Location Data Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
} 