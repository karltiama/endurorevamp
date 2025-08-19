import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignupPage from '@/app/auth/signup/page';

// Mock Supabase client
const mockSupabase = {
  auth: {
    signUp: jest.fn(),
    signInWithOAuth: jest.fn(),
  },
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('SignupPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all form fields including name field', () => {
    render(<SignupPage />);

    expect(screen.getByLabelText('Full name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();
  });

  it('renders Google signup button', () => {
    render(<SignupPage />);

    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<SignupPage />);

    // Fill in valid passwords so name validation error shows first
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm password');

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'password123' },
    });

    const form = screen.getByTestId('signup-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Please enter your name')).toBeInTheDocument();
    });
  });

  it('validates password length', async () => {
    render(<SignupPage />);

    const nameInput = screen.getByLabelText('Full name');
    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm password');

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: '123' } });

    const form = screen.getByTestId('signup-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(
        screen.getByText('Password must be at least 6 characters')
      ).toBeInTheDocument();
    });
  });

  it('validates password confirmation', async () => {
    render(<SignupPage />);

    const nameInput = screen.getByLabelText('Full name');
    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm password');

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'different123' },
    });

    const form = screen.getByTestId('signup-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({ error: null });

    render(<SignupPage />);

    const nameInput = screen.getByLabelText('Full name');
    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm password');

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'password123' },
    });

    const form = screen.getByTestId('signup-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: expect.stringContaining('/auth/callback'),
          data: {
            full_name: 'John Doe',
          },
        },
      });
    });

    expect(
      screen.getByText('Check your email for the confirmation link!')
    ).toBeInTheDocument();
  });

  it('handles signup errors', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      error: { message: 'Email already exists' },
    });

    render(<SignupPage />);

    const nameInput = screen.getByLabelText('Full name');
    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm password');

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'password123' },
    });

    const form = screen.getByTestId('signup-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });
  });

  it('handles Google signup', async () => {
    mockSupabase.auth.signInWithOAuth.mockResolvedValue({ error: null });

    render(<SignupPage />);

    const googleButton = screen.getByText('Continue with Google');
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.stringContaining('/auth/callback'),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
    });
  });

  it('handles Google signup errors', async () => {
    mockSupabase.auth.signInWithOAuth.mockResolvedValue({
      error: { message: 'Google signup failed' },
    });

    render(<SignupPage />);

    const googleButton = screen.getByText('Continue with Google');
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(screen.getByText('Google signup failed')).toBeInTheDocument();
    });
  });

  it('trims whitespace from name field', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({ error: null });

    render(<SignupPage />);

    const nameInput = screen.getByLabelText('Full name');
    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm password');

    fireEvent.change(nameInput, { target: { value: '  John Doe  ' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'password123' },
    });

    const form = screen.getByTestId('signup-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: expect.stringContaining('/auth/callback'),
          data: {
            full_name: 'John Doe',
          },
        },
      });
    });
  });

  it('shows loading state during form submission', async () => {
    // Mock a delayed response
    mockSupabase.auth.signUp.mockImplementation(
      () =>
        new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
    );

    render(<SignupPage />);

    const nameInput = screen.getByLabelText('Full name');
    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm password');

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'password123' },
    });

    const form = screen.getByTestId('signup-form');
    fireEvent.submit(form);

    expect(screen.getByText('Creating account...')).toBeInTheDocument();

    // Check that the submit button is disabled
    const submitButton = screen.getByRole('button', {
      name: /creating account/i,
    });
    expect(submitButton).toBeDisabled();
  });
});
