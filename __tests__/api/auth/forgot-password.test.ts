import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/forgot-password/route';

// Mock the entire modules
jest.mock('@/lib/supabase/server');
// Mock email service
jest.mock('@/lib/email', () => ({
  sendEmail: jest.fn(),
  emailTemplates: {
    passwordReset: jest.fn(() => ({
      subject: 'Reset Your EnduroRevamp Password',
      html: '<div>Password reset email</div>',
    })),
  },
}));

describe('/api/auth/forgot-password', () => {
  const mockResetPasswordForEmail = jest.fn();
  const mockSendEmail = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    const { createClient } = require('@/lib/supabase/server');
    const { sendEmail } = require('@/lib/email');

    createClient.mockResolvedValue({
      auth: {
        resetPasswordForEmail: mockResetPasswordForEmail,
      },
    });

    sendEmail.mockImplementation(mockSendEmail);
  });

  it('returns 400 when email is missing', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Email is required');
  });

  it('returns 400 when email is empty string', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({ email: '' }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Email is required');
  });

  it('successfully sends password reset email', async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      error: null,
    });
    mockSendEmail.mockResolvedValue({ id: 'email-123' });

    const request = new NextRequest(
      'http://localhost:3000/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Password reset email sent successfully');

    expect(mockResetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
      redirectTo: 'http://localhost:3000/auth/reset-password',
    });

    expect(mockSendEmail).toHaveBeenCalledWith({
      to: 'test@example.com',
      subject: 'Reset Your EnduroRevamp Password',
      html: expect.any(String),
    });
  });

  it('handles Supabase error', async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      error: { message: 'User not found' },
    });

    const request = new NextRequest(
      'http://localhost:3000/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to send password reset email');
  });

  it('handles email service error gracefully', async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      error: null,
    });
    mockSendEmail.mockRejectedValue(new Error('Email service down'));

    const request = new NextRequest(
      'http://localhost:3000/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    // Should still succeed even if custom email fails
    expect(response.status).toBe(200);
    expect(data.message).toBe('Password reset email sent successfully');
  });

  it('uses environment variable for site URL', async () => {
    const originalEnv = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = 'https://myapp.com';

    mockResetPasswordForEmail.mockResolvedValue({
      error: null,
    });

    const request = new NextRequest(
      'http://localhost:3000/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      }
    );

    await POST(request);

    expect(mockResetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
      redirectTo: 'https://myapp.com/auth/reset-password',
    });

    // Restore original env
    process.env.NEXT_PUBLIC_SITE_URL = originalEnv;
  });

  it('handles malformed JSON gracefully', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/auth/forgot-password',
      {
        method: 'POST',
        body: 'invalid json',
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
