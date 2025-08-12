import { render, screen } from '@testing-library/react'
import EnhancedFeaturesSection from '@/components/EnhancedFeaturesSection'

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />
  },
}))

describe('EnhancedFeaturesSection', () => {
  it('renders the section header correctly', () => {
    render(<EnhancedFeaturesSection />)
    
    expect(screen.getByText('Real Features, Real Results')).toBeInTheDocument()
    expect(screen.getByText('See Your Running Data Come to Life')).toBeInTheDocument()
    expect(screen.getByText(/These aren't mockups/)).toBeInTheDocument()
  })

  it('renders all feature cards', () => {
    render(<EnhancedFeaturesSection />)
    
    expect(screen.getByText('Training Load Analysis')).toBeInTheDocument()
    expect(screen.getByText('Performance Trends')).toBeInTheDocument()
    expect(screen.getByText('Activity Analytics')).toBeInTheDocument()
    expect(screen.getByText('Smart Goal Tracking')).toBeInTheDocument()
    expect(screen.getByText('Achievements & Streaks')).toBeInTheDocument()
    expect(screen.getByText('Mobile Dashboard')).toBeInTheDocument()
  })

  it('renders feature descriptions', () => {
    render(<EnhancedFeaturesSection />)
    
    expect(screen.getByText(/Track your training stress and recovery/)).toBeInTheDocument()
    expect(screen.getByText(/Visualize pace, heart rate, and cadence trends/)).toBeInTheDocument()
    expect(screen.getByText(/Deep dive into your runs/)).toBeInTheDocument()
  })

  it('renders feature bullet points', () => {
    render(<EnhancedFeaturesSection />)
    
    expect(screen.getByText('Weekly training stress')).toBeInTheDocument()
    expect(screen.getByText('Recovery tracking')).toBeInTheDocument()
    expect(screen.getByText('Pace progression')).toBeInTheDocument()
    expect(screen.getByText('Progress tracking')).toBeInTheDocument()
  })

  it('renders call to action section', () => {
    render(<EnhancedFeaturesSection />)
    
    expect(screen.getByText('Ready to See These Features in Action?')).toBeInTheDocument()
    expect(screen.getByText('Start Free Trial')).toBeInTheDocument()
    expect(screen.getByText('View Demo')).toBeInTheDocument()
  })

  it('renders live feature badges', () => {
    render(<EnhancedFeaturesSection />)
    
    const liveBadges = screen.getAllByText('Live Feature')
    expect(liveBadges).toHaveLength(6) // One for each feature
  })

  it('renders screenshot placeholders', () => {
    render(<EnhancedFeaturesSection />)
    
    const placeholders = screen.getAllByText('Screenshot Placeholder')
    expect(placeholders).toHaveLength(6) // One for each feature
  })
})
