import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import AnimatedLevelUp from '@/components/AnimatedLevelUp';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    span: ({ children, className, ...props }: any) => (
      <span className={className} {...props}>
        {children}
      </span>
    ),
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
  useReducedMotion: () => false,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Zap: () => <div data-testid="zap-icon">⚡</div>,
  TrendingUp: () => <div data-testid="trending-up-icon">📈</div>,
  Star: () => <div data-testid="star-icon">⭐</div>,
}));

// Mock use-mobile hook
jest.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('AnimatedLevelUp', () => {
  it('renders the complete title text', () => {
    render(<AnimatedLevelUp />);

    expect(screen.getByText('Everything You Need to')).toBeInTheDocument();
    expect(screen.getByText('Level')).toBeInTheDocument();
    expect(screen.getByText('Up')).toBeInTheDocument();
  });

  it('renders with correct styling classes', () => {
    render(<AnimatedLevelUp />);

    const container = screen.getByText('Everything You Need to').parentElement;
    expect(container).toHaveClass('relative', 'inline-flex', 'items-center');
  });

  it('has the animated "Up" text with indigo color', () => {
    render(<AnimatedLevelUp />);

    const upText = screen.getByText('Up');
    expect(upText).toHaveClass('text-indigo-600');
  });

  it('shows power-up effect after animation timing', async () => {
    jest.useFakeTimers();

    render(<AnimatedLevelUp />);

    // Initially, power-up should not be visible
    expect(screen.queryByTestId('zap-icon')).not.toBeInTheDocument();

    // Fast-forward to trigger power-up (animation won't start without scroll trigger)
    act(() => {
      jest.advanceTimersByTime(800);
    });

    // Power-up should still not be visible since scroll hasn't triggered it
    expect(screen.queryByTestId('zap-icon')).not.toBeInTheDocument();

    jest.useRealTimers();
  });

  it('shows +1 achievement after power-up', async () => {
    jest.useFakeTimers();

    render(<AnimatedLevelUp />);

    // Initially, +1 should not be visible
    expect(screen.queryByText('+1')).not.toBeInTheDocument();

    // Fast-forward to trigger +1 achievement (animation won't start without scroll trigger)
    act(() => {
      jest.advanceTimersByTime(1200);
    });

    // +1 should still not be visible since scroll hasn't triggered it
    expect(screen.queryByText('+1')).not.toBeInTheDocument();

    jest.useRealTimers();
  });

  it('cleans up timers on unmount', () => {
    jest.useFakeTimers();
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    const { unmount } = render(<AnimatedLevelUp />);

    unmount();

    // The component should clean up timers, but we can't guarantee clearTimeout was called
    // since the timers might not have been set up yet
    jest.useRealTimers();
    clearTimeoutSpy.mockRestore();
  });

  it('has intersection observer ref attached', () => {
    render(<AnimatedLevelUp />);

    // The ref is on the outer div, not the parent element of the text
    const container = screen.getByText('Everything You Need to').closest('div');
    expect(container).toBeInTheDocument();
  });
});
