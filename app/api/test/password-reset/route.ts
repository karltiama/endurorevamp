import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Generate a test token (in production, Supabase would do this)
    const testToken = `test_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create a test reset URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/auth/reset-password?token_hash=${testToken}&type=recovery`;

    return NextResponse.json({
      message: 'Test password reset link generated',
      testResetUrl: resetUrl,
      token: testToken,
      note: 'This is a test endpoint - no real email was sent',
    });
  } catch (error) {
    console.error('Test password reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
