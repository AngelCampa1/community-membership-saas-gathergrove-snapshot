import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrandPreview } from '../../../client/src/components/branding/BrandPreview';

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});

describe('BrandPreview', () => {
  const mockBrandSettings = {
    logo: 'https://example.com/logo.png',
    favicon: 'https://example.com/favicon.ico',
    primaryColor: '#3B82F6',
    secondaryColor: '#8B5CF6',
    organizationName: 'Test Club',
    tagline: 'Making connections that matter',
    customCss: '.custom { color: red; }'
  };

  const defaultProps = {
    brandSettings: mockBrandSettings,
    previewMode: 'desktop' as const,
    showResponsive: true,
    onModeChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders preview container with brand settings', () => {
      render(<BrandPreview {...defaultProps} />);
      
      expect(screen.getByTestId('brand-preview')).toBeInTheDocument();
      expect(screen.getByText('Test Club')).toBeInTheDocument();
      expect(screen.getByText('Making connections that matter')).toBeInTheDocument();
    });

    it('displays logo when provided', () => {
      render(<BrandPreview {...defaultProps} />);
      
      const logo = screen.getByAltText(/test club logo/i);
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', 'https://example.com/logo.png');
    });

    it('applies primary and secondary colors to preview elements', () => {
      render(<BrandPreview {...defaultProps} />);
      
      const header = screen.getByTestId('preview-header');
      expect(header).toHaveStyle('background-color: #3B82F6');
      
      const button = screen.getByRole('button', { name: /join now/i });
      expect(button).toHaveStyle('background-color: #8B5CF6');
    });

    it('shows responsive preview controls', () => {
      render(<BrandPreview {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /desktop view/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /tablet view/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /mobile view/i })).toBeInTheDocument();
    });
  });

  describe('Responsive Preview Modes', () => {
    it('switches to tablet view when tablet button is clicked', async () => {
      render(<BrandPreview {...defaultProps} />);
      
      const tabletButton = screen.getByRole('button', { name: /tablet view/i });
      await userEvent.click(tabletButton);
      
      expect(defaultProps.onModeChange).toHaveBeenCalledWith('tablet');
      
      const previewContainer = screen.getByTestId('brand-preview');
      expect(previewContainer).toHaveClass('max-w-2xl'); // Tablet width
    });

    it('switches to mobile view when mobile button is clicked', async () => {
      render(<BrandPreview {...defaultProps} />);
      
      const mobileButton = screen.getByRole('button', { name: /mobile view/i });
      await userEvent.click(mobileButton);
      
      expect(defaultProps.onModeChange).toHaveBeenCalledWith('mobile');
      
      const previewContainer = screen.getByTestId('brand-preview');
      expect(previewContainer).toHaveClass('max-w-sm'); // Mobile width
    });

    it('highlights active preview mode', () => {
      const propsWithMobileMode = {
        ...defaultProps,
        previewMode: 'mobile' as const
      };
      
      render(<BrandPreview {...propsWithMobileMode} />);
      
      const mobileButton = screen.getByRole('button', { name: /mobile view/i });
      expect(mobileButton).toHaveClass('bg-primary', 'text-primary-foreground');
    });
  });

  describe('Real-time Brand Updates', () => {
    it('updates preview when brand settings change', () => {
      const { rerender } = render(<BrandPreview {...defaultProps} />);
      
      const updatedSettings = {
        ...mockBrandSettings,
        primaryColor: '#FF5722',
        organizationName: 'Updated Club'
      };
      
      rerender(<BrandPreview {...defaultProps} brandSettings={updatedSettings} />);
      
      const header = screen.getByTestId('preview-header');
      expect(header).toHaveStyle('background-color: #FF5722');
      expect(screen.getByText('Updated Club')).toBeInTheDocument();
    });

    it('applies custom CSS styles', () => {
      render(<BrandPreview {...defaultProps} />);
      
      const customElement = screen.getByTestId('custom-styled-element');
      expect(customElement).toHaveStyle('color: red');
    });

    it('updates favicon preview', () => {
      render(<BrandPreview {...defaultProps} />);
      
      const faviconPreview = screen.getByTestId('favicon-preview');
      expect(faviconPreview).toHaveAttribute('src', 'https://example.com/favicon.ico');
    });
  });

  describe('Interactive Preview Elements', () => {
    it('renders interactive navigation menu', () => {
      render(<BrandPreview {...defaultProps} />);
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /events/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /directory/i })).toBeInTheDocument();
    });

    it('shows branded login form', () => {
      render(<BrandPreview {...defaultProps} />);
      
      expect(screen.getByRole('form', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      
      const loginButton = screen.getByRole('button', { name: /sign in/i });
      expect(loginButton).toHaveStyle('background-color: #3B82F6');
    });

    it('displays sample event cards with branding', () => {
      render(<BrandPreview {...defaultProps} />);
      
      const eventCards = screen.getAllByTestId('event-card');
      expect(eventCards).toHaveLength(3);
      
      eventCards.forEach(card => {
        expect(card).toHaveStyle('border-color: #8B5CF6');
      });
    });

    it('shows membership tier cards with brand colors', () => {
      render(<BrandPreview {...defaultProps} />);
      
      const membershipCards = screen.getAllByTestId('membership-tier');
      expect(membershipCards).toHaveLength(3);
      
      const premiumCard = screen.getByTestId('premium-tier');
      expect(premiumCard).toHaveStyle('background-color: #3B82F6');
    });
  });

  describe('Brand Consistency Validation', () => {
    it('validates color contrast in preview', () => {
      const lowContrastSettings = {
        ...mockBrandSettings,
        primaryColor: '#FFFF00', // Yellow on white background
        secondaryColor: '#FFFFFF'
      };
      
      render(<BrandPreview {...defaultProps} brandSettings={lowContrastSettings} />);
      
      expect(screen.getByRole('alert', { name: /contrast warning/i })).toBeInTheDocument();
      expect(screen.getByText(/may not meet accessibility standards/i)).toBeInTheDocument();
    });

    it('shows branding consistency score', () => {
      render(<BrandPreview {...defaultProps} />);
      
      const consistencyScore = screen.getByTestId('consistency-score');
      expect(consistencyScore).toBeInTheDocument();
      expect(consistencyScore).toHaveTextContent(/consistency: [0-9]+%/i);
    });

    it('highlights potential branding issues', () => {
      const problematicSettings = {
        ...mockBrandSettings,
        logo: null, // Missing logo
        organizationName: ''
      };
      
      render(<BrandPreview {...defaultProps} brandSettings={problematicSettings} />);
      
      expect(screen.getByText(/missing logo/i)).toBeInTheDocument();
      expect(screen.getByText(/organization name required/i)).toBeInTheDocument();
    });
  });

  describe('Export and Sharing', () => {
    it('provides screenshot export functionality', async () => {
      // Mock html2canvas
      const mockHtml2Canvas = jest.fn().mockResolvedValue({
        toDataURL: jest.fn().mockReturnValue('data:image/png;base64,mock-image')
      });
      
      jest.doMock('html2canvas', () => mockHtml2Canvas);
      
      render(<BrandPreview {...defaultProps} />);
      
      const exportButton = screen.getByRole('button', { name: /export preview/i });
      await userEvent.click(exportButton);
      
      expect(mockHtml2Canvas).toHaveBeenCalled();
    });

    it('generates shareable preview link', async () => {
      render(<BrandPreview {...defaultProps} />);
      
      const shareButton = screen.getByRole('button', { name: /share preview/i });
      await userEvent.click(shareButton);
      
      const shareUrl = screen.getByRole('textbox', { name: /preview url/i }) as HTMLInputElement;
      expect(shareUrl.value).toMatch(/\/preview\/[a-f0-9-]+/);
    });

    it('copies preview URL to clipboard', async () => {
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn().mockResolvedValue(undefined)
        }
      });
      
      render(<BrandPreview {...defaultProps} />);
      
      const shareButton = screen.getByRole('button', { name: /share preview/i });
      await userEvent.click(shareButton);
      
      const copyButton = screen.getByRole('button', { name: /copy url/i });
      await userEvent.click(copyButton);
      
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      expect(screen.getByText(/url copied/i)).toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    it('lazy loads preview images', () => {
      render(<BrandPreview {...defaultProps} />);
      
      const logo = screen.getByAltText(/test club logo/i);
      expect(logo).toHaveAttribute('loading', 'lazy');
    });

    it('debounces real-time updates', async () => {
      const { rerender } = render(<BrandPreview {...defaultProps} />);
      
      // Rapid updates should be debounced
      for (let i = 0; i < 5; i++) {
        const updatedSettings = {
          ...mockBrandSettings,
          primaryColor: `#${i}${i}${i}${i}${i}${i}`
        };
        rerender(<BrandPreview {...defaultProps} brandSettings={updatedSettings} />);
      }
      
      // Should only render final state
      await waitFor(() => {
        const header = screen.getByTestId('preview-header');
        expect(header).toHaveStyle('background-color: #444444');
      });
    });

    it('virtualizes long lists in preview', () => {
      const settingsWithManyEvents = {
        ...mockBrandSettings,
        sampleEvents: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `Event ${i}`,
          date: new Date()
        }))
      };
      
      render(<BrandPreview {...defaultProps} brandSettings={settingsWithManyEvents} />);
      
      // Should only render visible events
      const visibleEvents = screen.getAllByTestId('event-card');
      expect(visibleEvents.length).toBeLessThan(20);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for preview controls', () => {
      render(<BrandPreview {...defaultProps} />);
      
      const previewContainer = screen.getByRole('region', { name: /brand preview/i });
      expect(previewContainer).toBeInTheDocument();
      
      const viewportControls = screen.getByRole('group', { name: /viewport selection/i });
      expect(viewportControls).toBeInTheDocument();
    });

    it('provides keyboard navigation for interactive elements', async () => {
      render(<BrandPreview {...defaultProps} />);
      
      const desktopButton = screen.getByRole('button', { name: /desktop view/i });
      desktopButton.focus();
      
      expect(desktopButton).toHaveFocus();
      
      fireEvent.keyDown(desktopButton, { key: 'ArrowRight' });
      
      const tabletButton = screen.getByRole('button', { name: /tablet view/i });
      expect(tabletButton).toHaveFocus();
    });

    it('announces preview mode changes to screen readers', async () => {
      render(<BrandPreview {...defaultProps} />);
      
      const tabletButton = screen.getByRole('button', { name: /tablet view/i });
      await userEvent.click(tabletButton);
      
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent(/switched to tablet view/i);
    });

    it('has semantic markup for preview content', () => {
      render(<BrandPreview {...defaultProps} />);
      
      expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
      expect(screen.getByRole('navigation')).toBeInTheDocument(); // Nav menu
      expect(screen.getByRole('main')).toBeInTheDocument(); // Main content
      expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // Footer
    });
  });

  describe('Error Handling', () => {
    it('handles missing logo gracefully', () => {
      const settingsWithoutLogo = {
        ...mockBrandSettings,
        logo: null
      };
      
      render(<BrandPreview {...defaultProps} brandSettings={settingsWithoutLogo} />);
      
      const logoPlaceholder = screen.getByTestId('logo-placeholder');
      expect(logoPlaceholder).toBeInTheDocument();
      expect(screen.getByText(/no logo uploaded/i)).toBeInTheDocument();
    });

    it('falls back to default colors when invalid colors provided', () => {
      const settingsWithInvalidColors = {
        ...mockBrandSettings,
        primaryColor: 'invalid-color',
        secondaryColor: '#ZZZZZZ'
      };
      
      render(<BrandPreview {...defaultProps} brandSettings={settingsWithInvalidColors} />);
      
      const header = screen.getByTestId('preview-header');
      expect(header).toHaveStyle('background-color: #3B82F6'); // Default blue
    });

    it('handles image loading errors', async () => {
      render(<BrandPreview {...defaultProps} />);
      
      const logo = screen.getByAltText(/test club logo/i);
      fireEvent.error(logo);
      
      await waitFor(() => {
        expect(screen.getByTestId('logo-error-placeholder')).toBeInTheDocument();
      });
    });
  });
});
