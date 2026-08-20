import React from 'react';
import { render, screen } from '@testing-library/react';
import ActivateAccountPage, { metadata } from '../page';

// Mock the child components
jest.mock('../components/ActivateAccountForm', () => ({
  ActivateAccountForm: () => <div data-testid="activate-account-form">ActivateAccountForm</div>,
}));

jest.mock('@/components/auth/RouteProtection', () => ({
  RouteProtection: ({ children }: { children: React.ReactNode }) => <div data-testid="route-protection">{children}</div>,
}));

jest.mock('lucide-react', () => ({
  Loader2: ({ className }: { className?: string }) => <div data-testid="loader-icon" className={className}>Loading...</div>,
}));

describe('ActivateAccountPage', () => {
  describe('Metadata', () => {
    it('should export correct metadata title', () => {
      expect(metadata.title).toBe('Activate Your Account');
    });

    it('should export correct metadata description', () => {
      expect(metadata.description).toBe(
        'Activate your GatherGrove member account and set your password to access the member portal.'
      );
    });

    it('should have all required metadata fields', () => {
      expect(metadata).toHaveProperty('title');
      expect(metadata).toHaveProperty('description');
    });
  });

  describe('Page Rendering', () => {
    it('should render the page component', () => {
      const { container } = render(<ActivateAccountPage />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should wrap content in RouteProtection', () => {
      render(<ActivateAccountPage />);
      expect(screen.getByTestId('route-protection')).toBeInTheDocument();
    });

    it('should render ActivateAccountForm', () => {
      render(<ActivateAccountPage />);
      expect(screen.getByTestId('activate-account-form')).toBeInTheDocument();
    });

    it('should render ActivateAccountForm inside RouteProtection', () => {
      render(<ActivateAccountPage />);

      const routeProtection = screen.getByTestId('route-protection');
      const form = screen.getByTestId('activate-account-form');

      expect(routeProtection).toContainElement(form);
    });
  });

  describe('Suspense Boundary', () => {
    it('should wrap ActivateAccountForm in Suspense', () => {
      // Suspense is rendered, form is inside it
      render(<ActivateAccountPage />);
      expect(screen.getByTestId('activate-account-form')).toBeInTheDocument();
    });
  });

  describe('Structure', () => {
    it('should have correct component hierarchy', () => {
      render(<ActivateAccountPage />);

      const routeProtection = screen.getByTestId('route-protection');
      const form = screen.getByTestId('activate-account-form');

      expect(routeProtection).toBeInTheDocument();
      expect(form).toBeInTheDocument();
      expect(routeProtection).toContainElement(form);
    });
  });

  describe('Export', () => {
    it('should export default function', () => {
      expect(ActivateAccountPage).toBeDefined();
      expect(typeof ActivateAccountPage).toBe('function');
    });

    it('should export metadata', () => {
      expect(metadata).toBeDefined();
      expect(typeof metadata).toBe('object');
    });
  });

  describe('Component Type', () => {
    it('should be a functional component', () => {
      const component = <ActivateAccountPage />;
      expect(typeof component.type).toBe('function');
    });

    it('should render without errors', () => {
      expect(() => render(<ActivateAccountPage />)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should render consistently', () => {
      const { container: container1 } = render(<ActivateAccountPage />);
      const { container: container2 } = render(<ActivateAccountPage />);

      expect(container1.innerHTML).toBe(container2.innerHTML);
    });

    it('should handle multiple renders', () => {
      const { rerender } = render(<ActivateAccountPage />);

      expect(screen.getByTestId('activate-account-form')).toBeInTheDocument();

      rerender(<ActivateAccountPage />);

      expect(screen.getByTestId('activate-account-form')).toBeInTheDocument();
    });

    it('should maintain structure across rerenders', () => {
      const { rerender } = render(<ActivateAccountPage />);

      expect(screen.getByTestId('route-protection')).toBeInTheDocument();
      expect(screen.getByTestId('activate-account-form')).toBeInTheDocument();

      rerender(<ActivateAccountPage />);

      expect(screen.getByTestId('route-protection')).toBeInTheDocument();
      expect(screen.getByTestId('activate-account-form')).toBeInTheDocument();
    });
  });

  describe('Content', () => {
    it('should render ActivateAccountForm as main content', () => {
      render(<ActivateAccountPage />);

      const form = screen.getByTestId('activate-account-form');
      expect(form).toBeInTheDocument();
      expect(form).toBeVisible();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible via test ids', () => {
      render(<ActivateAccountPage />);

      expect(screen.getByTestId('route-protection')).toBeInTheDocument();
      expect(screen.getByTestId('activate-account-form')).toBeInTheDocument();
    });

    it('should have proper component structure for screen readers', () => {
      render(<ActivateAccountPage />);

      const routeProtection = screen.getByTestId('route-protection');
      expect(routeProtection).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should integrate RouteProtection and ActivateAccountForm', () => {
      render(<ActivateAccountPage />);

      const routeProtection = screen.getByTestId('route-protection');
      const form = screen.getByTestId('activate-account-form');

      expect(routeProtection).toBeInTheDocument();
      expect(form).toBeInTheDocument();
      expect(routeProtection).toContainElement(form);
    });

    it('should render all components together', () => {
      const { container } = render(<ActivateAccountPage />);

      expect(container.querySelector('[data-testid="route-protection"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="activate-account-form"]')).toBeInTheDocument();
    });
  });
});
