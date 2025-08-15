import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LoginPage from '@/app/auth/login/page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const mockRouter = {
  push: jest.fn(),
};

describe('LoginPage - Forgot Password Integration', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (global.fetch as jest.Mock).mockClear();
  });

  it('shows forgot password form when clicking "Forgot password?"', () => {
    render(<LoginPage />);
    
    const forgotPasswordButton = screen.getByText('Forgot password?');
    fireEvent.click(forgotPasswordButton);

    expect(screen.getByText('Forgot your password?')).toBeInTheDocument();
    expect(screen.getByText('Enter your email address and we\'ll send you a link to reset your password')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send reset link' })).toBeInTheDocument();
    expect(screen.getByText('← Back to login')).toBeInTheDocument();
  });

  it('handles forgot password form submission successfully', async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ message: 'Success' }) };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    render(<LoginPage />);
    
    // Show forgot password form
    const forgotPasswordButton = screen.getByText('Forgot password?');
    fireEvent.click(forgotPasswordButton);

    const emailInput = screen.getByLabelText('Email address');
    const submitButton = screen.getByRole('button', { name: 'Send reset link' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/We've sent a password reset link to/)).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('handles forgot password form submission error', async () => {
    const mockResponse = { 
      ok: false, 
      json: () => Promise.resolve({ error: 'Email not found' }) 
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    render(<LoginPage />);
    
    // Show forgot password form
    const forgotPasswordButton = screen.getByText('Forgot password?');
    fireEvent.click(forgotPasswordButton);

    const emailInput = screen.getByLabelText('Email address');
    const submitButton = screen.getByRole('button', { name: 'Send reset link' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email not found')).toBeInTheDocument();
    });
  });

  it('handles network error in forgot password', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<LoginPage />);
    
    // Show forgot password form
    const forgotPasswordButton = screen.getByText('Forgot password?');
    fireEvent.click(forgotPasswordButton);

    const emailInput = screen.getByLabelText('Email address');
    const submitButton = screen.getByRole('button', { name: 'Send reset link' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('shows loading state during forgot password submission', async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ message: 'Success' }) };
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockResponse), 100))
    );

    render(<LoginPage />);
    
    // Show forgot password form
    const forgotPasswordButton = screen.getByText('Forgot password?');
    fireEvent.click(forgotPasswordButton);

    const emailInput = screen.getByLabelText('Email address');
    const submitButton = screen.getByRole('button', { name: 'Send reset link' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('Sending...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('allows retry after success', async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ message: 'Success' }) };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    render(<LoginPage />);
    
    // Show forgot password form
    const forgotPasswordButton = screen.getByText('Forgot password?');
    fireEvent.click(forgotPasswordButton);

    const emailInput = screen.getByLabelText('Email address');
    const submitButton = screen.getByRole('button', { name: 'Send reset link' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/We've sent a password reset link to/)).toBeInTheDocument();
    });

    const tryAgainButton = screen.getByText('Try again');
    fireEvent.click(tryAgainButton);

    // Should return to the forgot password form, not the login form
    expect(screen.getByText('Forgot your password?')).toBeInTheDocument();
    expect(screen.getByText('Enter your email address and we\'ll send you a link to reset your password')).toBeInTheDocument();
    
    // The email input should be cleared when retrying - find it again after reset
    const resetEmailInput = screen.getByLabelText('Email address');
    expect(resetEmailInput).toHaveValue('');
  });

  it('returns to login form when clicking "Back to login"', () => {
    render(<LoginPage />);
    
    // Show forgot password form
    const forgotPasswordButton = screen.getByText('Forgot password?');
    fireEvent.click(forgotPasswordButton);

    expect(screen.getByText('Forgot your password?')).toBeInTheDocument();

    // Go back to login
    const backButton = screen.getByText('← Back to login');
    fireEvent.click(backButton);

    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your account to continue')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('validates email input in forgot password form', () => {
    render(<LoginPage />);
    
    // Show forgot password form
    const forgotPasswordButton = screen.getByText('Forgot password?');
    fireEvent.click(forgotPasswordButton);

    const emailInput = screen.getByLabelText('Email address');
    const submitButton = screen.getByRole('button', { name: 'Send reset link' });

    // Try to submit without email
    fireEvent.click(submitButton);
    
    // HTML5 validation should prevent submission
    expect(emailInput).toBeInvalid();
  });
});
