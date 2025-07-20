import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ActivityDetailModal } from '@/components/analytics/ActivityDetailModal'

// Mock the useUnitPreferences hook
const mockUseUnitPreferences = jest.fn()

jest.mock('@/hooks/useUnitPreferences', () => ({
  useUnitPreferences: () => mockUseUnitPreferences()
}))

// Mock the fetch function
global.fetch = jest.fn()

const mockActivity = {
  id: 123456789,
  name: 'Morning Run',
  sport_type: 'Run',
  distance: 5000, // 5km in meters
  moving_time: 1800, // 30 minutes in seconds
  elapsed_time: 1900,
  total_elevation_gain: 50,
  average_speed: 2.78, // 10 km/h in m/s
  max_speed: 3.33, // 12 km/h in m/s
  average_heartrate: 150,
  max_heartrate: 175,
  average_watts: 200,
  max_watts: 250,
  average_cadence: 180,
  kilojoules: 450,
  kudos_count: 5,
  achievement_count: 2,
  start_date: '2024-01-15T06:00:00Z',
  start_date_local: '2024-01-15T06:00:00Z',
  timezone: 'America/New_York',
  trainer: false,
  commute: false,
  private: false
}

describe('ActivityDetailModal', () => {
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseUnitPreferences.mockReturnValue({
      preferences: {
        distance: 'km',
        pace: 'min/km'
      }
    })
  })

  it('renders activity details correctly', () => {
    render(<ActivityDetailModal activity={mockActivity} onClose={mockOnClose} />)
    
    expect(screen.getByText('Morning Run')).toBeInTheDocument()
    expect(screen.getAllByText('Run')).toHaveLength(2) // Badge and type
    expect(screen.getByText('5.0 km')).toBeInTheDocument()
    expect(screen.getByText('30:00')).toBeInTheDocument()
  })

  it('displays pace for running activities', () => {
    render(<ActivityDetailModal activity={mockActivity} onClose={mockOnClose} />)
    
    // 30 minutes for 5km = 6:00/km pace
    expect(screen.getByText('6:00/km')).toBeInTheDocument()
  })

  it('displays speed with proper unit conversion', () => {
    render(<ActivityDetailModal activity={mockActivity} onClose={mockOnClose} />)
    
    // 2.78 m/s = 10.0 km/h
    expect(screen.getByText('10.0 km/h')).toBeInTheDocument()
  })

  it('displays max speed when available', () => {
    render(<ActivityDetailModal activity={mockActivity} onClose={mockOnClose} />)
    
    // 3.33 m/s = 12.0 km/h
    expect(screen.getByText('12.0 km/h')).toBeInTheDocument()
  })

  it('displays power metrics when available', () => {
    render(<ActivityDetailModal activity={mockActivity} onClose={mockOnClose} />)
    
    expect(screen.getByText('200w')).toBeInTheDocument() // Average power
    expect(screen.getByText('250w')).toBeInTheDocument() // Max power
    expect(screen.getByText('450 kJ')).toBeInTheDocument() // Work
  })

  it('displays cadence when available', () => {
    render(<ActivityDetailModal activity={mockActivity} onClose={mockOnClose} />)
    
    expect(screen.getByText('180 spm')).toBeInTheDocument()
  })

  it('displays heart rate metrics', () => {
    render(<ActivityDetailModal activity={mockActivity} onClose={mockOnClose} />)
    
    expect(screen.getByText('150 bpm')).toBeInTheDocument() // Average HR
    expect(screen.getByText('175 bpm')).toBeInTheDocument() // Max HR
  })

  it('displays elevation gain', () => {
    render(<ActivityDetailModal activity={mockActivity} onClose={mockOnClose} />)
    
    expect(screen.getByText('50m')).toBeInTheDocument()
  })

  it('displays social metrics', () => {
    render(<ActivityDetailModal activity={mockActivity} onClose={mockOnClose} />)
    
    expect(screen.getByText('5')).toBeInTheDocument() // Kudos
    expect(screen.getByText('2')).toBeInTheDocument() // Achievements
  })

  it('converts to miles when user preference is miles', () => {
    mockUseUnitPreferences.mockReturnValue({
      preferences: {
        distance: 'miles',
        pace: 'min/mile'
      }
    })

    render(<ActivityDetailModal activity={mockActivity} onClose={mockOnClose} />)
    
    // 5km = 3.1 miles
    expect(screen.getByText('3.1 mi')).toBeInTheDocument()
    // Pace should be converted to min/mile (30 min for 5km = 6:00/km = 9:39/mile)
    expect(screen.getByText('9:39/mi')).toBeInTheDocument()
    // Speed should be converted to mph (10 km/h = 6.2 mph)
    expect(screen.getByText('6.2 mph')).toBeInTheDocument()
  })

  it('does not display pace for non-running activities', () => {
    const cyclingActivity = { ...mockActivity, sport_type: 'Ride' }
    
    render(<ActivityDetailModal activity={cyclingActivity} onClose={mockOnClose} />)
    
    expect(screen.queryByText(/Average Pace/)).not.toBeInTheDocument()
  })

  it('handles missing optional metrics gracefully', () => {
    const minimalActivity = {
      id: 123,
      name: 'Simple Activity',
      sport_type: 'Walk',
      distance: 1000,
      moving_time: 600,
      elapsed_time: 600,
      total_elevation_gain: 0,
      start_date: '2024-01-15T06:00:00Z',
      start_date_local: '2024-01-15T06:00:00Z',
      timezone: 'America/New_York'
    }

    render(<ActivityDetailModal activity={minimalActivity} onClose={mockOnClose} />)
    
    expect(screen.getByText('Simple Activity')).toBeInTheDocument()
    expect(screen.getByText('1.0 km')).toBeInTheDocument()
    expect(screen.getByText('10:00')).toBeInTheDocument()
    
    // Should not display optional metrics
    expect(screen.queryByText(/Average Pace/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Average Speed/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Average Heart Rate/)).not.toBeInTheDocument()
  })

  it('closes modal when close button is clicked', () => {
    render(<ActivityDetailModal activity={mockActivity} onClose={mockOnClose} />)
    
    const closeButton = screen.getByRole('button', { name: '' })
    fireEvent.click(closeButton)
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  describe('RPE functionality', () => {
    it('shows RPE section', () => {
      render(<ActivityDetailModal activity={mockActivity} onClose={mockOnClose} />)
      
      expect(screen.getByText('How did this workout feel?')).toBeInTheDocument()
    })

    it('allows adding RPE rating', async () => {
      render(<ActivityDetailModal activity={mockActivity} onClose={mockOnClose} />)
      
      const addButton = screen.getByText('Add Effort')
      fireEvent.click(addButton)
      
      // Should show emoji grid
      expect(screen.getByText('Very Easy')).toBeInTheDocument()
      expect(screen.getByText('All Out')).toBeInTheDocument()
    })

    it('saves RPE rating successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      render(<ActivityDetailModal activity={mockActivity} onClose={mockOnClose} />)
      
      const addButton = screen.getByText('Add Effort')
      fireEvent.click(addButton)
      
      // Select an RPE rating
      const moderateButton = screen.getByText('Moderate')
      fireEvent.click(moderateButton)
      
      // Save the rating
      const saveButton = screen.getByText('Save Effort')
      fireEvent.click(saveButton)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/activities/123456789/rpe',
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({ perceived_exertion: 3 })
          })
        )
      })
    })
  })
}) 