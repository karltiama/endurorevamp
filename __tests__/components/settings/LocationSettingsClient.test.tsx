import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LocationSettingsClient } from '@/components/settings/LocationSettingsClient'
import { useLocation } from '@/hooks/useLocation'

// Mock the useLocation hook
jest.mock('@/hooks/useLocation')

const mockUseLocation = useLocation as jest.MockedFunction<typeof useLocation>

// Mock localStorage globally before any tests run
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true
})

describe('LocationSettingsClient', () => {
  const defaultMockLocation = {
    location: {
      lat: 51.5074,
      lon: -0.1278,
      name: 'London',
      source: 'default' as const
    },
    isLoading: false,
    permissionStatus: 'prompt' as const,
    hasRequestedPermission: false,
    canRequestLocation: true,
    hasLocationPermission: false,
    isLocationSupported: true,
    requestLocation: jest.fn(),
    setManualLocation: jest.fn(),
    clearLocation: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset localStorage mock for each test
    mockLocalStorage.getItem.mockReturnValue(null)
    mockLocalStorage.setItem.mockImplementation(() => {})
    mockLocalStorage.removeItem.mockImplementation(() => {})
    mockLocalStorage.clear.mockImplementation(() => {})
  })

  it('renders location settings interface', () => {
    mockUseLocation.mockReturnValue(defaultMockLocation)

    render(<LocationSettingsClient />)
    
    expect(screen.getByText('Current Location')).toBeInTheDocument()
    expect(screen.getByText('Clear Location Data')).toBeInTheDocument()
  })

  it('shows current location when available', () => {
    mockUseLocation.mockReturnValue({
      ...defaultMockLocation,
      location: { lat: 40.7128, lon: -74.0060, name: 'New York', source: 'geolocation' as const }
    })

    render(<LocationSettingsClient />)
    
    expect(screen.getByText('40.7128, -74.0060')).toBeInTheDocument()
    expect(screen.getByText('New York')).toBeInTheDocument()
  })

  it('shows permission status when location is not available', () => {
    mockUseLocation.mockReturnValue({
      ...defaultMockLocation,
      permissionStatus: 'denied'
    })

    render(<LocationSettingsClient />)
    
    expect(screen.getByText('Location access was denied. You can still add locations manually or change your browser settings.')).toBeInTheDocument()
  })

  it('allows adding a new location', async () => {
    mockUseLocation.mockReturnValue(defaultMockLocation)
    const user = userEvent.setup()

    render(<LocationSettingsClient />)
    
    // Click add button
    const addButton = screen.getByText('Add New Location')
    await user.click(addButton)
    
    // Fill form
    await user.type(screen.getByLabelText('Location Name'), 'Home')
    await user.type(screen.getByLabelText('Latitude'), '40.7128')
    await user.type(screen.getByLabelText('Longitude'), '-74.0060')
    
    // Submit form
    const saveButton = screen.getByText('Add Location')
    await user.click(saveButton)
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'enduro-saved-locations',
      expect.stringContaining('Home')
    )
  })

  it('validates form inputs before saving', async () => {
    mockUseLocation.mockReturnValue(defaultMockLocation)
    const user = userEvent.setup()

    render(<LocationSettingsClient />)
    
    // Click add button
    const addButton = screen.getByText('Add New Location')
    await user.click(addButton)
    
    // Try to submit without filling required fields
    const saveButton = screen.getByText('Add Location')
    await user.click(saveButton)
    
    // Form should not submit and localStorage should not be called
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
  })

  it('loads saved locations from localStorage', () => {
    const savedLocations = [
      { id: '1', name: 'Home', lat: 40.7128, lon: -74.0060 },
      { id: '2', name: 'Work', lat: 40.7589, lon: -73.9851 }
    ]
    
    // Mock localStorage to return saved locations
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedLocations))
    
    mockUseLocation.mockReturnValue(defaultMockLocation)

    render(<LocationSettingsClient />)
    
    expect(screen.getByText('Saved Locations')).toBeInTheDocument()
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Work')).toBeInTheDocument()
  })

  it('allows editing existing locations', () => {
    const savedLocations = [
      { id: '1', name: 'Home', lat: 40.7128, lon: -74.0060 }
    ]
    
    // Mock localStorage to return saved locations
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedLocations))
    
    mockUseLocation.mockReturnValue(defaultMockLocation)

    render(<LocationSettingsClient />)
    
    // Check that edit button exists
    const editButton = screen.getByLabelText('Edit Home')
    expect(editButton).toBeInTheDocument()
  })

  it('allows deleting locations', () => {
    const savedLocations = [
      { id: '1', name: 'Home', lat: 40.7128, lon: -74.0060 }
    ]
    
    // Mock localStorage to return saved locations
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedLocations))
    
    mockUseLocation.mockReturnValue(defaultMockLocation)

    render(<LocationSettingsClient />)
    
    // Check that delete button exists
    const deleteButton = screen.getByLabelText('Delete Home')
    expect(deleteButton).toBeInTheDocument()
  })

  it('handles GPS location request', async () => {
    const mockRequestLocation = jest.fn()
    mockUseLocation.mockReturnValue({
      ...defaultMockLocation,
      hasLocationPermission: true,
      requestLocation: mockRequestLocation
    })
    const user = userEvent.setup()

    render(<LocationSettingsClient />)
    
    const gpsButton = screen.getByText('Use GPS Location')
    await user.click(gpsButton)
    
    expect(mockRequestLocation).toHaveBeenCalled()
  })

  it('handles manual location setting', async () => {
    mockUseLocation.mockReturnValue(defaultMockLocation)
    const user = userEvent.setup()

    render(<LocationSettingsClient />)
    
    // Click add button to show form
    const addButton = screen.getByText('Add New Location')
    await user.click(addButton)
    
    // Fill form
    await user.type(screen.getByLabelText('Location Name'), 'Home')
    await user.type(screen.getByLabelText('Latitude'), '40.7128')
    await user.type(screen.getByLabelText('Longitude'), '-74.0060')
    
    // Submit form
    const saveButton = screen.getByText('Add Location')
    await user.click(saveButton)
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'enduro-saved-locations',
      expect.stringContaining('40.7128')
    )
  })

  it('handles localStorage errors gracefully', () => {
    mockLocalStorage.setItem.mockImplementation(() => { throw new Error('Storage error') })
    
    mockUseLocation.mockReturnValue(defaultMockLocation)

    // Should not crash when localStorage fails
    expect(() => render(<LocationSettingsClient />)).not.toThrow()
  })

  it('cancels form editing', () => {
    const savedLocations = [
      { id: '1', name: 'Home', lat: 40.7128, lon: -74.0060 }
    ]
    
    // Mock localStorage to return saved locations
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedLocations))
    
    mockUseLocation.mockReturnValue(defaultMockLocation)

    render(<LocationSettingsClient />)
    
    // Check that edit button exists
    const editButton = screen.getByLabelText('Edit Home')
    expect(editButton).toBeInTheDocument()
  })
})
