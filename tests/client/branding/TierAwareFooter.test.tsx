import { render, screen } from '@testing-library/react';
import { TierAwareFooter } from '../../../client/src/components/branding/TierAwareFooter';
import { useAuth } from '../../../client/src/hooks/useAuth';

// Mock dependencies
jest.mock('../../../client/src/hooks/useAuth');
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});
jest.mock('next/image', () => {
  return function MockImage({ src, alt, onError }: { src: string; alt: string; onError?: (e: any) => void }) {
    return <img src={src} alt={alt} onError={onError} data-testid="footer-logo" />;
  };
});

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('TierAwareFooter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Powered by GatherGrove Attribution', () => {
    it('shows "Powered by GatherGrove" for Basic tier users', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          fullName: 'Test User',
          clubs: [{ id: '1', name: 'Test Club', tier: 'Basic' }]
        }
      } as any);

      render(<TierAwareFooter />);

      expect(screen.getByTestId('powered-by-gathergrove')).toBeInTheDocument();
      expect(screen.getByText('Powered by')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'GatherGrove' })).toHaveAttribute('href', 'https://www.gathergrove.club');
    });

    it('shows "Powered by GatherGrove" for Grow tier users', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          fullName: 'Test User',
          clubs: [{ id: '1', name: 'Test Club', tier: 'Grow' }]
        }
      } as any);

      render(<TierAwareFooter />);

      expect(screen.getByTestId('powered-by-gathergrove')).toBeInTheDocument();
    });

    it('hides "Powered by GatherGrove" for Unlimited tier users', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          fullName: 'Test User',
          clubs: [{ id: '1', name: 'Test Club', tier: 'Unlimited' }]
        }
      } as any);

      render(<TierAwareFooter />);

      expect(screen.queryByTestId('powered-by-gathergrove')).not.toBeInTheDocument();
      expect(screen.queryByText('Powered by')).not.toBeInTheDocument();
    });

    it('shows "Powered by GatherGrove" for users with multiple clubs when none are Unlimited', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          fullName: 'Test User',
          clubs: [
            { id: '1', name: 'Basic Club', tier: 'Basic' },
            { id: '2', name: 'Grow Club', tier: 'Grow' }
          ]
        }
      } as any);

      render(<TierAwareFooter />);

      expect(screen.getByTestId('powered-by-gathergrove')).toBeInTheDocument();
    });

    it('hides "Powered by GatherGrove" for users with at least one Unlimited club', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          fullName: 'Test User',
          clubs: [
            { id: '1', name: 'Basic Club', tier: 'Basic' },
            { id: '2', name: 'Unlimited Club', tier: 'Unlimited' }
          ]
        }
      } as any);

      render(<TierAwareFooter />);

      expect(screen.queryByTestId('powered-by-gathergrove')).not.toBeInTheDocument();
    });

    it('shows "Powered by GatherGrove" for unauthenticated users', () => {
      mockUseAuth.mockReturnValue({
        user: null
      } as any);

      render(<TierAwareFooter />);

      expect(screen.getByTestId('powered-by-gathergrove')).toBeInTheDocument();
    });
  });

  describe('Branding Customization', () => {
    it('displays custom logo when branding settings provided', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          fullName: 'Test User',
          clubs: [{ id: '1', name: 'Test Club', tier: 'Unlimited' }]
        }
      } as any);

      const brandingSettings = {
        logo: '/custom-logo.png',
        organizationName: 'Custom Club Name'
      };

      render(<TierAwareFooter brandingSettings={brandingSettings} />);

      const logo = screen.getByTestId('footer-logo');
      expect(logo).toHaveAttribute('src', '/custom-logo.png');
      expect(logo).toHaveAttribute('alt', 'Custom Club Name');
    });

    it('displays custom organization name in description for Unlimited users', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          fullName: 'Test User',
          clubs: [{ id: '1', name: 'Test Club', tier: 'Unlimited' }]
        }
      } as any);

      const brandingSettings = {
        organizationName: 'Custom Club Name'
      };

      render(<TierAwareFooter brandingSettings={brandingSettings} />);

      expect(screen.getByText(/Custom Club Name - Connecting community members/)).toBeInTheDocument();
    });

    it('uses default description for non-Unlimited users regardless of branding settings', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          fullName: 'Test User',
          clubs: [{ id: '1', name: 'Test Club', tier: 'Basic' }]
        }
      } as any);

      const brandingSettings = {
        organizationName: 'Custom Club Name'
      };

      render(<TierAwareFooter brandingSettings={brandingSettings} />);

      expect(screen.getByText(/The simple, affordable, all-in-one platform/)).toBeInTheDocument();
      expect(screen.queryByText(/Custom Club Name - Connecting/)).not.toBeInTheDocument();
    });

    it('displays custom organization name in copyright', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          fullName: 'Test User',
          clubs: [{ id: '1', name: 'Test Club', tier: 'Unlimited' }]
        }
      } as any);

      const brandingSettings = {
        organizationName: 'Custom Club Name'
      };

      render(<TierAwareFooter brandingSettings={brandingSettings} />);

      const currentYear = new Date().getFullYear();
      expect(screen.getByText(`© ${currentYear} Custom Club Name. All rights reserved.`)).toBeInTheDocument();
    });

    it('falls back to default values when no branding settings provided', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          fullName: 'Test User',
          clubs: [{ id: '1', name: 'Test Club', tier: 'Basic' }]
        }
      } as any);

      render(<TierAwareFooter />);

      const logo = screen.getByTestId('footer-logo');
      expect(logo).toHaveAttribute('src', '/logos/horizontal-logo.png');
      expect(logo).toHaveAttribute('alt', 'GatherGrove');

      const currentYear = new Date().getFullYear();
      expect(screen.getByText(`© ${currentYear} GatherGrove. All rights reserved.`)).toBeInTheDocument();
    });
  });

  describe('Override Props', () => {
    it('respects showPoweredBy override to force show attribution', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          fullName: 'Test User',
          clubs: [{ id: '1', name: 'Test Club', tier: 'Unlimited' }]
        }
      } as any);

      render(<TierAwareFooter showPoweredBy={true} />);

      expect(screen.getByTestId('powered-by-gathergrove')).toBeInTheDocument();
    });

    it('respects showPoweredBy override to force hide attribution', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          fullName: 'Test User',
          clubs: [{ id: '1', name: 'Test Club', tier: 'Basic' }]
        }
      } as any);

      render(<TierAwareFooter showPoweredBy={false} />);

      expect(screen.queryByTestId('powered-by-gathergrove')).not.toBeInTheDocument();
    });
  });

  describe('Footer Structure', () => {
    it('renders all required footer sections', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          fullName: 'Test User',
          clubs: [{ id: '1', name: 'Test Club', tier: 'Basic' }]
        }
      } as any);

      render(<TierAwareFooter />);

      expect(screen.getByText('Quick Links')).toBeInTheDocument();
      expect(screen.getByText('Support')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Events' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Members' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Help Center' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Terms of Service' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Privacy Policy' })).toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      mockUseAuth.mockReturnValue({
        user: null
      } as any);

      const { container } = render(<TierAwareFooter className="custom-footer" />);
      const footer = container.querySelector('footer');
      
      expect(footer).toHaveClass('custom-footer');
    });
  });

  describe('Error Handling', () => {
    it('handles missing user gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: undefined
      } as any);

      render(<TierAwareFooter />);

      expect(screen.getByTestId('powered-by-gathergrove')).toBeInTheDocument();
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(`© ${currentYear} GatherGrove. All rights reserved.`)).toBeInTheDocument();
    });

    it('handles missing clubs array gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          fullName: 'Test User',
          clubs: undefined
        }
      } as any);

      render(<TierAwareFooter />);

      expect(screen.getByTestId('powered-by-gathergrove')).toBeInTheDocument();
    });

    it('handles empty clubs array', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          fullName: 'Test User',
          clubs: []
        }
      } as any);

      render(<TierAwareFooter />);

      expect(screen.getByTestId('powered-by-gathergrove')).toBeInTheDocument();
    });
  });
});