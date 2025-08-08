import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const config = {
      resendApiKey: process.env.RESEND_API_KEY ? '✅ Configured' : '❌ Missing',
      fromEmail: process.env.FROM_EMAIL || '❌ Not set',
      adminEmail: process.env.ADMIN_EMAIL || '❌ Not set',
      resendDomain: process.env.RESEND_DOMAIN || '❌ Not set',
      nodeEnv: process.env.NODE_ENV || 'development'
    };

    const recommendations = [];

    if (!process.env.RESEND_API_KEY) {
      recommendations.push('Add RESEND_API_KEY to your environment variables');
    }

    if (!process.env.FROM_EMAIL) {
      recommendations.push('Add FROM_EMAIL (e.g., noreply@yourdomain.com)');
    }

    if (!process.env.ADMIN_EMAIL) {
      recommendations.push('Add ADMIN_EMAIL (e.g., admin@yourdomain.com)');
    }

    if (!process.env.RESEND_DOMAIN) {
      recommendations.push('Add RESEND_DOMAIN for better deliverability');
    }

    return NextResponse.json({
      config,
      recommendations,
      nextSteps: [
        '1. Sign up at resend.com and get your API key',
        '2. Add your domain in Resend dashboard',
        '3. Update your .env.local with the configuration above',
        '4. Test your setup at /test-email'
      ]
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to check configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
