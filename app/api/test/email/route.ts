import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, emailTemplates } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { to, template } = await request.json();

    if (!to) {
      return NextResponse.json(
        { error: 'Email address required' },
        { status: 400 }
      );
    }

    let emailContent;
    switch (template) {
      case 'welcome':
        emailContent = emailTemplates.welcome('Test User');
        break;
      case 'contact':
        emailContent = emailTemplates.contactForm({
          name: 'Test User',
          email: 'test@example.com',
          message: 'This is a test message from the contact form.',
          type: 'contact',
        });
        break;
      case 'weekly':
        emailContent = emailTemplates.weeklyProgress('Test User', {
          activities: 5,
          distance: '50 km',
          time: '8 hours',
        });
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid template. Use: welcome, contact, or weekly' },
          { status: 400 }
        );
    }

    await sendEmail({
      to,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${to}`,
      template,
    });
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      {
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
