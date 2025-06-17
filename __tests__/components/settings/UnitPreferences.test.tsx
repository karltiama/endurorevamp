import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UnitPreferences } from '@/components/settings/UnitPreferences'

// Mock the useUnitPreferences hook
jest.mock('@/hooks/useUnitPreferences', () => ({
  useUnitPreferences: jest.fn(),
}))

const mockUseUnitPreferences = require('@/hooks/useUnitPreferences').useUnitPreferences

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

describe('UnitPreferences Component', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    jest.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  it('shows loading state when preferences are loading', () => {
    mockUseUnitPreferences.mockReturnValue({
      preferences: { distance: 'km', pace: 'min/km' },
      isLoading: true,
      setDistanceUnit: jest.fn(),
    })

    render(<UnitPreferences userId="user-1" />, { wrapper })

    expect(screen.getByText('Units & Display')).toBeInTheDocument()
    expect(screen.getByText('Choose your preferred units for distances and pace')).toBeInTheDocument()
    
    // Should show loading spinner
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('displays current preferences and allows switching units', async () => {
    const mockSetDistanceUnit = jest.fn().mockResolvedValue(undefined)
    
    mockUseUnitPreferences.mockReturnValue({
      preferences: { distance: 'km', pace: 'min/km' },
      isLoading: false,
      setDistanceUnit: mockSetDistanceUnit,
    })

    render(<UnitPreferences userId="user-1" />, { wrapper })

    // Should show the unit selection buttons
    expect(screen.getByText('Kilometers (km)')).toBeInTheDocument()
    expect(screen.getByText('Miles (mi)')).toBeInTheDocument()
    
    // Should show current settings
    expect(screen.getByText('Current Settings')).toBeInTheDocument()
    expect(screen.getByText('Kilometers (km)')).toBeInTheDocument()
    expect(screen.getByText('min/km')).toBeInTheDocument()
    
    // Should show examples
    expect(screen.getByText('Examples with your settings:')).toBeInTheDocument()
    expect(screen.getByText('• Distance: 5.0 km')).toBeInTheDocument()
    expect(screen.getByText('• Pace: 5:30/km')).toBeInTheDocument()

    // Click to switch to miles
    const milesButton = screen.getByRole('button', { name: /Miles \(mi\)/ })
    fireEvent.click(milesButton)

    await waitFor(() => {
      expect(mockSetDistanceUnit).toHaveBeenCalledWith('miles')
    })
  })

  it('shows miles preferences when set to miles', () => {
    mockUseUnitPreferences.mockReturnValue({
      preferences: { distance: 'miles', pace: 'min/mile' },
      isLoading: false,
      setDistanceUnit: jest.fn(),
    })

    render(<UnitPreferences userId="user-1" />, { wrapper })

    // Should show miles in current settings
    expect(screen.getByText('Miles (mi)')).toBeInTheDocument()
    expect(screen.getByText('min/mile')).toBeInTheDocument()
    
    // Should show examples in miles
    expect(screen.getByText('• Distance: 5.0 mi')).toBeInTheDocument()
    expect(screen.getByText('• Pace: 5:30/mi')).toBeInTheDocument()
    expect(screen.getByText('• Weekly total: 25.0 mi')).toBeInTheDocument()
  })

  it('shows correct active state for buttons', () => {
    mockUseUnitPreferences.mockReturnValue({
      preferences: { distance: 'km', pace: 'min/km' },
      isLoading: false,
      setDistanceUnit: jest.fn(),
    })

    render(<UnitPreferences userId="user-1" />, { wrapper })

    // km button should show active state (check mark)
    const kmButton = screen.getByRole('button', { name: /Kilometers \(km\)/ })
    expect(kmButton).toBeInTheDocument()
    
    // Should show check mark for active option
    expect(document.querySelector('.lucide-check')).toBeInTheDocument()
  })

  it('shows saving state when updating preferences', async () => {
    const mockSetDistanceUnit = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    )
    
    mockUseUnitPreferences.mockReturnValue({
      preferences: { distance: 'km', pace: 'min/km' },
      isLoading: false,
      setDistanceUnit: mockSetDistanceUnit,
    })

    render(<UnitPreferences userId="user-1" />, { wrapper })

    const milesButton = screen.getByRole('button', { name: /Miles \(mi\)/ })
    fireEvent.click(milesButton)

    // Should show saving state
    expect(screen.getByText('Saving preferences...')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(mockSetDistanceUnit).toHaveBeenCalledWith('miles')
    })
  })

  it('handles switching from miles to kilometers', async () => {
    const mockSetDistanceUnit = jest.fn().mockResolvedValue(undefined)
    
    mockUseUnitPreferences.mockReturnValue({
      preferences: { distance: 'miles', pace: 'min/mile' },
      isLoading: false,
      setDistanceUnit: mockSetDistanceUnit,
    })

    render(<UnitPreferences userId="user-1" />, { wrapper })

    const kmButton = screen.getByRole('button', { name: /Kilometers \(km\)/ })
    fireEvent.click(kmButton)

    await waitFor(() => {
      expect(mockSetDistanceUnit).toHaveBeenCalledWith('km')
    })
  })
}) 