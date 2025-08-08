import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail, emailTemplates } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { type, title, name, email, message, category, priority } = await request.json();

    // Validate required fields
    if (!type || !name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate type
    if (!['contact', 'suggestion', 'bug_report', 'general'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid submission type' },
        { status: 400 }
      );
    }

    // Insert into database
    const { data, error } = await supabase
      .from('form_submissions')
      .insert({
        type,
        title: title || null,
        name,
        email,
        message,
        category: category || (type === 'suggestion' ? 'feature_request' : 'general_inquiry'),
        priority: priority || 'medium'
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save submission' },
        { status: 500 }
      );
    }

    // Send email notification to admin
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'you@example.com';
      const emailContent = emailTemplates.contactForm({ name, email, message, type });
      
      await sendEmail({
        to: adminEmail,
        subject: emailContent.subject,
        html: emailContent.html,
        from: process.env.FROM_EMAIL || 'onboarding@resend.dev'
      });

      console.log('Email notification sent for submission:', data.id);
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the request if email fails
    }

    // Send confirmation email to user
    try {
      await sendEmail({
        to: email,
        subject: 'Thank you for your submission - EnduroRevamp',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Thank you for contacting us!</h1>
            <p>Hi ${name},</p>
            <p>We've received your ${type} submission and will get back to you soon.</p>
            <p><strong>Your message:</strong></p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
              ${message}
            </div>
            <p>We appreciate your feedback and will respond as soon as possible.</p>
            <p>Best regards,<br>The EnduroRevamp Team</p>
          </div>
        `,
        from: process.env.FROM_EMAIL || 'onboarding@resend.dev'
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ 
      success: true, 
      id: data.id 
    });

  } catch (error) {
    console.error('Submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 