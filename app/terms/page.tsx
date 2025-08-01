import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, AlertTriangle, Shield, Users, Activity } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service - EnduroRevamp',
  description: 'Terms and conditions for using EnduroRevamp fitness application and services.',
};

export default function TermsOfServicePage() {
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
          <FileText className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
        </div>
        <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="space-y-6">
        {/* Agreement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Agreement to Terms</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              By accessing and using EnduroRevamp ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
            <p>
              These Terms of Service ("Terms") govern your use of our website and services. Please read these Terms carefully, and contact us if you have any questions.
            </p>
          </CardContent>
        </Card>

        {/* Description of Service */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Description of Service</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              EnduroRevamp is a fitness application that provides:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Fitness activity tracking and analysis</li>
              <li>Training load calculation and recovery monitoring</li>
              <li>Personalized workout recommendations</li>
              <li>Goal setting and progress tracking</li>
              <li>Weather-based training planning</li>
              <li>Performance analytics and insights</li>
              <li>Integration with Strava for activity data</li>
            </ul>
          </CardContent>
        </Card>

        {/* User Accounts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>User Accounts</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Account Creation</h3>
              <p className="text-gray-600 mb-2">
                To use certain features of the Service, you must create an account. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized use</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Account Termination</h3>
              <p className="text-gray-600 mb-2">
                We may terminate or suspend your account at any time for:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Violation of these Terms</li>
                <li>Fraudulent or illegal activity</li>
                <li>Extended periods of inactivity</li>
                <li>At your request</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Acceptable Use */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Acceptable Use</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Use the Service in any way that violates applicable laws or regulations</li>
                <li>Attempt to gain unauthorized access to the Service or its systems</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Use the Service to transmit harmful, offensive, or inappropriate content</li>
                <li>Reverse engineer, decompile, or disassemble the Service</li>
                <li>Use automated systems to access the Service without permission</li>
                <li>Share your account credentials with others</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Third-Party Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Third-Party Services</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Strava Integration</h3>
              <p className="text-gray-600 mb-2">
                Our Service integrates with Strava. By connecting your Strava account:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>You agree to Strava's Terms of Service and Privacy Policy</li>
                <li>You authorize us to access your Strava data</li>
                <li>You can revoke access at any time through Strava settings</li>
                <li>We are not responsible for Strava's services or data accuracy</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Weather Services</h3>
              <p className="text-gray-600 mb-2">
                We use third-party weather services to provide location-based recommendations. These services have their own terms and privacy policies.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Disclaimers and Limitations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Fitness and Health Disclaimer</h3>
              <p className="text-gray-600 mb-2">
                The Service provides fitness information and recommendations, but:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>We are not medical professionals</li>
                <li>Information is for educational purposes only</li>
                <li>Consult healthcare providers before starting new fitness programs</li>
                <li>You are responsible for your own health and safety</li>
                <li>We are not liable for injuries or health issues</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Service Availability</h3>
              <p className="text-gray-600 mb-2">
                We strive to provide reliable service, but:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>The Service is provided "as is" without warranties</li>
                <li>We may modify or discontinue features at any time</li>
                <li>Service may be temporarily unavailable for maintenance</li>
                <li>We are not responsible for data loss or service interruptions</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Intellectual Property */}
        <Card>
          <CardHeader>
            <CardTitle>Intellectual Property</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              The Service and its original content, features, and functionality are owned by EnduroRevamp and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
            <p className="text-gray-600">
              You retain ownership of your personal data and content. By using the Service, you grant us a limited license to use your data to provide the Service.
            </p>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Your privacy is important to us. Please review our{' '}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
              , which also governs your use of the Service, to understand our practices.
            </p>
          </CardContent>
        </Card>

        {/* Limitation of Liability */}
        <Card>
          <CardHeader>
            <CardTitle>Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              In no event shall EnduroRevamp, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
            </p>
          </CardContent>
        </Card>

        {/* Governing Law */}
        <Card>
          <CardHeader>
            <CardTitle>Governing Law</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              These Terms shall be interpreted and governed by the laws of [Your Jurisdiction], without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
            </p>
          </CardContent>
        </Card>

        {/* Changes to Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Changes to Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="space-y-2">
              <p><strong>Email:</strong> legal@endurorevamp.com</p>
              <p><strong>Support:</strong> Use the in-app support feature</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />
      
      <div className="text-center text-sm text-gray-500">
        <p>These terms of service are effective as of {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
} 