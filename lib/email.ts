import { Resend } from 'resend';

// Create Resend client lazily to avoid build-time issues
function createResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // In development, return a mock client that logs instead of sending
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  RESEND_API_KEY not found - emails will be logged instead of sent');
      return {
        emails: {
          send: async (options: { to: string; subject: string; from: string; html: string }) => {
            console.log('📧 Mock email sent:', {
              to: options.to,
              subject: options.subject,
              from: options.from,
              html: options.html.substring(0, 100) + '...'
            });
            return { data: { id: 'mock-email-id' }, error: null };
          }
        }
      };
    }
    throw new Error('RESEND_API_KEY environment variable is required in production');
  }
  return new Resend(apiKey);
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from }: EmailOptions) {
  try {
    const resend = createResendClient();
    const fromEmail = from || process.env.FROM_EMAIL || 'onboarding@resend.dev'
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Email send error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Email service error:', error);
    throw error;
  }
}

// Predefined email templates
export const emailTemplates = {
  welcome: (userName: string) => ({
    subject: 'Welcome to EnduroRevamp!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to EnduroRevamp!</h1>
        <p>Hi ${userName},</p>
        <p>Welcome to EnduroRevamp! We're excited to help you track and improve your training.</p>
        <p>Get started by:</p>
        <ul>
          <li>Connecting your Strava account</li>
          <li>Setting up your training goals</li>
          <li>Exploring your dashboard</li>
        </ul>
        <p>Happy training!</p>
        <p>The EnduroRevamp Team</p>
      </div>
    `
  }),

  contactForm: (submission: { name: string; email: string; message: string; type: string }) => ({
    subject: `New ${submission.type} submission from ${submission.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${submission.name} (${submission.email})</p>
        <p><strong>Type:</strong> ${submission.type}</p>
        <p><strong>Message:</strong></p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 5px;">
          ${submission.message}
        </div>
      </div>
    `
  }),

  weeklyProgress: (userName: string, stats: { activities?: number; distance?: string; time?: string }) => ({
    subject: 'Your Weekly Training Summary',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Weekly Training Summary</h1>
        <p>Hi ${userName},</p>
        <p>Here's your training summary for this week:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>This Week's Stats:</h3>
          <ul>
            <li>Activities: ${stats.activities || 0}</li>
            <li>Distance: ${stats.distance || '0 km'}</li>
            <li>Time: ${stats.time || '0 hours'}</li>
          </ul>
        </div>
        <p>Keep up the great work!</p>
        <p>The EnduroRevamp Team</p>
      </div>
    `
  })
};
