# Email Setup Guide for EnduroRevamp

This guide covers setting up email functionality using Resend for your Next.js application.

## 🚀 Quick Start with Resend

### 1. Sign Up for Resend
1. Go to [resend.com](https://resend.com)
2. Create a free account
3. Verify your email address

### 2. Get Your API Key
1. In your Resend dashboard, go to **API Keys**
2. Create a new API key
3. Copy the API key (starts with `re_`)

### 3. Verify Your Domain (Recommended)
1. Go to **Domains** in your Resend dashboard
2. Add your domain (e.g., `yourdomain.com`)
3. Follow the DNS verification steps
4. Wait for verification (usually takes a few minutes)

### 4. Environment Variables
Add these to your `.env.local`:

```env
# Resend Configuration
RESEND_API_KEY=re_your_api_key_here

# Email Configuration
FROM_EMAIL=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com

# Optional: Custom domain for sending
RESEND_DOMAIN=yourdomain.com
```

### 5. Install Dependencies
```bash
npm install resend
```

## 📧 Email Features Implemented

### Contact Form Notifications
- **Admin Notification**: Sends email to admin when contact form is submitted
- **User Confirmation**: Sends confirmation email to user who submitted the form

### Email Templates Available
- Welcome emails for new users
- Contact form notifications
- Weekly training progress summaries

## 🔧 Configuration Options

### Alternative Email Services

If you prefer other services, here are the setup instructions:

#### SendGrid
```bash
npm install @sendgrid/mail
```

```typescript
// lib/email-sendgrid.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmail({ to, subject, html, from }: EmailOptions) {
  try {
    await sgMail.send({
      to,
      from: from || 'noreply@yourdomain.com',
      subject,
      html,
    });
  } catch (error) {
    console.error('SendGrid error:', error);
    throw error;
  }
}
```

#### Mailgun
```bash
npm install mailgun.js form-data
```

```typescript
// lib/email-mailgun.ts
import formData from 'form-data';
import Mailgun from 'mailgun.js';

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY!,
});

export async function sendEmail({ to, subject, html, from }: EmailOptions) {
  try {
    await mg.messages.create(process.env.MAILGUN_DOMAIN!, {
      from: from || 'noreply@yourdomain.com',
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('Mailgun error:', error);
    throw error;
  }
}
```

#### AWS SES
```bash
npm install @aws-sdk/client-ses
```

```typescript
// lib/email-ses.ts
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const ses = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function sendEmail({ to, subject, html, from }: EmailOptions) {
  try {
    const command = new SendEmailCommand({
      Source: from || 'noreply@yourdomain.com',
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject },
        Body: { Html: { Data: html } },
      },
    });

    await ses.send(command);
  } catch (error) {
    console.error('SES error:', error);
    throw error;
  }
}
```

## 🧪 Testing

### Run Email Tests
```bash
npm test -- --testPathPattern=email.test.ts
```

### Test Email Sending (Development)
Create a test API endpoint:

```typescript
// app/api/test/email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, emailTemplates } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { to, template } = await request.json();
    
    let emailContent;
    switch (template) {
      case 'welcome':
        emailContent = emailTemplates.welcome('Test User');
        break;
      case 'contact':
        emailContent = emailTemplates.contactForm({
          name: 'Test User',
          email: 'test@example.com',
          message: 'This is a test message',
          type: 'contact'
        });
        break;
      default:
        return NextResponse.json({ error: 'Invalid template' }, { status: 400 });
    }

    await sendEmail({
      to,
      subject: emailContent.subject,
      html: emailContent.html
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({ error: 'Failed to send test email' }, { status: 500 });
  }
}
```

## 🔒 Security Best Practices

### 1. Environment Variables
- Never commit API keys to version control
- Use different API keys for development and production
- Rotate API keys regularly

### 2. Rate Limiting
Consider implementing rate limiting for email endpoints:

```typescript
// lib/rate-limit.ts
import { NextRequest } from 'next/server';

const emailLimits = new Map<string, { count: number; resetTime: number }>();

export function checkEmailRateLimit(email: string, limit = 5, windowMs = 60000): boolean {
  const now = Date.now();
  const userLimit = emailLimits.get(email);

  if (!userLimit || now > userLimit.resetTime) {
    emailLimits.set(email, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (userLimit.count >= limit) {
    return false;
  }

  userLimit.count++;
  return true;
}
```

### 3. Email Validation
Always validate email addresses:

```typescript
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

## 📊 Monitoring & Analytics

### Resend Dashboard
- Track email delivery rates
- Monitor bounce rates
- View email analytics

### Custom Logging
```typescript
// Enhanced email service with logging
export async function sendEmailWithLogging(options: EmailOptions) {
  const startTime = Date.now();
  
  try {
    const result = await sendEmail(options);
    
    console.log('Email sent successfully', {
      to: options.to,
      subject: options.subject,
      duration: Date.now() - startTime,
      id: result?.id
    });
    
    return result;
  } catch (error) {
    console.error('Email failed', {
      to: options.to,
      subject: options.subject,
      error: error.message,
      duration: Date.now() - startTime
    });
    
    throw error;
  }
}
```

## 🚨 Troubleshooting

### Common Issues

1. **"Invalid API key"**
   - Check your `RESEND_API_KEY` environment variable
   - Ensure the key starts with `re_`

2. **"Domain not verified"**
   - Verify your domain in Resend dashboard
   - Check DNS records are correct
   - Wait for DNS propagation (can take up to 24 hours)

3. **Emails going to spam**
   - Use a verified domain
   - Set up SPF and DKIM records
   - Avoid spam trigger words
   - Maintain good sender reputation

4. **Rate limiting**
   - Resend free tier: 3,000 emails/month
   - Implement rate limiting in your app
   - Monitor usage in dashboard

### Debug Mode
Enable debug logging:

```typescript
// lib/email.ts
const resend = new Resend(process.env.RESEND_API_KEY);

if (process.env.NODE_ENV === 'development') {
  console.log('Resend configured with domain:', process.env.RESEND_DOMAIN);
}
```

## 📈 Scaling Considerations

### High Volume
- Consider upgrading Resend plan
- Implement email queuing
- Use batch sending for multiple recipients

### Cost Optimization
- Monitor email volume
- Clean email lists regularly
- Use templates to reduce development time

### Performance
- Send emails asynchronously
- Implement retry logic
- Cache email templates

## 🔄 Migration from Other Services

If you're migrating from another email service:

1. **Export your email templates**
2. **Update environment variables**
3. **Test thoroughly in development**
4. **Gradually migrate in production**
5. **Monitor delivery rates**

## 📚 Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [Email Best Practices](https://resend.com/docs/best-practices)
- [React Email Templates](https://react.email/)
- [Email Deliverability Guide](https://resend.com/docs/deliverability)
