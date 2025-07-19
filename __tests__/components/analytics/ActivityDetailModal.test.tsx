import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ActivityDetailModal } from '@/components/analytics/ActivityDetailModal'

// Mock the useUnitPreferences hook
jest.mock('@/hooks/useUnitPreferences', () => ({
  useUnitPreferences: () => ({
    preferences: {
      distance: 'km',
      pace: 'min/km'
    }
  })
}))

// Mock fetch for API calls
global.fetch = jest.fn()

describe('ActivityDetailModal', () => {
  const mockActivity = {
    id: 123456,
    name: 'Morning Run',
    sport_type: 'Run',
    start_date: '2024-01-15T08:00:00Z',
    start_date_local: '2024-01-15T08:00:00Z',
    timezone: '(GMT-05:00) America/New_York',
    distance: 5000,
    moving_time: 1800,
    elapsed_time: 1820,
    total_elevation_gain: 50,
    average_speed: 2.78,
    average_heartrate: 150,
    max_heartrate: 170,
    trainer: false,
    commute: false,
    private: false
  }

  const defaultProps = {
    activity: mockActivity,
    onClose: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders activity details correctly', () => {
    render(<ActivityDetailModal {...defaultProps} />)
    
    expect(screen.getByText('Morning Run')).toBeInTheDocument()
    expect(screen.getByText('Run')).toBeInTheDocument()
    expect(screen.getByText('5.0 km')).toBeInTheDocument()
    expect(screen.getByText('30:00')).toBeInTheDocument()
  })

  it('shows effort section with add button when no RPE exists', () => {
    render(<ActivityDetailModal {...defaultProps} />)
    
    expect(screen.getByText('How did this workout feel?')).toBeInTheDocument()
    expect(screen.getByText('Add Effort')).toBeInTheDocument()
    expect(screen.getByText('No effort rating yet. Click "Add Effort" to rate this workout.')).toBeInTheDocument()
  })

  it('shows existing effort when available', () => {
    const activityWithRPE = { ...mockActivity, perceived_exertion: 7 }
    render(<ActivityDetailModal {...defaultProps} activity={activityWithRPE} />)
    
    expect(screen.getByText('Very Hard+')).toBeInTheDocument()
    expect(screen.getByText('Very challenging, minimal talking')).toBeInTheDocument()
    expect(screen.getByText('Edit Effort')).toBeInTheDocument()
  })

  it('opens effort selection when add button is clicked', () => {
    render(<ActivityDetailModal {...defaultProps} />)
    
    const addButton = screen.getByText('Add Effort')
    fireEvent.click(addButton)
    
    expect(screen.getByText('Select the face that best represents how hard this workout felt:')).toBeInTheDocument()
    expect(screen.getByText('😴')).toBeInTheDocument() // Very Easy emoji
    expect(screen.getByText('💀')).toBeInTheDocument() // All Out emoji
    expect(screen.getByText('Save Effort')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('validates effort selection correctly', async () => {
    render(<ActivityDetailModal {...defaultProps} />)
    
    const addButton = screen.getByText('Add Effort')
    fireEvent.click(addButton)
    
    const saveButton = screen.getByText('Save Effort')
    
    // Test no selection
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(screen.getByText('Please select how the workout felt')).toBeInTheDocument()
    })
    
    // Test valid selection
    const moderateButton = screen.getByText('Moderate')
    fireEvent.click(moderateButton)
    fireEvent.click(saveButton)
    
    // Should not show validation error
    expect(screen.queryByText('Please select how the workout felt')).not.toBeInTheDocument()
  })

  it('calls API when saving effort', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, activity: { ...mockActivity, perceived_exertion: 8 } })
    } as Response)

    render(<ActivityDetailModal {...defaultProps} />)
    
    const addButton = screen.getByText('Add Effort')
    fireEvent.click(addButton)
    
    const hardButton = screen.getByText('Hard')
    const saveButton = screen.getByText('Save Effort')
    
    fireEvent.click(hardButton)
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/activities/123456/rpe', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perceived_exertion: 5 })
      })
    })
  })

  it('handles both UUID and bigint activity IDs', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, activity: { ...mockActivity, perceived_exertion: 7 } })
    } as Response)

    // Test with database activity (has strava_activity_id)
    const dbActivity = { ...mockActivity, strava_activity_id: 987654 }
    render(<ActivityDetailModal {...defaultProps} activity={dbActivity} />)
    
    const addButton = screen.getByText('Add RPE')
    fireEvent.click(addButton)
    
    const input = screen.getByPlaceholderText('Enter 1-10')
    const saveButton = screen.getByText('Save')
    
    fireEvent.change(input, { target: { value: '7' } })
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/activities/987654/rpe', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perceived_exertion: 7 })
      })
    })
  })

  it('handles API errors gracefully', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    } as Response)

    render(<ActivityDetailModal {...defaultProps} />)
    
    const addButton = screen.getByText('Add Effort')
    fireEvent.click(addButton)
    
    const moderateButton = screen.getByText('Moderate')
    const saveButton = screen.getByText('Save Effort')
    
    fireEvent.click(moderateButton)
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to save RPE. Please try again.')).toBeInTheDocument()
    })
  })

  it('shows emoji effort scale', () => {
    render(<ActivityDetailModal {...defaultProps} />)
    
    const addButton = screen.getByText('Add Effort')
    fireEvent.click(addButton)
    
    // Check that all emoji options are displayed
    expect(screen.getByText('😴')).toBeInTheDocument() // Very Easy
    expect(screen.getByText('😌')).toBeInTheDocument() // Easy
    expect(screen.getByText('🙂')).toBeInTheDocument() // Moderate
    expect(screen.getByText('😐')).toBeInTheDocument() // Somewhat Hard
    expect(screen.getByText('😤')).toBeInTheDocument() // Hard
    expect(screen.getByText('😰')).toBeInTheDocument() // Very Hard
    expect(screen.getByText('😫')).toBeInTheDocument() // Very Hard+
    expect(screen.getByText('😵')).toBeInTheDocument() // Extremely Hard
    expect(screen.getByText('🤯')).toBeInTheDocument() // Maximum
    expect(screen.getByText('💀')).toBeInTheDocument() // All Out
  })
}) 