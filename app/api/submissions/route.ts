import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
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

    // TODO: Send email notification
    // For now, just log it
    console.log('New submission received:', {
      type,
      name,
      email,
      title: title || 'Contact Form',
      message: message.substring(0, 100) + '...'
    });

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