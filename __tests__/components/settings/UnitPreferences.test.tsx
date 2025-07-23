import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import UnitPreferences from '@/components/settings/UnitPreferences'

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
      preferences: { distance: 'km', pace: 'min/km', temperature: 'celsius' },
      isLoading: true,
      setDistanceUnit: jest.fn(),
      toggleUnits: jest.fn(),
      updatePreferences: jest.fn(),
    })

    render(<UnitPreferences />, { wrapper })

    expect(screen.getByText('Units & Display')).toBeInTheDocument()
    expect(screen.getByText('Choose your preferred units for distances and pace')).toBeInTheDocument()
    
    // Should show loading animation
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('displays current preferences and allows switching units', async () => {
    const mockToggleUnits = jest.fn().mockResolvedValue(undefined)
    
    mockUseUnitPreferences.mockReturnValue({
      preferences: { distance: 'km', pace: 'min/km', temperature: 'celsius' },
      isLoading: false,
      setDistanceUnit: jest.fn(),
      toggleUnits: mockToggleUnits,
      updatePreferences: jest.fn(),
    })

    render(<UnitPreferences />, { wrapper })

    // Should show the unit selection buttons
    expect(screen.getByText('Kilometers (km)')).toBeInTheDocument()
    expect(screen.getByText('Miles (mi)')).toBeInTheDocument()
    
    // Should show current settings
    expect(screen.getByText('Current Settings')).toBeInTheDocument()
    expect(screen.getByText('Distance: Kilometers (km)')).toBeInTheDocument()
    expect(screen.getByText('Pace: min/km')).toBeInTheDocument()
    expect(screen.getByText('Temperature: Celsius (°C)')).toBeInTheDocument()
    
    // Should show examples
    expect(screen.getByText('Examples with current setting:')).toBeInTheDocument()
    expect(screen.getByText('• Distance: 5 km')).toBeInTheDocument()
    expect(screen.getByText('• Pace: 5:00/km (5:00 per km converted)')).toBeInTheDocument()
    expect(screen.getByText('• Temperature: 15°C')).toBeInTheDocument()

    // Click to switch to miles
    const milesButton = screen.getByRole('button', { name: /Miles \(mi\)/ })
    fireEvent.click(milesButton)

    await waitFor(() => {
      expect(mockToggleUnits).toHaveBeenCalled()
    })
  })

  it('shows miles preferences when set to miles', () => {
    mockUseUnitPreferences.mockReturnValue({
      preferences: { distance: 'miles', pace: 'min/mile', temperature: 'fahrenheit' },
      isLoading: false,
      setDistanceUnit: jest.fn(),
      toggleUnits: jest.fn(),
      updatePreferences: jest.fn(),
    })

    render(<UnitPreferences />, { wrapper })

    // Should show miles in current settings
    expect(screen.getByText('Distance: Miles (mi)')).toBeInTheDocument()
    expect(screen.getByText('Pace: min/mile')).toBeInTheDocument()
    expect(screen.getByText('Temperature: Fahrenheit (°F)')).toBeInTheDocument()
    
    // Should show examples in miles
    expect(screen.getByText('• Distance: 3.1 mi')).toBeInTheDocument()
    expect(screen.getByText('• Pace: 8:02/mi (5:00 per km converted)')).toBeInTheDocument()
    expect(screen.getByText('• Temperature: 59°F')).toBeInTheDocument()
    expect(screen.getByText('• Long run: 13.1 mi')).toBeInTheDocument()
  })

  it('shows correct active state for buttons', () => {
    mockUseUnitPreferences.mockReturnValue({
      preferences: { distance: 'km', pace: 'min/km', temperature: 'celsius' },
      isLoading: false,
      setDistanceUnit: jest.fn(),
      toggleUnits: jest.fn(),
      updatePreferences: jest.fn(),
    })

    render(<UnitPreferences />, { wrapper })

    // km button should show active state (check mark)
    const kmButton = screen.getByRole('button', { name: /Kilometers \(km\)/ })
    expect(kmButton).toBeInTheDocument()
    
    // Should show check mark for active option
    expect(document.querySelector('svg')).toBeInTheDocument()
  })

  it('allows clicking on unit buttons', async () => {
    const mockToggleUnits = jest.fn().mockResolvedValue(undefined)
    
    mockUseUnitPreferences.mockReturnValue({
      preferences: { distance: 'km', pace: 'min/km', temperature: 'celsius' },
      isLoading: false,
      setDistanceUnit: jest.fn(),
      toggleUnits: mockToggleUnits,
      updatePreferences: jest.fn(),
    })

    render(<UnitPreferences />, { wrapper })

    const milesButton = screen.getByRole('button', { name: /Miles \(mi\)/ })
    fireEvent.click(milesButton)
    
    await waitFor(() => {
      expect(mockToggleUnits).toHaveBeenCalled()
    })
  })

  it('handles switching from miles to kilometers', async () => {
    const mockToggleUnits = jest.fn().mockResolvedValue(undefined)
    
    mockUseUnitPreferences.mockReturnValue({
      preferences: { distance: 'miles', pace: 'min/mile', temperature: 'fahrenheit' },
      isLoading: false,
      setDistanceUnit: jest.fn(),
      toggleUnits: mockToggleUnits,
      updatePreferences: jest.fn(),
    })

    render(<UnitPreferences />, { wrapper })

    const kmButton = screen.getByRole('button', { name: /Kilometers \(km\)/ })
    fireEvent.click(kmButton)

    await waitFor(() => {
      expect(mockToggleUnits).toHaveBeenCalled()
    })
  })
}) 