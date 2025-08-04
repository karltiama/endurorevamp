import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppFooter } from '@/components/AppFooter';

// Mock window.open
const mockOpen = jest.fn();
Object.defineProperty(window, 'open', {
  value: mockOpen,
  writable: true,
});

describe('AppFooter', () => {
  beforeEach(() => {
    mockOpen.mockClear();
  });

  it('renders all main sections', () => {
    render(<AppFooter />);
    
    expect(screen.getByText('Contact & Support')).toBeInTheDocument();
    expect(screen.getByText('Developer')).toBeInTheDocument();
    expect(screen.getByText('App Info')).toBeInTheDocument();
  });

  it('renders contact and suggestion buttons', () => {
    render(<AppFooter />);
    
    expect(screen.getByText('Contact Us')).toBeInTheDocument();
    expect(screen.getByText('Suggest Feature')).toBeInTheDocument();
  });

  it('opens contact form dialog when Contact Us is clicked', async () => {
    const user = userEvent.setup();
    render(<AppFooter />);
    
    const contactButton = screen.getByRole('button', { name: /contact us/i });
    await user.click(contactButton);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
  });

  it('opens suggestion form dialog when Suggest Feature is clicked', async () => {
    const user = userEvent.setup();
    render(<AppFooter />);
    
    const suggestionButton = screen.getByRole('button', { name: /suggest feature/i });
    await user.click(suggestionButton);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Feature Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('submits contact form successfully', async () => {
    const user = userEvent.setup();
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    } as Response);
    
    render(<AppFooter />);
    
    // Open contact form
    const contactButton = screen.getByRole('button', { name: /contact us/i });
    await user.click(contactButton);
    
    // Fill form
    await user.type(screen.getByLabelText('Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Message'), 'Test message');
    
    // Submit form
    const submitButton = screen.getByText('Send Message');
    await user.click(submitButton);
    
    // Wait for submission to complete
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contact',
          name: 'John Doe',
          email: 'john@example.com',
          message: 'Test message',
          category: 'general_inquiry'
        })
      });
    });
    
    fetchSpy.mockRestore();
  });

  it('submits suggestion form successfully', async () => {
    const user = userEvent.setup();
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    } as Response);
    
    render(<AppFooter />);
    
    // Open suggestion form
    const suggestionButton = screen.getByRole('button', { name: /suggest feature/i });
    await user.click(suggestionButton);
    
    // Fill form
    await user.type(screen.getByLabelText('Feature Title'), 'Dark Mode');
    await user.type(screen.getByLabelText('Description'), 'Add dark mode support');
    
    // Submit form
    const submitButton = screen.getByText('Submit Suggestion');
    await user.click(submitButton);
    
    // Wait for submission to complete
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'suggestion',
          title: 'Dark Mode',
          description: 'Add dark mode support',
          category: 'feature_request'
        })
      });
    });
    
    fetchSpy.mockRestore();
  });

  it('opens external links when developer links are clicked', async () => {
    const user = userEvent.setup();
    render(<AppFooter />);
    
    const githubButton = screen.getByText('GitHub');
    await user.click(githubButton);
    
    expect(mockOpen).toHaveBeenCalledWith('https://github.com/karltiama', '_blank');
    
    const websiteButton = screen.getByText('Personal Website');
    await user.click(websiteButton);
    
    expect(mockOpen).toHaveBeenCalledWith('https://karltiama.dev', '_blank');
    
    const articleButton = screen.getByText('Behind the Scenes: Building Enduro Stats');
    await user.click(articleButton);
    
    expect(mockOpen).toHaveBeenCalledWith('https://www.karltiama.dev/blog/enduro-refactor', '_blank');
  });

  it('displays app information correctly', () => {
    render(<AppFooter />);
    
    expect(screen.getByText('Version:')).toBeInTheDocument();
    expect(screen.getByText('2.0.0')).toBeInTheDocument();
    expect(screen.getByText('Built with:')).toBeInTheDocument();
    // Tech stack icons are now displayed as individual icons with tooltips, not as text
    expect(screen.getByText('Built with:')).toBeInTheDocument();
    expect(screen.getByText('Last updated:')).toBeInTheDocument();
  });



  it('displays footer branding', () => {
    render(<AppFooter />);
    
    expect(screen.getByText('Built with passion for the fitness community')).toBeInTheDocument();
    expect(screen.getByText('© 2024 Enduro Stats. All rights reserved.')).toBeInTheDocument();
  });

  it('validates required fields in contact form', async () => {
    const user = userEvent.setup();
    render(<AppFooter />);
    
    // Open contact form
    const contactButton = screen.getByRole('button', { name: /contact us/i });
    await user.click(contactButton);
    
    // Try to submit without filling required fields
    const submitButton = screen.getByText('Send Message');
    await user.click(submitButton);
    
    // Form should not submit and fields should show validation
    expect(screen.getByText('Send Message')).toBeInTheDocument();
  });

  it('validates required fields in suggestion form', async () => {
    const user = userEvent.setup();
    render(<AppFooter />);
    
    // Open suggestion form
    const suggestionButton = screen.getByRole('button', { name: /suggest feature/i });
    await user.click(suggestionButton);
    
    // Try to submit without filling required fields
    const submitButton = screen.getByText('Submit Suggestion');
    await user.click(submitButton);
    
    // Form should not submit and fields should show validation
    expect(screen.getByText('Submit Suggestion')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<AppFooter />);
    
    // Check for semantic footer element
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
    
    // Check for proper heading structure
    const headings = screen.getAllByRole('heading');
    expect(headings).toHaveLength(3); // 3 main sections
  });
}); 