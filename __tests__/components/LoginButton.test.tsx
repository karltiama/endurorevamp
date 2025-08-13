import { render, screen } from '@testing-library/react';
import { LoginButton } from '@/components/LoginButton';
import { getStravaAuthUrl } from '@/lib/strava';

// Mock the strava utility function so we don't make real URL calls during tests
jest.mock('@/lib/strava', () => ({
  getStravaAuthUrl: jest.fn(
    () => 'http://localhost:3000/api/auth/strava/callback'
  ),
}));

describe('LoginButton', () => {
  // This test checks if the button shows up with correct text
  it('renders with correct text', () => {
    render(<LoginButton />);

    // screen.getByText finds elements by their text content
    const button = screen.getByText('Login with Strava');
    expect(button).toBeInTheDocument();
  });

  // This test verifies the link has the correct Strava URL
  it('links to the correct Strava authorization URL', () => {
    render(<LoginButton />);

    // getByRole finds elements by their HTML role (link, button, etc)
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute(
      'href',
      'http://localhost:3000/api/auth/strava/callback'
    );
  });

  // This test checks if the button has the correct styling
  it('has the correct button styling', () => {
    render(<LoginButton />);

    const button = screen.getByRole('link');
    // Check for shadcn/ui button classes
    expect(button).toHaveClass('inline-flex', 'items-center');
  });
});
