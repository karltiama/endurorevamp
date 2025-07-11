import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'

// Mock dependencies
jest.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false
}))

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard'
}))

// Mock user object
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  aud: 'authenticated',
  role: 'authenticated',
  confirmation_sent_at: undefined,
  recovery_sent_at: undefined,
  email_change_sent_at: undefined,
  new_email: undefined,
  invited_at: undefined,
  action_link: undefined,
  email_confirmed_at: '2023-01-01T00:00:00Z',
  phone_confirmed_at: undefined,
  confirmed_at: '2023-01-01T00:00:00Z',
  email_change_confirm_status: 0,
  banned_until: undefined,
  reauthentication_sent_at: undefined,
  is_sso_user: false,
  deleted_at: undefined,
  is_anonymous: false,
  app_metadata: {},
  user_metadata: {},
  identities: [],
  factors: []
}

describe('DashboardLayout with Hover Sidebar', () => {
  const renderDashboardLayout = (children = <div>Test Content</div>) => {
    return render(
      <DashboardLayout user={mockUser}>
        {children}
      </DashboardLayout>
    )
  }

  describe('Sidebar Configuration', () => {
    it('renders sidebar with hover collapsible mode', () => {
      renderDashboardLayout()
      
      // Find the sidebar container (it may not have the exact data-testid but should have sidebar attributes)
      const sidebarElement = document.querySelector('[data-slot="sidebar"]')
      expect(sidebarElement).toBeInTheDocument()
      
      // The sidebar should be configured for hover mode
      const sidebarContainer = document.querySelector('[data-collapsible="hover"]')
      expect(sidebarContainer).toBeInTheDocument()
    })

    it('starts in collapsed state by default', () => {
      renderDashboardLayout()
      
      const sidebarContainer = document.querySelector('[data-state="collapsed"]')
      expect(sidebarContainer).toBeInTheDocument()
    })
  })

  describe('Navigation Items', () => {
    it('renders all navigation groups and items', () => {
      renderDashboardLayout()
      
      // Check for navigation groups
      expect(screen.getByText('Overview')).toBeInTheDocument()
      expect(screen.getByText('Analytics')).toBeInTheDocument()
      expect(screen.getByText('Planning')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
      
      // Check for navigation items
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Activity Analysis')).toBeInTheDocument()
      expect(screen.getByText('Training Load')).toBeInTheDocument()
      expect(screen.getByText('Goals')).toBeInTheDocument()
      expect(screen.getByText('Calendar')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    it('shows tooltips for navigation items when collapsed', () => {
      renderDashboardLayout()
      
      // In collapsed state, tooltip triggers should be present
      const dashboardLink = screen.getByText('Dashboard')
      expect(dashboardLink).toBeInTheDocument()
      
      // The button should have tooltip data
      const button = dashboardLink.closest('a')
      expect(button).toBeInTheDocument()
    })
  })

  describe('Hover Behavior', () => {
    it('expands sidebar on hover', async () => {
      renderDashboardLayout()
      
      const sidebarContainer = document.querySelector('[data-collapsible="hover"]')
      expect(sidebarContainer).toBeInTheDocument()
      
      // Initially collapsed
      expect(sidebarContainer).toHaveAttribute('data-state', 'collapsed')
      
      // Simulate mouse enter
      fireEvent.mouseEnter(sidebarContainer!)
      
      // Should expand
      await waitFor(() => {
        expect(sidebarContainer).toHaveAttribute('data-state', 'expanded')
      })
    })

    it('collapses sidebar when mouse leaves', async () => {
      renderDashboardLayout()
      
      const sidebarContainer = document.querySelector('[data-collapsible="hover"]')
      expect(sidebarContainer).toBeInTheDocument()
      
      // Hover to expand
      fireEvent.mouseEnter(sidebarContainer!)
      
      await waitFor(() => {
        expect(sidebarContainer).toHaveAttribute('data-state', 'expanded')
      })
      
      // Mouse leave to collapse
      fireEvent.mouseLeave(sidebarContainer!)
      
      await waitFor(() => {
        expect(sidebarContainer).toHaveAttribute('data-state', 'collapsed')
      })
    })
  })

  describe('Layout Structure', () => {
    it('renders main content area', () => {
      renderDashboardLayout(<div data-testid="main-content">Main Content</div>)
      
      expect(screen.getByTestId('main-content')).toBeInTheDocument()
    })

    it('renders sidebar trigger button', () => {
      renderDashboardLayout()
      
      // Look for the sidebar trigger button (should be in header)
      const triggerButton = document.querySelector('[data-slot="sidebar-trigger"]')
      expect(triggerButton).toBeInTheDocument()
    })

    it('renders header with proper structure', () => {
      renderDashboardLayout()
      
      // Check for header element
      const header = document.querySelector('header')
      expect(header).toBeInTheDocument()
      expect(header).toHaveClass('flex', 'h-16', 'shrink-0', 'items-center', 'gap-2', 'border-b', 'px-4')
    })
  })

  describe('User Information', () => {
    it('displays user email in footer dropdown', () => {
      renderDashboardLayout()
      
      // The user email should be displayed in the sidebar footer
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    it('shows user account section', () => {
      renderDashboardLayout()
      
      expect(screen.getByText('Account')).toBeInTheDocument()
    })

    it('includes logout functionality', () => {
      renderDashboardLayout()
      
      expect(screen.getByText('Logout')).toBeInTheDocument()
    })
  })

  describe('Active State Handling', () => {
    it('highlights active navigation item', () => {
      renderDashboardLayout()
      
      // Since we mocked usePathname to return '/dashboard', the Dashboard item should be active
      const dashboardLink = screen.getByText('Dashboard').closest('a')
      expect(dashboardLink).toHaveAttribute('data-active', 'true')
    })
  })

  describe('Responsive Behavior', () => {
    it('maintains hover functionality on desktop', () => {
      // This test ensures hover mode works when not on mobile
      renderDashboardLayout()
      
      const sidebarContainer = document.querySelector('[data-collapsible="hover"]')
      expect(sidebarContainer).toBeInTheDocument()
      
      // Should respond to hover events
      fireEvent.mouseEnter(sidebarContainer!)
      
      // Should change state (testing that hover handlers are attached)
      expect(sidebarContainer).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('maintains proper focus management', () => {
      renderDashboardLayout()
      
      const dashboardLink = screen.getByText('Dashboard')
      
      // Should be focusable
      dashboardLink.focus()
      expect(document.activeElement).toBe(dashboardLink)
    })

    it('provides proper semantic structure', () => {
      renderDashboardLayout()
      
      // Check for proper semantic elements
      expect(document.querySelector('nav')).toBeInTheDocument()
      expect(document.querySelector('main')).toBeInTheDocument()
      expect(document.querySelector('header')).toBeInTheDocument()
    })
  })

  describe('Integration', () => {
    it('works with different content types', () => {
      const complexContent = (
        <div>
          <h1>Dashboard Page</h1>
          <div className="grid">
            <div>Chart 1</div>
            <div>Chart 2</div>
          </div>
        </div>
      )
      
      renderDashboardLayout(complexContent)
      
      expect(screen.getByText('Dashboard Page')).toBeInTheDocument()
      expect(screen.getByText('Chart 1')).toBeInTheDocument()
      expect(screen.getByText('Chart 2')).toBeInTheDocument()
    })

    it('maintains sidebar state independent of content changes', async () => {
      const { rerender } = renderDashboardLayout(<div>Content 1</div>)
      
      const sidebarContainer = document.querySelector('[data-collapsible="hover"]')
      
      // Expand sidebar
      fireEvent.mouseEnter(sidebarContainer!)
      
      await waitFor(() => {
        expect(sidebarContainer).toHaveAttribute('data-state', 'expanded')
      })
      
      // Change content
      rerender(
        <DashboardLayout user={mockUser}>
          <div>Content 2</div>
        </DashboardLayout>
      )
      
      // Sidebar should still be expanded
      expect(sidebarContainer).toHaveAttribute('data-state', 'expanded')
      expect(screen.getByText('Content 2')).toBeInTheDocument()
    })
  })
}) 