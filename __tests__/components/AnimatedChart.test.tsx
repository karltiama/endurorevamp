import { render, screen } from '@testing-library/react'
import AnimatedChart from '@/components/AnimatedChart'

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    g: ({ children, ...props }: any) => <g {...props}>{children}</g>,
    path: ({ children, ...props }: any) => <path {...props}>{children}</path>,
    circle: ({ children, ...props }: any) => <circle {...props}>{children}</circle>,
    rect: ({ children, ...props }: any) => <rect {...props}>{children}</rect>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  useMotionValue: () => ({ get: () => 0, set: jest.fn() }),
  useTransform: () => ({ get: () => 0 }),
  animate: jest.fn(),
}))

describe('AnimatedChart', () => {
  it('renders the chart container', () => {
    render(<AnimatedChart />)
    
    expect(screen.getByText('Weekly Performance')).toBeInTheDocument()
  })

  it('has the correct structure', () => {
    render(<AnimatedChart />)
    
    const container = screen.getByText('Weekly Performance').closest('div')
    expect(container?.parentElement?.parentElement).toHaveClass('bg-white', 'rounded-lg', 'border', 'border-gray-200', 'p-4', 'h-32')
  })

  it('contains SVG elements', () => {
    render(<AnimatedChart />)
    
    const svg = document.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })
}) 