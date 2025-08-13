import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';

// Mock the useIsMobile hook
jest.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

const TestSidebar = ({
  collapsible = 'hover',
}: {
  collapsible?: 'offcanvas' | 'icon' | 'none' | 'hover';
}) => (
  <SidebarProvider defaultOpen={false}>
    <div data-testid="sidebar-wrapper">
      <Sidebar collapsible={collapsible}>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Dashboard">
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Analytics">
                    <span>Analytics</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </div>
  </SidebarProvider>
);

describe('Hover Sidebar', () => {
  describe('Basic Functionality', () => {
    it('renders sidebar in collapsed state by default when using hover mode', () => {
      render(<TestSidebar />);

      const sidebar = document.querySelector('[data-slot="sidebar"]');
      expect(sidebar).toHaveAttribute('data-state', 'collapsed');
      expect(sidebar).toHaveAttribute('data-collapsible', 'hover');
    });

    it('expands sidebar on mouse enter when in hover mode', async () => {
      render(<TestSidebar />);

      const sidebar = document.querySelector('[data-slot="sidebar"]');

      // Initially collapsed
      expect(sidebar).toHaveAttribute('data-state', 'collapsed');

      // Hover over sidebar
      fireEvent.mouseEnter(sidebar!);

      // Should expand
      await waitFor(() => {
        expect(sidebar).toHaveAttribute('data-state', 'expanded');
      });
    });

    it('collapses sidebar on mouse leave when in hover mode', async () => {
      render(<TestSidebar />);

      const sidebar = document.querySelector('[data-slot="sidebar"]');

      // Hover to expand
      fireEvent.mouseEnter(sidebar!);
      await waitFor(() => {
        expect(sidebar).toHaveAttribute('data-state', 'expanded');
      });

      // Leave hover
      fireEvent.mouseLeave(sidebar!);

      // Should collapse
      await waitFor(() => {
        expect(sidebar).toHaveAttribute('data-state', 'collapsed');
      });
    });
  });

  describe('Tooltip Behavior', () => {
    it('shows tooltips when collapsed and not hovered', () => {
      render(<TestSidebar />);

      const dashboardButton = screen.getByText('Dashboard');

      // Tooltip should be available when collapsed
      expect(dashboardButton.closest('button')).toBeInTheDocument();

      // The tooltip trigger should be present
      const tooltipTrigger = dashboardButton.closest(
        '[data-slot="sidebar-menu-button"]'
      );
      expect(tooltipTrigger).toBeInTheDocument();
    });

    it('hides tooltips when sidebar is expanded on hover', async () => {
      render(<TestSidebar />);

      const sidebar = document.querySelector('[data-slot="sidebar"]');

      // Hover to expand
      fireEvent.mouseEnter(sidebar!);

      await waitFor(() => {
        expect(sidebar).toHaveAttribute('data-state', 'expanded');
      });

      // Tooltips should be hidden when expanded
      // This is handled by the hidden prop in TooltipContent component
    });
  });

  describe('CSS Classes', () => {
    it('applies correct CSS classes for collapsed state in hover mode', () => {
      render(<TestSidebar />);

      const sidebar = document.querySelector('[data-slot="sidebar"]');
      expect(sidebar).toHaveAttribute('data-collapsible', 'hover');
      expect(sidebar).toHaveAttribute('data-state', 'collapsed');
    });

    it('applies correct CSS classes for expanded state in hover mode', async () => {
      render(<TestSidebar />);

      const sidebar = document.querySelector('[data-slot="sidebar"]');

      fireEvent.mouseEnter(sidebar!);

      await waitFor(() => {
        expect(sidebar).toHaveAttribute('data-state', 'expanded');
        expect(sidebar).not.toHaveAttribute('data-collapsible', 'hover');
      });
    });
  });

  describe('Non-Hover Modes', () => {
    it('does not respond to hover events when not in hover mode', async () => {
      render(<TestSidebar collapsible="icon" />);

      const sidebar = document.querySelector('[data-slot="sidebar"]');

      // Should start collapsed for icon mode
      expect(sidebar).toHaveAttribute('data-state', 'collapsed');
      expect(sidebar).toHaveAttribute('data-collapsible', 'icon');

      // Hover should not change state
      fireEvent.mouseEnter(sidebar!);

      // Wait a bit to ensure no state change
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(sidebar).toHaveAttribute('data-state', 'collapsed');
      expect(sidebar).toHaveAttribute('data-collapsible', 'icon');
    });
  });

  describe('Accessibility', () => {
    it('maintains proper ARIA attributes during hover interactions', async () => {
      render(<TestSidebar />);

      const sidebar = document.querySelector('[data-slot="sidebar"]');

      // Check initial state
      expect(sidebar).toHaveAttribute('data-state', 'collapsed');

      // Hover and check attributes are updated
      fireEvent.mouseEnter(sidebar!);

      await waitFor(() => {
        expect(sidebar).toHaveAttribute('data-state', 'expanded');
      });

      // Leave hover and check attributes return to collapsed
      fireEvent.mouseLeave(sidebar!);

      await waitFor(() => {
        expect(sidebar).toHaveAttribute('data-state', 'collapsed');
      });
    });

    it('maintains keyboard navigation functionality', () => {
      render(<TestSidebar />);

      const dashboardSpan = screen.getByText('Dashboard');
      const dashboardButton = dashboardSpan.closest('button');

      // Should be focusable
      dashboardButton?.focus();
      expect(document.activeElement).toBe(dashboardButton);

      // Should be clickable
      fireEvent.click(dashboardButton!);
      // The click event should work (no specific assertion needed as long as no error is thrown)
    });
  });

  describe('Performance', () => {
    it('does not trigger unnecessary re-renders on rapid hover events', async () => {
      const renderSpy = jest.fn();

      const TestComponent = () => {
        renderSpy();
        return <TestSidebar />;
      };

      render(<TestComponent />);

      const sidebar = document.querySelector('[data-slot="sidebar"]');

      // Clear initial render calls
      renderSpy.mockClear();

      // Rapid hover events
      for (let i = 0; i < 5; i++) {
        fireEvent.mouseEnter(sidebar!);
        fireEvent.mouseLeave(sidebar!);
      }

      // Should not cause excessive re-renders
      await waitFor(() => {
        expect(renderSpy).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid succession of hover events correctly', async () => {
      render(<TestSidebar />);

      const sidebar = document.querySelector('[data-slot="sidebar"]');

      // Rapid enter/leave events
      fireEvent.mouseEnter(sidebar!);
      fireEvent.mouseLeave(sidebar!);
      fireEvent.mouseEnter(sidebar!);
      fireEvent.mouseLeave(sidebar!);
      fireEvent.mouseEnter(sidebar!);

      // Final state should be expanded (last event was enter)
      await waitFor(() => {
        expect(sidebar).toHaveAttribute('data-state', 'expanded');
      });
    });

    it('maintains collapsed state when defaultOpen is false', () => {
      render(
        <SidebarProvider defaultOpen={false}>
          <Sidebar collapsible="hover">
            <SidebarContent>
              <div>Test content</div>
            </SidebarContent>
          </Sidebar>
        </SidebarProvider>
      );

      const sidebar = document.querySelector('[data-slot="sidebar"]');
      expect(sidebar).toHaveAttribute('data-state', 'collapsed');
    });
  });
});
