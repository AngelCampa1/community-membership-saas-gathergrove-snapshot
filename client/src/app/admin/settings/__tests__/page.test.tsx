import React from 'react';
import { render, screen } from '@testing-library/react';
import SettingsPage from '../page';

// Mock Next.js Link component
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

describe('SettingsPage', () => {
  describe('Page Header', () => {
    it('should display page title', () => {
      render(<SettingsPage />);

      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should display page description', () => {
      render(<SettingsPage />);

      expect(screen.getByText(/manage your account, preferences, and club settings/i)).toBeInTheDocument();
    });
  });

  describe('Settings Cards', () => {
    it('should display Profile settings card', () => {
      render(<SettingsPage />);

      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText(/update your personal information and contact details/i)).toBeInTheDocument();
    });

    it('should display Club Admins settings card', () => {
      render(<SettingsPage />);

      expect(screen.getByText('Club Admins')).toBeInTheDocument();
      expect(screen.getByText(/manage club administrators and send invitations/i)).toBeInTheDocument();
    });

    it('should display Community Chat settings card', () => {
      render(<SettingsPage />);

      expect(screen.getByText('Community Chat')).toBeInTheDocument();
      expect(screen.getByText(/enable or disable club group chat/i)).toBeInTheDocument();
    });

    it('should display Directory Settings card', () => {
      render(<SettingsPage />);

      expect(screen.getByText('Directory Settings')).toBeInTheDocument();
      expect(screen.getByText(/control member directory visibility/i)).toBeInTheDocument();
    });

    it('should display Integrations settings card', () => {
      render(<SettingsPage />);

      expect(screen.getByText('Integrations')).toBeInTheDocument();
      expect(screen.getByText(/connect external services like stripe/i)).toBeInTheDocument();
    });

    it('should display White-Label Branding settings card', () => {
      render(<SettingsPage />);

      expect(screen.getByText('White-Label Branding')).toBeInTheDocument();
      expect(screen.getByText(/customize your club's visual identity/i)).toBeInTheDocument();
    });

    it('should display Billing & Subscription settings card', () => {
      render(<SettingsPage />);

      expect(screen.getByText('Billing & Subscription')).toBeInTheDocument();
      expect(screen.getByText(/manage your subscription and billing information/i)).toBeInTheDocument();
    });

    it('should render all 7 settings cards', () => {
      render(<SettingsPage />);

      const manageButtons = screen.getAllByText('Manage');
      expect(manageButtons.length).toBe(7);
    });
  });

  describe('Navigation Links', () => {
    it('should have correct link for Profile settings', () => {
      render(<SettingsPage />);

      const link = document.querySelector('a[href="/admin/settings/profile"]');
      expect(link).toBeInTheDocument();
    });

    it('should have correct link for Club Admins settings', () => {
      render(<SettingsPage />);

      const link = document.querySelector('a[href="/admin/settings/admins"]');
      expect(link).toBeInTheDocument();
    });

    it('should have correct link for Community Chat settings', () => {
      render(<SettingsPage />);

      const link = document.querySelector('a[href="/admin/settings/chat"]');
      expect(link).toBeInTheDocument();
    });

    it('should have correct link for Directory Settings', () => {
      render(<SettingsPage />);

      const link = document.querySelector('a[href="/admin/settings/directory"]');
      expect(link).toBeInTheDocument();
    });

    it('should have correct link for Integrations settings', () => {
      render(<SettingsPage />);

      const link = document.querySelector('a[href="/admin/settings/integrations"]');
      expect(link).toBeInTheDocument();
    });

    it('should have correct link for White-Label Branding settings', () => {
      render(<SettingsPage />);

      const link = document.querySelector('a[href="/admin/settings/branding"]');
      expect(link).toBeInTheDocument();
    });

    it('should have correct link for Billing & Subscription', () => {
      render(<SettingsPage />);

      const link = document.querySelector('a[href="/admin/billing"]');
      expect(link).toBeInTheDocument();
    });
  });

  describe('Card Actions', () => {
    it('should display Manage button for all available settings', () => {
      render(<SettingsPage />);

      const manageButtons = screen.getAllByRole('button', { name: /manage/i });
      expect(manageButtons.length).toBe(7);
    });

    it('should have clickable Manage buttons for all cards', () => {
      render(<SettingsPage />);

      const manageButtons = screen.getAllByRole('button', { name: /manage/i });
      manageButtons.forEach(button => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('Visual Elements', () => {
    it('should render icons for each settings card', () => {
      render(<SettingsPage />);

      // Each card has an icon wrapped in a div with gradient classes
      const iconWrappers = document.querySelectorAll('.bg-gradient-to-br');
      expect(iconWrappers.length).toBeGreaterThanOrEqual(7);
    });

    it('should render cards in a grid layout', () => {
      render(<SettingsPage />);

      const grid = document.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('md:grid-cols-2');
      expect(grid).toHaveClass('lg:grid-cols-3');
    });

    it('should render all cards with glass styling', () => {
      render(<SettingsPage />);

      const cards = document.querySelectorAll('.glass');
      expect(cards.length).toBeGreaterThanOrEqual(7);
    });
  });

  describe('Tier Indicators', () => {
    it('should indicate Grow tier for Club Admins', () => {
      render(<SettingsPage />);

      expect(screen.getByText(/grow tier/i)).toBeInTheDocument();
    });

    it('should indicate Expand tier for White-Label Branding', () => {
      render(<SettingsPage />);

      expect(screen.getByText(/Expand tier/i)).toBeInTheDocument();
    });
  });

  describe('Card Content', () => {
    it('should display all card titles correctly', () => {
      render(<SettingsPage />);

      const expectedTitles = [
        'Profile',
        'Club Admins',
        'Community Chat',
        'Directory Settings',
        'Integrations',
        'White-Label Branding',
        'Billing & Subscription',
      ];

      expectedTitles.forEach(title => {
        expect(screen.getByText(title)).toBeInTheDocument();
      });
    });

    it('should display descriptions for all cards', () => {
      render(<SettingsPage />);

      // Check that each card has description text
      expect(screen.getByText(/update your personal information/i)).toBeInTheDocument();
      expect(screen.getByText(/manage club administrators/i)).toBeInTheDocument();
      expect(screen.getByText(/enable or disable club group chat/i)).toBeInTheDocument();
      expect(screen.getByText(/control member directory visibility/i)).toBeInTheDocument();
      expect(screen.getByText(/connect external services/i)).toBeInTheDocument();
      expect(screen.getByText(/customize your club's visual identity/i)).toBeInTheDocument();
      expect(screen.getByText(/manage your subscription/i)).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should render main container with proper styling', () => {
      render(<SettingsPage />);

      const mainContainer = document.querySelector('.min-h-screen');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should render settings grid container', () => {
      render(<SettingsPage />);

      const gridContainer = document.querySelector('.grid.gap-6');
      expect(gridContainer).toBeInTheDocument();
    });

    it('should render header section', () => {
      render(<SettingsPage />);

      const header = screen.getByText('Settings').parentElement;
      expect(header).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<SettingsPage />);

      const heading = screen.getByText('Settings');
      expect(heading.tagName).toBe('H1');
    });

    it('should have accessible buttons', () => {
      render(<SettingsPage />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });

    it('should have accessible links', () => {
      render(<SettingsPage />);

      const links = document.querySelectorAll('a[href^="/admin/"]');
      expect(links.length).toBe(7);
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive grid classes', () => {
      render(<SettingsPage />);

      const grid = document.querySelector('.grid');
      expect(grid).toHaveClass('md:grid-cols-2');
      expect(grid).toHaveClass('lg:grid-cols-3');
    });

    it('should have responsive container classes', () => {
      render(<SettingsPage />);

      const container = document.querySelector('.max-w-7xl');
      expect(container).toBeInTheDocument();
    });
  });
});
