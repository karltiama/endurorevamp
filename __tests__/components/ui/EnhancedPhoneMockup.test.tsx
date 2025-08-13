import { render, screen } from '@testing-library/react'
import EnhancedPhoneMockup from '@/components/ui/EnhancedPhoneMockup'

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, width, height, className }: any) => (
    <img src={src} alt={alt} width={width} height={height} className={className} />
  ),
}))

describe('EnhancedPhoneMockup', () => {
  const defaultProps = {
    src: '/test-image.png',
    alt: 'Test phone mockup',
  }

  it('renders with default props', () => {
    render(<EnhancedPhoneMockup {...defaultProps} />)
    
    const image = screen.getByAltText('Test phone mockup')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', '/test-image.png')
  })

  it('renders with custom dimensions', () => {
    render(
      <EnhancedPhoneMockup 
        {...defaultProps} 
        width={800} 
        height={1600} 
      />
    )
    
    const image = screen.getByAltText('Test phone mockup')
    expect(image).toHaveAttribute('width', '800')
    expect(image).toHaveAttribute('height', '1600')
  })

  it('renders with custom badge text', () => {
    render(
      <EnhancedPhoneMockup 
        {...defaultProps} 
        topBadgeText="Custom Top"
        bottomBadgeText="Custom Bottom"
      />
    )
    
    expect(screen.getByText('Custom Top')).toBeInTheDocument()
    expect(screen.getByText('Custom Bottom')).toBeInTheDocument()
  })

  it('hides badges when specified', () => {
    render(
      <EnhancedPhoneMockup 
        {...defaultProps} 
        showTopBadge={false}
        showBottomBadge={false}
      />
    )
    
    expect(screen.queryByText('Mobile Ready')).not.toBeInTheDocument()
    expect(screen.queryByText('Responsive Design')).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <EnhancedPhoneMockup 
        {...defaultProps} 
        className="custom-class"
      />
    )
    
    const container = screen.getByAltText('Test phone mockup').closest('.custom-class')
    expect(container).toBeInTheDocument()
  })

  it('renders with default badges when showTopBadge and showBottomBadge are true', () => {
    render(
      <EnhancedPhoneMockup 
        {...defaultProps} 
        showTopBadge={true}
        showBottomBadge={true}
      />
    )
    
    expect(screen.getByText('Mobile Ready')).toBeInTheDocument()
    expect(screen.getByText('Responsive Design')).toBeInTheDocument()
  })

  it('hides top badge by default', () => {
    render(<EnhancedPhoneMockup {...defaultProps} />)
    
    expect(screen.queryByText('Mobile Ready')).not.toBeInTheDocument()
    expect(screen.getByText('Responsive Design')).toBeInTheDocument()
  })
})
