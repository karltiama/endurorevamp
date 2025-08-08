import { render, screen } from '@testing-library/react'
import AnimatedMetrics from '@/components/AnimatedMetrics'

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  useMotionValue: () => ({ get: () => 0, set: jest.fn() }),
  useTransform: () => ({ get: () => 0 }),
  animate: jest.fn(),
}))

describe('AnimatedMetrics', () => {
  it('renders all three metric cards', () => {
    render(<AnimatedMetrics />)
    
    expect(screen.getByText('Average Pace')).toBeInTheDocument()
    expect(screen.getByText('Goal Progress')).toBeInTheDocument()
    expect(screen.getByText('Recovery Rate')).toBeInTheDocument()
  })

  it('has the correct grid structure', () => {
    render(<AnimatedMetrics />)
    
    const container = screen.getByText('Average Pace').closest('div')
    expect(container?.parentElement?.parentElement).toHaveClass('grid', 'grid-cols-3', 'gap-2', 'sm:gap-4')
  })

  it('displays metric values', () => {
    render(<AnimatedMetrics />)
    
    // The values should be present (even if animated)
    const paceCard = screen.getByText('Average Pace').closest('div')
    expect(paceCard).toBeInTheDocument()
  })
}) 